import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Avenue Ladies Salon - Salon Management",
    short_name: "Avenue Salon",
    description:
      "Salon management system for managing customers, appointments, services, invoices and payments.",

    start_url: "/",
    display: "standalone",

    background_color: "#ffffff",
    theme_color: "#ffffff",

    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
