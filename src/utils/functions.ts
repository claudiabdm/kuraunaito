import { t } from "i18next";
import { useStoryblokApi } from "@storyblok/astro";
import type { Path, SbLink } from "./types";

export async function generatePathsFromStories() {
  const storyblokApi = useStoryblokApi();

  // Retrieves all links from storyblok
  const {
    data: { links: dataLinks },
  } = (await storyblokApi.get("cdn/links", {
    version: getVersion(),
  })) as { data: { links: SbLink[] } };

  // Format links to astro static paths
  return Object.values(dataLinks).reduce((links, link) => {
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

export function getDate(date?: string) {
  return date
    ? new Date(date).toLocaleDateString()
    : new Date().toLocaleDateString();
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
