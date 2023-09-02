import { t } from "i18next";
import { useStoryblokApi } from "@storyblok/astro";
import type { Path, SbLink } from "./types";

export async function generatePathsFromStories() {
  const storyblokApi = useStoryblokApi();
  const version = getVersion();

  // Retrieves all links from storyblok
  const {
    data: { links: dataLinks },
  } = (await storyblokApi.get("cdn/links", {
    version, // TODO check: this is not working as expected as is retriving all links
  })) as { data: { links: SbLink[] } };

  const home: Path[] = [
    {
      params: {
        path: undefined,
      },
      props: {
        slug: "home",
        title: t("home", { lng: "en" }),
        lang: "en",
      },
    },
    {
      params: {
        path: "en",
      },
      props: {
        slug: "home",
        title: t("home", { lng: "en" }),
        lang: "en",
      },
    },
    {
      params: {
        path: "es",
      },
      props: {
        slug: "home",
        title: t("home", { lng: "es" }),
        lang: "es",
      },
    },
  ];

  // Format links to astro static paths
  const links = Object.values(dataLinks).reduce((links, link) => {
    if (link.published === false && version === "published") {
      return links;
    }
    if (!link.is_startpage && link.slug !== "config") {
      const root = link.slug.split("/")[0];
      links.push({
        params: {
          path: link.slug,
        },
        props: {
          slug: `${link.slug}${link.is_folder ? "/" : ""}`,
          title: link.name,
          lang: "en",
        },
      });
      links.push({
        params: {
          path: `en/${link.slug.replace(root, t(root, { lng: "en" }))}`,
        },
        props: {
          slug: `${link.slug}${link.is_folder ? "/" : ""}`,
          title: t(link.name, { lng: "en" }),
          lang: "en",
        },
      });
      links.push({
        params: {
          path: `es/${link.slug.replace(root, t(root, { lng: "es" }))}`,
        },
        props: {
          slug: `${link.slug}${link.is_folder ? "/" : ""}`,
          title: t(link.name, { lng: "es" }),
          lang: "es",
        },
      });
    }
    return links;
  }, [] as Path[]);

  links.push(...home);

  return links;
}

export function getVersion() {
  return import.meta.env.STORYBLOK_PREVIEW_ENABLED === "true"
    ? "draft"
    : "published";
}

export function getStoriesLocalizedPath(stories: any[]) {
  return stories.map((s) => getStoryLocalizedPath(s));
}

export function getStoryLocalizedPath(story: any) {
  const rootSlug = story.full_slug.replace("es/", "").split("/")[0];
  return {
    localizedSlug: story.full_slug.replace(rootSlug, t(rootSlug)),
    name: t(story.name.toLowerCase() || story.slug),
  };
}

export function getDate(fromDate?: string, toDate?: string, lang?: string) {
  const from = formatDate(fromDate);
  const to = formatDate(toDate);
  const dateField = from == to ? from : `${from} - ${to}`;

  function formatDate(date: string) {
    const dtFormat = new Intl.DateTimeFormat(lang, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return date ? dtFormat.format(new Date(date)) : dtFormat.format(new Date());
  }
  return dateField;
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
