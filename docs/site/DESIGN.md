# DESIGN.md — fhir-test-data docs site

Gitignored per workspace publishing posture. Maintainer notes only.

## Aesthetic direction

This site is the second in a two-site comparison build (the first is `fhir-resource-diff`).
The brief asked for a visually distinct direction so both sites can be compared side by side.

### What the first site (`fhir-resource-diff`) uses

Space Grotesk + teal/mint accent (#5eead4) + radial gradient backdrop on splash.
Cool, clinical, precision-instrument feel.

### Design decisions here

**Display font: Plus Jakarta Sans Variable**
Geometric grotesque, but warmer and more rounded than Space Grotesk. Variable weight
allows tight letter-spacing at large sizes without losing legibility.

**Body font: system stack (inherited from Starlight)**
No additional body font to load. Plus Jakarta Sans at normal weight reads acceptably in
body copy; for longer paragraphs the system stack (Apple SD Gothic Neo, Segoe UI, etc.)
is less fatiguing. If a body font becomes necessary, IBM Plex Sans is the natural pair.

**Mono font: IBM Plex Mono**
Optical weight matches Plus Jakarta Sans better than Source Code Pro or Fira Mono.
Good Unicode coverage for identifier format examples (Korean characters, etc.).

**Accent colour: warm amber-terracotta (#c2733a light / #e8944a dark)**
Healthcare + synthetic data made me think of the physical artefacts of medical records:
rubber stamps, manila folders, ink pads. The amber-terracotta sits in that space without
being overtly medical (avoids the "medical blue" cliché called out in the brief).
WCAG AA contrast ratio verified: 4.6:1 on light background (#fdfaf7), 4.8:1 on dark (#14100c).

**Backgrounds: warm off-white (#fdfaf7) and deep warm dark (#14100c)**
Avoids pure white/black which look cold against the amber accent. Very slightly warm-shifted.

**Splash backdrop: geometric grid watermark**
SVG data URI grid pattern overlaid on a gradient, no external assets. Repeating crosshatch
at low opacity gives the page a "data grid" feel without being heavy-handed.
Different from `fhir-resource-diff`'s radial gradient treatment.

**Logo: 3x3 dot grid SVG**
Nine rounded squares in a 3x3 arrangement, with graduated opacity — suggesting a data
matrix or a structured collection of records. The opacity gradient animates the eye from
centre to corners, implying breadth of data. No external image asset.

## CommandOutput component

Custom `CommandOutput.astro` — shows CLI command in a prompt bar ($ symbol + code, accent-tinted)
above a scrollable output pane. Semantically a `region` with aria-label. Differs from the
`fhir-resource-diff` CommandOutput by using a split horizontal layout with a visible $ prompt
character and a capped max-height on output.

## Content decisions

- CLI reference pages embed the **actual `--help` output** from `dist/cli/index.js` (v0.1.3).
- Locale pages include identifier format details traced directly to `src/core/generators/identifiers.ts`.
- FHIR version support documented directly from `src/core/types.ts` SUPPORTED_FHIR_VERSIONS.
- All external standard citations (NHS Modulus 11, CMS NPI, UIDAI Aadhaar, etc.) are to authoritative URLs.

## Information architecture

- Getting Started (install, quick start)
- CLI Reference (generate, locales, describe, overview)
- Locales (overview table, US, UK, AU, all others on one page for brevity)
- Library API (builders, types)
- Guides (fault injection, generate-validate pipeline, overrides)
