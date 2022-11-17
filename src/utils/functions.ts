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
      const translatedSlug = link.alternates.reduce((acc, alt) => {
        acc.set(alt.lang, {
          ...alt,
          path: `${alt.path}${link.is_folder ? "/" : ""}`,
        });
        return acc;
      }, new Map());
      // default route without locale in url
      links.push({
        params: {
          path: link.slug,
        },
        props: {
          slug: `${link.slug}${link.is_folder ? "/" : ""}`,
          lang: "en",
          title: link.name,
          translatedSlug,
        },
      });

      // localized routes
      for (const alt of link.alternates) {
        links.push({
          params: {
            path: `${alt.lang}/${alt.path}`,
          },
          props: {
            slug: `${link.slug}${link.is_folder ? "/" : ""}`,
            lang: alt.lang,
            title: alt.name || link.name,
            translatedSlug,
          },
        });
      }
    }

    return links;
  }, [] as Path[]);
}

export function getVersion() {
  return import.meta.env.STORYBLOK_PREVIEW_ENABLED === "true"
    ? "draft"
    : "published";
}

export function getTranslatedName(story) {
  const translatedSlug = story?.translated_slugs?.find(
    (s) => s.lang === story.lang
  );
  return translatedSlug?.name || story.name;
}

export function getYear(year?: number) {
  return year || new Date().getFullYear();
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
