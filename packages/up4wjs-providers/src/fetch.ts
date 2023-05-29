function loader(m: any) {
  return (m && m.default) || m;
}

const fetcher =
  typeof window && typeof window.fetch === "function"
    ? window.fetch
    : function (url: string, opts: RequestInit) {
        if (typeof url === "string" || (url as any) instanceof URL) {
          url = String(url).replace(/^\/\//g, "https://");
        }
        return import("node-fetch").then((m) => loader(m)(url, opts));
      };

export default fetcher;
