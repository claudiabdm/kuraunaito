export interface SbLink {
  slug: string;
  name: string;
  is_startpage: boolean;
  is_folder: boolean;
}

export interface Path {
  params: {
    path: string;
  };
  props: {
    slug: string;
    lang: string;
    title: string;
  };
}

export interface Image {
  width: number;
  height: number;
  id: string;
  alt: string;
  filename: string;
}
