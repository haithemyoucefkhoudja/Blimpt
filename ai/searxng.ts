import axios from "axios";
interface SearxngSearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
}

export interface SearxngSearchResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
}

export const searchSearxng = async (
  query: string,
  port: string,
  opts?: SearxngSearchOptions
) => {
  const url = new URL(`http://localhost:${port}/search?format=json`);
  url.searchParams.append("q", query);

  if (opts) {
    Object.keys(opts).forEach((key) => {
      if (Array.isArray((opts as any)[key])) {
        url.searchParams.append(key, (opts as any)[key].join(","));
        return;
      }
      url.searchParams.append(key, (opts as any)[key]);
    });
  }

  const res = await axios.get(url.toString());
  const results: SearxngSearchResult[] = res.data.results;
  const suggestions: string[] = res.data.suggestions;

  return { results, suggestions };
};
