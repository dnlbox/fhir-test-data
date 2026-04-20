import { defineConfig } from "vitepress";

const HOSTNAME = "https://dnlbox.github.io/fhir-test-data";
const DESCRIPTION =
  "FHIR R4/R4B/R5 test data generator. Country-aware identifiers: NHS, Medicare, BSN, Aadhaar. Seeded, deterministic. TypeScript CLI and library.";

export default defineConfig({
  title: "fhir-test-data",
  description: DESCRIPTION,
  base: "/fhir-test-data/",
  appearance: 'dark',
  sitemap: { hostname: HOSTNAME + "/" },
  head: [
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "fhir-test-data" }],
    ["meta", { property: "og:title", content: "fhir-test-data — FHIR R4/R4B/R5 test data generator CLI" }],
    ["meta", { property: "og:description", content: DESCRIPTION }],
    ["meta", { property: "og:url", content: HOSTNAME + "/" }],
    ["meta", { name: "twitter:card", content: "summary" }],
    ["meta", { name: "twitter:title", content: "fhir-test-data — FHIR R4/R4B/R5 test data generator CLI" }],
    ["meta", { name: "twitter:description", content: DESCRIPTION }],
    ["meta", { name: "google-site-verification", content: "Ffbl73Sm-TtkxrvNsLRS417HB-VjOPRmerHZVfhF0QQ" }],
    [
      "script",
      { type: "application/ld+json" },
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "fhir-test-data",
        description: DESCRIPTION,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        programmingLanguage: "TypeScript",
        url: HOSTNAME + "/",
        downloadUrl: "https://www.npmjs.com/package/fhir-test-data",
        license: "https://opensource.org/licenses/MIT",
        codeRepository: "https://github.com/dnlbox/fhir-test-data",
        author: { "@type": "Person", name: "Daniel Veronez" },
      }),
    ],
  ],
  transformHead({ pageData }) {
    const slug = pageData.relativePath
      .replace(/index\.md$/, "")
      .replace(/\.md$/, ".html");
    return [["link", { rel: "canonical", href: `${HOSTNAME}/${slug}` }]];
  },
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
