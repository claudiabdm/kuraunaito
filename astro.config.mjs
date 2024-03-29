import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import storyblok from "@storyblok/astro";
import astroI18next from "astro-i18next";
import * as dotenv from "dotenv";

dotenv.config();
const storyblokConfig =
  process.env.STORYBLOK_PREVIEW_ENABLED === "true"
    ? {
      accessToken: process.env.STORYBLOK_PREVIEW,
      bridge: true,
    }
    : {
      accessToken: process.env.STORYBLOK_PUBLISHED,
      bridge: false,
    };
// https://astro.build/config
export default defineConfig({
  site: process.env.SITE,
  prefetch: {
    prefetchAll: true
  },
  build: {
    inlineStylesheets: 'auto'
  },
  image: {
    domains: ["a.storyblok.com"],
    service: {
      entrypoint: './storyblok-image-service',
      endpoint: `https://a.storyblok.com/f/${process.env.STORYBLOK_SPACE_ID}`, // https://www.storyblok.com/tp/optimize-your-storyblok-images-with-image-engine#structure-of-the-url-of-an-image
    }
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "en",
        // All urls that don't contain `es` or `fr` after `https://stargazers.club/` will be treated as default locale, i.e. `en`
        locales: {
          en: "en",
          // The `defaultLocale` value must present in `locales` keys
          es: "es",
        },
      },
    }),
    storyblok({
      ...storyblokConfig,
      components: {
        page: "components/Page",
        text: "components/Text",
        entriesEntry: "components/EntriesEntry",
        entriesList: "components/EntriesList",
        columns: "components/Columns",
        rows: "components/Rows",
        spline: "components/Spline",
        blogPost: "components/BlogPost",
      },
    }),
    astroI18next(),
  ],
});
