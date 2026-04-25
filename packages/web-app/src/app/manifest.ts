import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "記事冷凍庫 - Article Freezer",
    short_name: "記事冷凍庫",
    start_url: "/auth/signin",
    display: "standalone",
    background_color: "#fdfdfd",
    theme_color: "#7033ff",
    icons: [
      {
        purpose: "any",
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        purpose: "any",
        src: "/icons/icon-512-rounded.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        purpose: "maskable",
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
