#!/usr/bin/env node
import { Command } from "commander";
import { registerGenerateCommand } from "./commands/generate.js";

const program = new Command();

program
  .name("fhir-test-data")
  .description("Generate valid FHIR R4 test resources with country-aware identifiers")
  .version("0.1.0");

registerGenerateCommand(program);

program.parse();
