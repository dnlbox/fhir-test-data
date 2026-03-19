import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import { registerGenerateCommand } from "@/cli/commands/generate.js";

// ---------------------------------------------------------------------------
// Helpers to capture stdout/stderr
// ---------------------------------------------------------------------------

function createCapture(): { out: string[]; err: string[]; restore: () => void } {
  const out: string[] = [];
  const err: string[] = [];
  const origOut = process.stdout.write.bind(process.stdout);
  const origErr = process.stderr.write.bind(process.stderr);

  process.stdout.write = (chunk: string | Uint8Array): boolean => {
    out.push(typeof chunk === "string" ? chunk : chunk.toString());
    return true;
  };
  process.stderr.write = (chunk: string | Uint8Array): boolean => {
    err.push(typeof chunk === "string" ? chunk : chunk.toString());
    return true;
  };

  return {
    out,
    err,
    restore: (): void => {
      process.stdout.write = origOut;
      process.stderr.write = origErr;
    },
  };
}

interface CLIResult {
  out: string;
  err: string;
}

class CLIError extends Error {
  readonly out: string;
  readonly err: string;
  constructor(message: string, out: string, err: string) {
    super(message);
    this.out = out;
    this.err = err;
  }
}

function runCLI(args: string[]): CLIResult {
  const program = new Command();
  program.exitOverride(); // prevent process.exit in tests
  registerGenerateCommand(program);

  const cap = createCapture();
  try {
    program.parse(["node", "fhir-test-data", ...args]);
  } catch (e) {
    cap.restore();
    throw new CLIError(e instanceof Error ? e.message : String(e), cap.out.join(""), cap.err.join(""));
  }
  cap.restore();
  return { out: cap.out.join(""), err: cap.err.join("") };
}

// ---------------------------------------------------------------------------
// Mock process.exit for error tests
// ---------------------------------------------------------------------------

let exitCode: number | undefined;

