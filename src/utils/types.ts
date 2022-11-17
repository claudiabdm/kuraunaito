import type { Params, Props } from "astro";

export interface SbLink {
  slug: string;
  name: string;
  is_startpage: boolean;
  is_folder: boolean;
  alternates: {
    path: string;
    name: string;
    lang: "en" | "es";
  }[];
}

export interface Path {
  params: {
    path: string;
  };
  props: {
    slug: string;
    lang: string;
    title: string;
    translatedSlug?: Map<string, { path: string; name: string }>; // K is language code
  };
}
