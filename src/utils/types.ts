import type { Language } from "../i18n/ui";

export interface SbLink {
  id: string;
  parent_id: string;
  slug: string;
  full_slug: string;
  name: string;
  is_startpage: boolean;
  is_folder: boolean;
  published: boolean;
}

export interface Story {
  slug: string;
  full_slug: string;
  name: string;
  content: {
    component: string,
    entries?: {
      filename: string,
      type: 'asset'
    }[], [key: string]: any
  };
  published_at: string;
}

export interface Path {
  params: {
    path: string;
  };
  props: {
    slug: string;
    lang: Language;
    title: string;
    breadcrumbs: Breadcrumb[];
  };
}

export interface Breadcrumb {
  path: string;
  name: string;
  slug?: string;
}

export interface Image {
  width: number;
  height: number;
  id: string;
  alt: string;
  filename: string;
}
