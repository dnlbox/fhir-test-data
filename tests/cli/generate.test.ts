import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";
import { registerGenerateCommand } from "../../src/cli/commands/generate.js";

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
    expect(lines.length).toBeGreaterThanOrEqual(8);
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
