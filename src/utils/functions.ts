import i18next, { t } from "i18next";
import { useStoryblokApi } from "@storyblok/astro";
import {
  LANGUAGES,
  type Breadcrumb,
  type Language,
  type Path,
  type SbLink,
  type Story,
} from "./types";

const DEFAULT_PATH: {
  [k in Language | "default"]: Path;
} = {
  default: {
    params: {
      path: undefined,
    },
    props: {
      title: "home",
      slug: "home",
      lang: "en",
      breadcrumbs: [
        {
          path: "",
          name: t("home", { lng: "" }),
        },
      ],
    },
  },
  ...LANGUAGES.reduce(
    (acc, lang) => {
      acc[lang] = {
        params: {
          path: lang,
        },
        props: {
          title: t("home", { lng: lang }),
          slug: "home",
          lang: lang,
          breadcrumbs: [
            {
              path: lang,
              name: t("home", { lng: lang }),
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
  lang?: Language,
  breadcrumbs: Breadcrumb[] = DEFAULT_PATH[lang ?? "default"].props.breadcrumbs
): Path {
  const root = link.slug.split("/")[0];

  if (lang) {
    const path = `${lang}/${link.slug.replace(root, t(root, { lng: lang }))}`;
    return {
      params: { path },
      props: {
        title: t(link.name, { lng: lang }),
        slug: `${link.slug}${link.is_folder ? "/" : ""}`,
        lang: lang,
        breadcrumbs: [
          ...breadcrumbs,
          {
            path,
            name: t(link.name.toLowerCase(), { lng: lang }),
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
  lang?: Language,
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
    links.push(parent.default);

    for (const lang of LANGUAGES) {
      links.push(parent[lang]);
      links.push(...massageLinks(dataLinks, lang));
    }

    return links;
  } catch (err) {
    console.log("generatePathFromStories", err);
  }
  return [];
}

// With params and without slug
export async function getStories({
  params,
}: {
  params: string;
}): Promise<{ data: { stories: Story[] }; header: string }>;
// With slug
export async function getStories({
  slug,
}: {
  params?: string;
  slug: string;
}): Promise<{ data: { story: Story }; header: string }>;
// Function definition
export async function getStories({
  params,
  slug,
}: {
  params?: string;
  slug?: string;
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
        language: i18next.language,
        version: getVersion(),
      }
    );
    return data;
  } catch (err) {
    console.log("getStories", err);
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
  rootPath?: string
): Breadcrumb[] {
  return stories.map((s) => getStoryLocalizedPath(s, rootPath));
}

export function getStoryLocalizedPath(
  story: any,
  rootPath?: string
): Breadcrumb {
  const folder =
    story.lang === "default"
      ? story.full_slug.split("/")[0]
      : story.full_slug.split("/")[1];
  const localizedPath = story.full_slug.replace(folder, t(folder));
  return {
    path: rootPath?.startsWith("en") ? "en/" + localizedPath : localizedPath,
    name: t(story.name.toLowerCase() || story.slug),
  };
}

export function getDate(fromDate?: string, toDate: string = fromDate) {
  const from = formatDate(fromDate);
  const to = formatDate(toDate);
  const dateField = from == to ? from : `${from} - ${to}`;
  return dateField;
}

export function formatDate(
  date: string,
  lang: string = i18next.language,
  short: boolean = false
) {
  const dtFormat = new Intl.DateTimeFormat(lang, {
    year: "numeric",
    month: short ? "numeric" : "long",
    day: "numeric",
  });
  return date ? dtFormat.format(new Date(date)) : dtFormat.format(new Date());
}

export function getSize(filename?: string): { width: number; height: number } {
  if (filename) {
    const [width, height] = filename
      .replace("https://a.storyblok.com/f/", "")
      .split("/")[1]
      .split("x");
    return { width: Number(width), height: Number(height) };
  }
}

export function getAspectRatio(entry): string {
  if (entry?.filename) {
    const { width, height } = getSize(entry.filename);
    return `1:${width / height}`;
  }
}