beforeEach(() => {
  exitCode = undefined;
  vi.spyOn(process, "exit").mockImplementation((code?: number | string | null) => {
    exitCode = typeof code === "number" ? code : 1;
    throw new Error(`process.exit(${exitCode})`);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Basic output (stdout)
// ---------------------------------------------------------------------------

describe("generate to stdout", () => {
  it("generates a single patient as JSON", () => {
    const { out } = runCLI(["generate", "patient", "--seed", "42"]);
    const parsed = JSON.parse(out);
    expect(parsed["resourceType"]).toBe("Patient");
  });

  it("generates multiple patients as JSON array", () => {
    const { out } = runCLI(["generate", "patient", "--count", "3", "--seed", "1"]);
    const parsed = JSON.parse(out);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
    for (const p of parsed) {
      expect(p["resourceType"]).toBe("Patient");
    }
  });

  it("generates NDJSON with --format ndjson", () => {
    const { out } = runCLI(["generate", "patient", "--count", "3", "--seed", "2", "--format", "ndjson"]);
    const lines = out.trim().split("\n");
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      const parsed = JSON.parse(line);
      expect(parsed["resourceType"]).toBe("Patient");
    }
  });

  it("generates a practitioner", () => {
    const { out } = runCLI(["generate", "practitioner", "--seed", "10"]);
    const parsed = JSON.parse(out);
    expect(parsed["resourceType"]).toBe("Practitioner");
  });

  it("generates an organization", () => {
    const { out } = runCLI(["generate", "organization", "--seed", "11"]);
    const parsed = JSON.parse(out);
    expect(parsed["resourceType"]).toBe("Organization");
  });

  it("generates an observation", () => {
    const { out } = runCLI(["generate", "observation", "--seed", "12"]);
    const parsed = JSON.parse(out);
    expect(parsed["resourceType"]).toBe("Observation");
  });

  it("generates a condition", () => {
    const { out } = runCLI(["generate", "condition", "--seed", "13"]);
    const parsed = JSON.parse(out);
    expect(parsed["resourceType"]).toBe("Condition");
  });

  it("generates a bundle", () => {
    const { out } = runCLI(["generate", "bundle", "--seed", "14"]);
    const parsed = JSON.parse(out);
    expect(parsed["resourceType"]).toBe("Bundle");
    expect(Array.isArray(parsed["entry"])).toBe(true);
  });

  it("generates one of each resource with 'all'", () => {
    const cap = createCapture();
    const program = new Command();
    program.exitOverride();
    registerGenerateCommand(program);
    try {
      program.parse(["node", "fhir-test-data", "generate", "all", "--seed", "99"]);
    } finally {
      cap.restore();
    }
    const lines = cap.out.join("").trim().split("\n").filter(Boolean);
    // Each resource type outputs on its own line when count=1
    expect(lines.length).toBeGreaterThanOrEqual(9);
  });
});

// ---------------------------------------------------------------------------
// Locale validation
// ---------------------------------------------------------------------------

describe("locale validation", () => {
  it("accepts valid locales (uk, au, de, fr, nl, in, ca)", () => {
    for (const locale of ["uk", "au", "de", "fr", "nl", "in", "ca"]) {
      const { out } = runCLI(["generate", "patient", "--locale", locale, "--seed", "1"]);
      const parsed = JSON.parse(out);
      expect(parsed["resourceType"]).toBe("Patient");
    }
  });

  it("exits 1 with error message for invalid locale", () => {
    let threw = false;
    let errOutput = "";
    try {
      runCLI(["generate", "patient", "--locale", "zz"]);
    } catch (e) {
      threw = true;
      if (e instanceof CLIError) errOutput = e.err;
    }
    expect(threw).toBe(true);
    expect(exitCode).toBe(1);
    expect(errOutput).toContain("unknown locale");
  });
});

// ---------------------------------------------------------------------------
// Invalid resource type
// ---------------------------------------------------------------------------

describe("invalid resource type", () => {
  it("exits 1 with error message for unknown resource type", () => {
    let threw = false;
    let errOutput = "";
    try {
      runCLI(["generate", "nonsense-resource", "--seed", "1"]);
    } catch (e) {
      threw = true;
      if (e instanceof CLIError) errOutput = e.err;
    }
    expect(threw).toBe(true);
    expect(exitCode).toBe(1);
    expect(errOutput).toContain("unknown resource type");
  });
});

// ---------------------------------------------------------------------------
// --faults flag
// ---------------------------------------------------------------------------

describe("--faults flag", () => {
  it("missing-resource-type removes resourceType from every resource", () => {
    const { out } = runCLI([
      "generate", "patient", "--count", "3", "--seed", "42", "--faults", "missing-resource-type",
    ]);
    const resources = JSON.parse(out) as Record<string, unknown>[];
    for (const r of resources) {
      expect(r).not.toHaveProperty("resourceType");
    }
  });

  it("missing-id removes id from every resource", () => {
    const { out } = runCLI([
      "generate", "patient", "--seed", "10", "--faults", "missing-id",
    ]);
    const r = JSON.parse(out);
    expect(r).not.toHaveProperty("id");
  });

  it("invalid-gender sets gender to INVALID_GENDER", () => {
    const { out } = runCLI([
      "generate", "patient", "--seed", "5", "--faults", "invalid-gender",
    ]);
    const r = JSON.parse(out);
    expect(r["gender"]).toBe("INVALID_GENDER");
  });

  it("multiple faults comma-separated apply all violations", () => {
    const { out } = runCLI([
      "generate", "patient", "--seed", "7", "--faults", "missing-id,invalid-gender",
    ]);
    const r = JSON.parse(out);
    expect(r).not.toHaveProperty("id");
    expect(r["gender"]).toBe("INVALID_GENDER");
  });

  it("random fault modifies the resource", () => {
    const { out: clean } = runCLI(["generate", "patient", "--seed", "1"]);
    const { out: faulty } = runCLI(["generate", "patient", "--seed", "1", "--faults", "random"]);
    expect(clean).not.toBe(faulty);
  });

  it("random fault with same seed is reproducible", () => {
    const { out: r1 } = runCLI(["generate", "patient", "--seed", "99", "--faults", "random"]);
    const { out: r2 } = runCLI(["generate", "patient", "--seed", "99", "--faults", "random"]);
    expect(r1).toBe(r2);
  });

  it("exits 1 with error message for unknown fault type", () => {
    let threw = false;
    let errOutput = "";
    try {
      runCLI(["generate", "patient", "--seed", "1", "--faults", "not-a-real-fault"]);
    } catch (e) {
      threw = true;
      if (e instanceof CLIError) errOutput = e.err;
    }
    expect(threw).toBe(true);
    expect(exitCode).toBe(1);
    expect(errOutput).toContain("Unknown fault type");
  });

  it("works with --format ndjson", () => {
    const { out } = runCLI([
      "generate", "patient", "--count", "2", "--seed", "3",
      "--format", "ndjson", "--faults", "missing-id",
    ]);
    const lines = out.trim().split("\n");
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      const r = JSON.parse(line);
      expect(r).not.toHaveProperty("id");
    }
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("determinism via CLI", () => {
  it("same seed produces identical JSON output", () => {
    const { out: out1 } = runCLI(["generate", "patient", "--locale", "uk", "--seed", "42"]);
    const { out: out2 } = runCLI(["generate", "patient", "--locale", "uk", "--seed", "42"]);
    expect(out1).toBe(out2);
  });

  it("different seeds produce different output", () => {
    const { out: out1 } = runCLI(["generate", "patient", "--seed", "1"]);
    const { out: out2 } = runCLI(["generate", "patient", "--seed", "2"]);
    expect(out1).not.toBe(out2);
  });
});

// ---------------------------------------------------------------------------
// --fhir-version flag
// ---------------------------------------------------------------------------

describe("--fhir-version flag", () => {
  it("R5 medication-statement produces MedicationUsage", () => {
    const { out } = runCLI([
      "generate", "medication-statement", "--seed", "1", "--fhir-version", "R5",
    ]);
    const r = JSON.parse(out) as Record<string, unknown>;
    expect(r["resourceType"]).toBe("MedicationUsage");
  });

  it("R4 (default) medication-statement produces MedicationStatement", () => {
    const { out } = runCLI(["generate", "medication-statement", "--seed", "1"]);
    const r = JSON.parse(out) as Record<string, unknown>;
    expect(r["resourceType"]).toBe("MedicationStatement");
  });

  it("R4B produces same structure as R4 for patient", () => {
    const { out: r4Out } = runCLI(["generate", "patient", "--seed", "5", "--fhir-version", "R4"]);
    const { out: r4bOut } = runCLI(["generate", "patient", "--seed", "5", "--fhir-version", "R4B"]);
    expect(JSON.parse(r4Out)).toEqual(JSON.parse(r4bOut));
  });

  it("unknown fhir-version exits 1 and writes to stderr", () => {
    let threw = false;
    let errOutput = "";
    try {
      runCLI(["generate", "patient", "--fhir-version", "R6"]);
    } catch (e) {
      threw = true;
      if (e instanceof CLIError) errOutput = e.err;
    }
    expect(threw).toBe(true);
    expect(exitCode).toBe(1);
    expect(errOutput).toContain("unknown FHIR version");
  });

  it("--fhir-version R5 with --seed is deterministic", () => {
    const { out: out1 } = runCLI(["generate", "patient", "--locale", "uk", "--seed", "42", "--fhir-version", "R5"]);
    const { out: out2 } = runCLI(["generate", "patient", "--locale", "uk", "--seed", "42", "--fhir-version", "R5"]);
    expect(out1).toBe(out2);
  });
});

describe("practitioner-role resource", () => {
  it("generates a PractitionerRole resource", () => {
    const { out } = runCLI(["generate", "practitioner-role", "--seed", "42"]);
    const parsed = JSON.parse(out);
    expect(parsed["resourceType"]).toBe("PractitionerRole");
  });

  it("generate all includes PractitionerRole", () => {
    const cap = createCapture();
    const program = new Command();
    program.exitOverride();
    registerGenerateCommand(program);
    try {
      program.parse(["node", "fhir-test-data", "generate", "all", "--seed", "1", "--no-pretty"]);
    } finally {
      cap.restore();
    }
    const lines = cap.out.join("").trim().split("\n").filter(Boolean);
    const types = lines.map((l) => (JSON.parse(l) as Record<string, unknown>)["resourceType"]);
    expect(types).toContain("PractitionerRole");
  });

  it("generate all: PractitionerRole.practitioner references the Practitioner in the same session", () => {
    const cap = createCapture();
    const program = new Command();
    program.exitOverride();
    registerGenerateCommand(program);
    try {
      program.parse(["node", "fhir-test-data", "generate", "all", "--seed", "42", "--no-pretty"]);
    } finally {
      cap.restore();
    }
    const lines = cap.out.join("").trim().split("\n").filter(Boolean);
    const resources = lines.map((l) => JSON.parse(l) as Record<string, unknown>);
    const byType = Object.fromEntries(resources.map((r) => [r["resourceType"] as string, r]));

    const practId = byType["Practitioner"]?.["id"] as string;
    const role = byType["PractitionerRole"] as Record<string, unknown>;
    const roleRef = (role?.["practitioner"] as Record<string, unknown>)?.["reference"] as string;

    expect(roleRef).toBe(`Practitioner/${practId}`);
  });

  it("generate all: PractitionerRole.organization references the Organization in the same session", () => {
    const cap = createCapture();
    const program = new Command();
    program.exitOverride();
    registerGenerateCommand(program);
    try {
      program.parse(["node", "fhir-test-data", "generate", "all", "--seed", "42", "--no-pretty"]);
    } finally {
      cap.restore();
    }
    const lines = cap.out.join("").trim().split("\n").filter(Boolean);
    const resources = lines.map((l) => JSON.parse(l) as Record<string, unknown>);
    const byType = Object.fromEntries(resources.map((r) => [r["resourceType"] as string, r]));

    const orgId = byType["Organization"]?.["id"] as string;
    const role = byType["PractitionerRole"] as Record<string, unknown>;
    const roleOrgRef = (role?.["organization"] as Record<string, unknown>)?.["reference"] as string;

    expect(roleOrgRef).toBe(`Organization/${orgId}`);
  });
});

describe("NDJSON stdout — spec 18", () => {
  it("generate all emits one compact JSON object per line", () => {
    const cap = createCapture();
    const program = new Command();
    program.exitOverride();
    registerGenerateCommand(program);
    try {
      program.parse(["node", "fhir-test-data", "generate", "all", "--seed", "1"]);
    } finally {
      cap.restore();
    }
    const lines = cap.out.join("").trim().split("\n").filter(Boolean);
    // Each line must be valid JSON parseable on its own
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it("generate all with --pretty still emits one compact JSON object per line", () => {
    const cap = createCapture();
    const program = new Command();
    program.exitOverride();
    registerGenerateCommand(program);
    try {
      program.parse(["node", "fhir-test-data", "generate", "all", "--seed", "1", "--pretty"]);
    } finally {
      cap.restore();
    }
    const lines = cap.out.join("").trim().split("\n").filter(Boolean);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it("single resource with --pretty still pretty-prints", () => {
    const { out } = runCLI(["generate", "patient", "--seed", "1", "--pretty"]);
    // Pretty-printed output has newlines (more than 1 line when parsed)
    expect(out.split("\n").length).toBeGreaterThan(2);
    expect(() => JSON.parse(out)).not.toThrow();
  });
});
