import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://dnlbox.github.io",
  base: "/fhir-test-data",
  integrations: [
    starlight({
      title: "fhir-test-data",
      description:
        "TypeScript library and CLI for generating valid FHIR R4/R4B/R5 test resources with country-aware identifiers.",
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        replacesTitle: false,
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/dnlbox/fhir-test-data",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/dnlbox/fhir-test-data/edit/main/docs/site/src/content/docs/",
      },
      customCss: [
        "@fontsource-variable/plus-jakarta-sans/index.css",
        "@fontsource/ibm-plex-mono/400.css",
        "@fontsource/ibm-plex-mono/400-italic.css",
        "@fontsource/ibm-plex-mono/700.css",
        "./src/styles/custom.css",
      ],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "CLI Reference",
          autogenerate: { directory: "cli" },
        },
        {
          label: "Locales",
          autogenerate: { directory: "locales" },
        },
        {
          label: "Library API",
          autogenerate: { directory: "api" },
        },
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
      ],
      components: {
        // Use defaults — no custom overrides needed
      },
      lastUpdated: true,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
    }),
  ],
  legacy: {
    collections: true,
  },
});
