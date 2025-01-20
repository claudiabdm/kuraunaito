import { useStoryblokApi } from "@storyblok/astro";
import {
  type Breadcrumb,
  type Path,
  type SbLink,
  type Story,
} from "./types";
import { t } from "../i18n/utils";
import { defaultLang, LANGUAGES, type Language } from "../i18n/ui";

const DEFAULT_PATH: {
  [k in Language]: Path;
} = {
  ...LANGUAGES.reduce(
    (acc, lang) => {
      acc[lang] = {
        params: {
          path: lang == defaultLang ? undefined : lang,
        },
        props: {
          title: t("home", lang),
          slug: "home",
          lang: lang,
          breadcrumbs: [
            {
              path: lang == defaultLang ? "" : lang,
              name: t("home", lang),
            },
          ],
        },
      };
      return acc;
    },
    {} as {
      [k in Language]: Path;
    }
  ),
};
function massageLink(
  link: SbLink,
  lang: Language = defaultLang,
  breadcrumbs: Breadcrumb[] = DEFAULT_PATH[lang].props.breadcrumbs
): Path {
  const root = link.slug.split("/")[0];

  if (lang !== "en") {
    const path = `${lang}/${link.slug.replace(root, t(root, lang))}`;
    const localizedName = t(link.name.toLowerCase().replace(' ', '-'), lang).replace('-', ' ');
    return {
      params: { path },
      props: {
        title: localizedName,
        slug: `${link.slug}${link.is_folder ? "/" : ""}`,
        lang: lang,
        breadcrumbs: [
          ...breadcrumbs,
          {
            path,
            name: localizedName,
          },
        ],
      },
    };
  }
  return {
    params: {
      path: link.slug,
    },
    props: {
      title: link.name,
      slug: `${link.slug}${link.is_folder ? "/" : ""}`,
      lang: "en",
      breadcrumbs: [
        ...breadcrumbs,
        {
          path: link.slug,
          name: link.name,
        },
      ],
    },
  };
}

function massageLinks(
  dataLinks: SbLink[],
  lang: Language = defaultLang,
  breadcrumbs?: Breadcrumb[]
): Path[] {
  const links: Path[] = [];

  for (const link of dataLinks) {
    if (!link.is_startpage && link.slug !== "config") {
      if (link.parent_id) {
        const parentLink = dataLinks.find((l) => l.id === link.parent_id);
        const parentBreadcrumbs = massageLink(parentLink, lang, breadcrumbs)
          .props.breadcrumbs;
        links.push(massageLink(link, lang, parentBreadcrumbs));
      } else {
        links.push(massageLink(link, lang, breadcrumbs));
      }
    }
  }
  return links;
}

export async function generatePathsFromStories() {
  const storyblokApi = useStoryblokApi();

  try {
    // Retrieves all links from storyblok
    const dataLinks = (await storyblokApi.getAll("cdn/links", {
      version: getVersion(),
    })) as SbLink[];

    const parent = DEFAULT_PATH;

    // Format links to astro static paths
    const links = massageLinks(dataLinks);
    links.push(parent[defaultLang]);

    for (const lang of LANGUAGES) {
      if (lang !== defaultLang) {
        links.push(parent[lang]);
        links.push(...massageLinks(dataLinks, lang));
      }
    }

    return links;
  } catch (err) {
    console.error("generatePathsFromStories", err);
  }
  return [];
}

// With params and without slug
export async function getStories({
  params,
  lang
}: {
  params: string;
  lang?: Language
}): Promise<{ data: { stories: Story[] }; header: string }>;
// With slug
export async function getStories({
  slug,
  lang
}: {
  params?: string;
  lang?: Language
  slug: string;
}): Promise<{ data: { story: Story }; header: string }>;
// Function definition
export async function getStories({
  params,
  slug,
  lang = defaultLang
}: {
  params?: string;
  slug?: string;
  lang?: Language
}): Promise<{
  data: { stories?: Story[]; story?: Story };
  header: Object;
}> {
  try {
    const searchParams = new URLSearchParams(params);
    const paramsObj = {};
    for (const [key, value] of searchParams) {
      paramsObj[key] = value;
    }
    const storyblokApi = useStoryblokApi();
    const data = await storyblokApi.get(
      `cdn/stories${slug ? `/${slug}` : ""}`,
      {
        ...paramsObj,
        language: lang,
        version: getVersion(),
      }
    );
    return data;
  } catch (err) {
    console.error("getStories", err);
  }
}

export function getVersion() {
  return import.meta.env.STORYBLOK_PREVIEW_ENABLED === true
    ? "draft"
    : "published";
}

export function getToken() {
  return import.meta.env.STORYBLOK_PREVIEW_ENABLED === true
    ? import.meta.env.STORYBLOK_PREVIEW
    : import.meta.env.STORYBLOK_PUBLISHED;
}

export function getStoriesLocalizedPath(
  stories: any[],
  lang: Language = defaultLang
): Breadcrumb[] {
  return stories.map((s) => getStoryLocalizedPath(s, lang));
}

export function getStoryLocalizedPath(
  story: any,
  lang: Language = defaultLang
): Breadcrumb {
  const folder =
    story.lang === "default"
      ? story.full_slug.split("/")[0]
      : story.full_slug.split("/")[1];
  const localizedPath = lang === "en" ? story.full_slug : `${lang}/${story.full_slug.replace(folder, t(folder, lang))}`;
  const localizeName = t(story.name.toLowerCase().replace(' ', '-'), lang);
  return {
    path: localizedPath,
    name: localizeName.replace('-', ' '),
    slug: story.slug
  };
}

export function getDate(fromDate: string, toDate?: string, lang: string = defaultLang) {
  const from = formatDate(fromDate, lang);
  const to = formatDate(toDate, lang);
  const dateField = (toDate == null || toDate == '') ? from : `${from} - ${to}`;
  return dateField;
}

export function formatDate(
  date: string,
  lang: string = defaultLang,
  short: boolean = false
) {
  const dtFormat = new Intl.DateTimeFormat(lang, {
    year: "numeric",
    month: short ? "numeric" : "long",
    day: "numeric",
  });
  return date ? dtFormat.format(new Date(date)) : dtFormat.format(new Date());
}

export function getSize(filename: string = ''): { width: number; height: number } {
  const [width, height] = filename
    .replace("https://a.storyblok.com/f/", "")
    .split("/")[1]
    .split("x");
  return { width: Number(width), height: Number(height) };
}

export function getAspectRatio(entry): string {
  if (entry?.filename) {
    const { width, height } = getSize(entry.filename);
    return `1:${width / height}`;
  }
}
