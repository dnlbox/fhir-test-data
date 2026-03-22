#!/usr/bin/env node
import { Command } from "commander";
import { registerGenerateCommand } from "./commands/generate.js";
import { registerLocalesCommand } from "./commands/locales.js";
import { registerDescribeCommand } from "./commands/describe.js";

// Injected at build time by tsup — see tsup.config.ts
declare const __PACKAGE_VERSION__: string;

const program = new Command();

program
  .name("fhir-test-data")
  .description("Generate valid FHIR R4 test resources with country-aware identifiers")
  .version(__PACKAGE_VERSION__, "-V", "Print version number");

registerGenerateCommand(program);
registerLocalesCommand(program);
registerDescribeCommand(program);

// pnpm forwards its argument separator '--' as the first extra arg when
// running `pnpm cli -- <args>`.  Strip it so Commander can parse options normally.
const argv =
  process.argv[2] === "--"
    ? [...process.argv.slice(0, 2), ...process.argv.slice(3)]
    : process.argv;

await program.parseAsync(argv);
