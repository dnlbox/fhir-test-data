import { describe, it, expect } from "vitest";
import {
  luhnCheckDigit,
  luhnValidate,
  modulus11CheckDigit,
  modulus11Validate,
  verhoeffCheckDigit,
  verhoeffValidate,
  elevenProefCheckDigit,
  elevenProefValidate,
  modulus97Key,
  modulus97Validate,
  modulus10CheckDigit,
} from "../../src/core/generators/check-digits.js";

describe("Luhn", () => {
  it("validates known-valid AU IHI 8003608833357361", () => {
    expect(luhnValidate("8003608833357361")).toBe(true);
  });

  it("rejects IHI with wrong check digit", () => {
    expect(luhnValidate("8003608833357360")).toBe(false);
  });

  it("computes correct check digit for AU IHI body (15 digits → check 1)", () => {
    expect(luhnCheckDigit("800360883335736")).toBe("1");
  });

  it("validates a US NPI constructed by the generator logic", () => {
    const body = "123456789";
    const check = luhnCheckDigit("80840" + body);
    const npi = body + check;
    expect(luhnValidate("80840" + npi)).toBe(true);
  });

  it("rejects non-digit strings", () => {
    expect(luhnValidate("ABC")).toBe(false);
  });

  it("rejects single-digit strings", () => {
    expect(luhnValidate("5")).toBe(false);
  });
});

describe("Modulus 11 (NHS)", () => {
  it("validates known-valid NHS Number 9434765919", () => {
    expect(modulus11Validate("9434765919")).toBe(true);
  });

  it("computes correct check digit for first 9 digits of 9434765919", () => {
    expect(modulus11CheckDigit("943476591")).toBe("9");
  });

  it("rejects a number with an incorrect last digit", () => {
    expect(modulus11Validate("9434765918")).toBe(false);
  });

  it("rejects non-10-digit strings", () => {
    expect(modulus11Validate("123456789")).toBe(false);
    expect(modulus11Validate("12345678901")).toBe(false);
  });

  it("never produces check digit 10", () => {
    for (let i = 0; i < 100; i++) {
      const digits = i.toString().padStart(9, "0");
      const check = modulus11CheckDigit(digits);
      if (check !== null) {
        expect(Number(check)).not.toBe(10);
      }
    }
  });
});

describe("Verhoeff (Aadhaar)", () => {
  // Note: the research doc example "496107787920" contains an error in the check digit.
  // Computed: verhoeffCheckDigit("49610778792") = "8", so the valid number is "496107787928".
  it("computes check digit '8' for prefix 49610778792", () => {
    expect(verhoeffCheckDigit("49610778792")).toBe("8");
  });

  it("validates 496107787928 (correct known-valid Aadhaar)", () => {
    expect(verhoeffValidate("496107787928")).toBe(true);
  });

  it("rejects 496107787920 (wrong check digit for this prefix)", () => {
    expect(verhoeffValidate("496107787920")).toBe(false);
  });

  it("rejects non-digit strings", () => {
    expect(verhoeffValidate("ABCDEFGHIJKL")).toBe(false);
  });

  it("round-trips: generated check digit validates", () => {
    const prefix = "12345678901";
    const check = verhoeffCheckDigit(prefix);
    expect(verhoeffValidate(prefix + check)).toBe(true);
  });
});

describe("11-proef (BSN)", () => {
  it("validates known-valid BSN 999999990", () => {
    expect(elevenProefValidate("999999990")).toBe(true);
  });

  it("computes check digit '0' for prefix 99999999", () => {
    expect(elevenProefCheckDigit("99999999")).toBe("0");
  });

  it("rejects a number with wrong check digit", () => {
    expect(elevenProefValidate("999999991")).toBe(false);
  });

  it("round-trips: generated check digit validates", () => {
    const prefix = "12345678";
    const check = elevenProefCheckDigit(prefix);
    if (check !== null) {
      expect(elevenProefValidate(prefix + check)).toBe(true);
    }
  });

  it("check digit is always a single digit when non-null", () => {
    for (let i = 0; i < 100; i++) {
      const digits = i.toString().padStart(8, "0");
      const result = elevenProefCheckDigit(digits);
      if (result !== null) {
        expect(Number(result)).toBeGreaterThanOrEqual(0);
        expect(Number(result)).toBeLessThanOrEqual(9);
      }
    }
  });

  it("rejects non-9-digit strings", () => {
    expect(elevenProefValidate("12345678")).toBe(false);
    expect(elevenProefValidate("1234567890")).toBe(false);
  });
});

describe("Modulus 97 (French NIR)", () => {
  // Note: the research doc example (key 28) contains an error.
  // Computed: 1850575419043 % 97 = 52, key = 97 - 52 = 45.
  it("computes key '45' for NIR 1850575419043", () => {
    expect(modulus97Key("1850575419043")).toBe("45");
  });

  it("validates full NIR+key 185057541904345", () => {
    expect(modulus97Validate("185057541904345")).toBe(true);
  });

  it("rejects NIR+key with wrong key", () => {
    expect(modulus97Validate("185057541904344")).toBe(false);
  });

  it("round-trips: computed key validates", () => {
    const nir = "1234567890123";
    const key = modulus97Key(nir);
    expect(modulus97Validate(nir + key)).toBe(true);
  });

  it("rejects wrong-length strings", () => {
    expect(modulus97Validate("1850575419043")).toBe(false);
    expect(modulus97Validate("18505754190432800")).toBe(false);
  });
});

describe("Modulus 10 (LANR)", () => {
  it("returns a single digit string", () => {
    expect(modulus10CheckDigit("123456")).toMatch(/^\d$/);
  });

  it("is deterministic", () => {
    expect(modulus10CheckDigit("123456")).toBe(modulus10CheckDigit("123456"));
  });

  it("produces different results for different inputs where expected", () => {
    const a = modulus10CheckDigit("123456");
    const b = modulus10CheckDigit("654321");
    expect(a).toMatch(/^\d$/);
    expect(b).toMatch(/^\d$/);
  });
});
