export type Volume = {
  coverFilename: string;
  title: string;
  pdfFilename: string;
};

export type Series = {
  id: string;
  name: string;
  folder: string;
  volumes: Volume[];
};

export type Manifest = {
  series: Series[];
};
