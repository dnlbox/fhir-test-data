import type { Command } from "commander";
import { getAllLocales } from "@/locales/index.js";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

interface LocalesOptions {
  pretty: boolean;
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

function runLocales(opts: LocalesOptions): void {
  const locales = getAllLocales().map((locale) => ({
    code: locale.code,
    name: locale.name,
    patientIdentifiers: locale.patientIdentifiers.map((id) => ({
      name: id.name,
      system: id.system,
      ...(id.algorithm !== undefined ? { algorithm: id.algorithm } : {}),
    })),
    practitionerIdentifiers: locale.practitionerIdentifiers.map((id) => ({
      name: id.name,
      system: id.system,
      ...(id.algorithm !== undefined ? { algorithm: id.algorithm } : {}),
    })),
    organizationIdentifiers: locale.organizationIdentifiers.map((id) => ({
      name: id.name,
      system: id.system,
      ...(id.algorithm !== undefined ? { algorithm: id.algorithm } : {}),
    })),
  }));

  const indent = opts.pretty ? 2 : undefined;
  process.stdout.write(JSON.stringify(locales, null, indent) + "\n");
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerLocalesCommand(program: Command): void {
  program
    .command("locales")
    .description(
      "List all supported locales with their identifier systems and check-digit algorithms",
    )
    .option("--pretty", "pretty-print JSON (default for stdout)", true)
    .option("--no-pretty", "compact JSON output")
    .action(runLocales);
}
