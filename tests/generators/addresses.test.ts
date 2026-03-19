import { describe, it, expect } from "vitest";
import { createRng } from "@/core/generators/rng.js";
import { generateAddress } from "@/core/generators/addresses.js";
import { usAddressTemplate } from "@/locales/us/addresses.js";
import { ukAddressTemplate } from "@/locales/uk/addresses.js";
import { auAddressTemplate } from "@/locales/au/addresses.js";
import { caAddressTemplate } from "@/locales/ca/addresses.js";
import { deAddressTemplate } from "@/locales/de/addresses.js";
import { frAddressTemplate } from "@/locales/fr/addresses.js";
import { nlAddressTemplate } from "@/locales/nl/addresses.js";
import { inAddressTemplate } from "@/locales/in/addresses.js";

describe("US addresses", () => {
  it("generates address with country US", () => {
    const rng = createRng(1);
    const addr = generateAddress(usAddressTemplate, rng);
    expect(addr.country).toBe("US");
  });

  it("generates 5-digit ZIP code", () => {
    const rng = createRng(1);
    for (let i = 0; i < 20; i++) {
      const addr = generateAddress(usAddressTemplate, rng);
      expect(addr.postalCode).toMatch(/^\d{5}$/);
    }
  });

  it("includes 2-letter state abbreviation", () => {
    const rng = createRng(1);
    for (let i = 0; i < 20; i++) {
      const addr = generateAddress(usAddressTemplate, rng);
      expect(addr.state).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("uses number-first address format", () => {
    const rng = createRng(1);
    const addr = generateAddress(usAddressTemplate, rng);
    expect(addr.line[0]).toMatch(/^\d+ /);
  });
});

describe("UK addresses", () => {
  it("generates address with country GB", () => {
    const rng = createRng(2);
    const addr = generateAddress(ukAddressTemplate, rng);
    expect(addr.country).toBe("GB");
  });

  it("generates postcode matching UK format", () => {
    const rng = createRng(2);
    for (let i = 0; i < 20; i++) {
      const addr = generateAddress(ukAddressTemplate, rng);
      // Structurally valid: letters + digits + space + digit + 2 letters
      expect(addr.postalCode).toMatch(/^[A-Z]{2}\d{1,2} \d[A-Z]{2}$/);
    }
  });

  it("does not include state field", () => {
    const rng = createRng(2);
    // UK addresses should not have state, but may have district
    for (let i = 0; i < 10; i++) {
      const addr = generateAddress(ukAddressTemplate, rng);
      expect(addr.state).toBeUndefined();
    }
  });
});

describe("AU addresses", () => {
  it("generates address with country AU", () => {
    const rng = createRng(3);
    const addr = generateAddress(auAddressTemplate, rng);
    expect(addr.country).toBe("AU");
  });

  it("generates 4-digit postcode", () => {
    const rng = createRng(3);
    for (let i = 0; i < 20; i++) {
      const addr = generateAddress(auAddressTemplate, rng);
      expect(addr.postalCode).toMatch(/^\d{4}$/);
    }
  });

  it("postcodes are in valid state ranges", () => {
    const STATE_RANGES: Record<string, [number, number]> = {
      NSW: [2000, 2999], VIC: [3000, 3999], QLD: [4000, 4999],
      SA: [5000, 5999], WA: [6000, 6999], TAS: [7000, 7999],
      ACT: [2600, 2639], NT: [800, 999],
    };
    const rng = createRng(3);
    for (let i = 0; i < 50; i++) {
      const addr = generateAddress(auAddressTemplate, rng);
      if (addr.state !== undefined) {
        const range = STATE_RANGES[addr.state];
        if (range !== undefined) {
          const code = Number(addr.postalCode);
          expect(code).toBeGreaterThanOrEqual(range[0]);
          expect(code).toBeLessThanOrEqual(range[1]);
        }
      }
    }
  });
});

describe("CA addresses", () => {
  it("generates address with country CA", () => {
    const rng = createRng(4);
    const addr = generateAddress(caAddressTemplate, rng);
    expect(addr.country).toBe("CA");
  });

  it("generates postal code in A1A 1A1 format", () => {
    const rng = createRng(4);
    for (let i = 0; i < 20; i++) {
      const addr = generateAddress(caAddressTemplate, rng);
      expect(addr.postalCode).toMatch(/^[A-Z]\d[A-Z] \d[A-Z]\d$/);
    }
  });

  it("postal codes never contain D, F, I, O, Q, or U", () => {
    const forbidden = /[DFIOQUWZ]/;
    const rng = createRng(4);
    for (let i = 0; i < 50; i++) {
      const addr = generateAddress(caAddressTemplate, rng);
      // Only check the letter characters (not digits or space)
      const letters = addr.postalCode.replace(/[\d ]/g, "");
      expect(letters).not.toMatch(forbidden);
    }
  });
});

describe("DE addresses", () => {
  it("generates address with country DE", () => {
    const rng = createRng(5);
    const addr = generateAddress(deAddressTemplate, rng);
    expect(addr.country).toBe("DE");
  });

  it("generates 5-digit PLZ", () => {
    const rng = createRng(5);
    for (let i = 0; i < 20; i++) {
      const addr = generateAddress(deAddressTemplate, rng);
      expect(addr.postalCode).toMatch(/^\d{5}$/);
    }
  });

  it("uses street-number order (number after street)", () => {
    const rng = createRng(5);
    for (let i = 0; i < 10; i++) {
      const addr = generateAddress(deAddressTemplate, rng);
      // Should end with a number, not start with one
      expect(addr.line[0]).toMatch(/ \d+$/);
      expect(addr.line[0]).not.toMatch(/^\d+ /);
    }
  });
});

describe("FR addresses", () => {
  it("generates address with country FR", () => {
    const rng = createRng(6);
    const addr = generateAddress(frAddressTemplate, rng);
    expect(addr.country).toBe("FR");
  });

  it("generates 5-digit code postal", () => {
    const rng = createRng(6);
    for (let i = 0; i < 20; i++) {
      const addr = generateAddress(frAddressTemplate, rng);
      expect(addr.postalCode).toMatch(/^\d{5}$/);
    }
  });

  it("uses number-first format with street type in address", () => {
    const rng = createRng(6);
    const addr = generateAddress(frAddressTemplate, rng);
    expect(addr.line[0]).toMatch(/^\d+ (Rue|Avenue|Boulevard|Place|Impasse|Allée|Chemin|Route)/);
  });
});

describe("NL addresses", () => {
  it("generates address with country NL", () => {
    const rng = createRng(7);
    const addr = generateAddress(nlAddressTemplate, rng);
    expect(addr.country).toBe("NL");
  });

  it("generates NNNN LL postcode format", () => {
    const rng = createRng(7);
    for (let i = 0; i < 20; i++) {
      const addr = generateAddress(nlAddressTemplate, rng);
      expect(addr.postalCode).toMatch(/^\d{4} [A-Z]{2}$/);
    }
  });

  it("postcodes never end in SA, SD, or SS", () => {
    const rng = createRng(7);
    for (let i = 0; i < 50; i++) {
      const addr = generateAddress(nlAddressTemplate, rng);
      const letters = addr.postalCode.slice(-2);
      expect(["SA", "SD", "SS"]).not.toContain(letters);
    }
  });

  it("uses street-number order", () => {
    const rng = createRng(7);
    for (let i = 0; i < 10; i++) {
      const addr = generateAddress(nlAddressTemplate, rng);
      expect(addr.line[0]).toMatch(/ \d+$/);
    }
  });
});

describe("IN addresses", () => {
  it("generates address with country IN", () => {
    const rng = createRng(8);
    const addr = generateAddress(inAddressTemplate, rng);
    expect(addr.country).toBe("IN");
  });

  it("generates 6-digit PIN code", () => {
    const rng = createRng(8);
    for (let i = 0; i < 20; i++) {
      const addr = generateAddress(inAddressTemplate, rng);
      expect(addr.postalCode).toMatch(/^\d{6}$/);
    }
  });

  it("includes district field", () => {
    const rng = createRng(8);
    let districtCount = 0;
    for (let i = 0; i < 20; i++) {
      const addr = generateAddress(inAddressTemplate, rng);
      if (addr.district !== undefined) districtCount++;
    }
    expect(districtCount).toBeGreaterThan(0);
  });
});

describe("Determinism", () => {
  it("same seed produces same address for each locale", () => {
    const templates = [
      usAddressTemplate, ukAddressTemplate, auAddressTemplate, caAddressTemplate,
      deAddressTemplate, frAddressTemplate, nlAddressTemplate, inAddressTemplate,
    ];
    for (const template of templates) {
      const rng1 = createRng(42);
      const rng2 = createRng(42);
      const addr1 = generateAddress(template, rng1);
      const addr2 = generateAddress(template, rng2);
      expect(addr1).toEqual(addr2);
    }
  });
});
