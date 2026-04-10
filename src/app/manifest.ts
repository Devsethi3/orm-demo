import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Xocket - Structured Startup Execution Partner",
    short_name: "Xocket",
    description:
      "Partner with Xocket for structured product execution and scaling. Design, build, and launch production-ready products with proven methodologies and support.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#000000",
    background_color: "#000000",
    categories: ["productivity", "business"],
    screenshots: [
      {
        src: "/og-image.png",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/og-image.png",
        sizes: "540x720",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
