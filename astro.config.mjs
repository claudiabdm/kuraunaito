import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import netlify from "@astrojs/netlify/functions";
import storyblok from "@storyblok/astro";
import astroI18next from "astro-i18next";
import * as dotenv from "dotenv";

dotenv.config();
const storyblokConfig = {
  accessToken: process.env.STORYBLOK_PREVIEW,
  bridge: true,
};
// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: netlify(),
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
        entriesListLatest: "components/EntriesListLatest",
        entriesEntry: "components/EntriesEntry",
        entriesList: "components/EntriesList",
        columns: "components/Columns",
        rows: "components/Rows",
        spline: "components/Spline",
      },
    }),
    astroI18next(),
  ],
});
