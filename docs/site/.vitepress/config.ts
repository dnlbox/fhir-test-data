import { defineConfig } from "vitepress";

export default defineConfig({
  title: "fhir-test-data",
  description:
    "Generate valid FHIR R4/R4B/R5 test resources with country-aware identifiers. TypeScript library and CLI.",
  base: "/fhir-test-data/",
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started", activeMatch: "/guide/" },
      { text: "Reference", link: "/reference/cli", activeMatch: "/reference/" },
      { text: "Ecosystem", link: "/ecosystem" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          items: [
            { text: "Getting started", link: "/guide/getting-started" },
            { text: "Locales", link: "/guide/locales" },
            { text: "Builders", link: "/guide/builders" },
            { text: "Bundle builder", link: "/guide/bundle-builder" },
            { text: "CLI usage", link: "/guide/cli" },
            { text: "FHIR versions (R4/R4B/R5)", link: "/guide/fhir-versions" },
            { text: "Seeded generation", link: "/guide/seeded-generation" },
            { text: "Fault injection", link: "/guide/fault-injection" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "CLI reference", link: "/reference/cli" },
            { text: "Library API", link: "/reference/library-api" },
            { text: "Identifier algorithms", link: "/reference/identifier-algorithms" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/dnlbox/fhir-test-data" },
      { icon: "npm", link: "https://www.npmjs.com/package/fhir-test-data" },
    ],
    search: {
      provider: "local",
    },
    editLink: {
      pattern: "https://github.com/dnlbox/fhir-test-data/edit/main/docs/site/:path",
      text: "Edit this page on GitHub",
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Daniel Veronez",
    },
  },
});
