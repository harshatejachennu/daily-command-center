import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily Command Center",
    short_name: "Command Center",
    description: "Personal daily priority dashboard",
    display: "standalone",
    start_url: "/",
    scope: "/",
    orientation: "portrait",
    theme_color: "#0071e3",
    background_color: "#f2f2f7",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
