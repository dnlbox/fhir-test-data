import { test, expect } from "bun:test";
import {
  createPatientBuilder,
  createPractitionerBuilder,
  createOrganizationBuilder,
  createBundleBuilder,
} from "../../src/core/index.ts";

test("createPatientBuilder returns a Patient", () => {
  const [patient] = createPatientBuilder().locale("uk").seed(1).build();
  expect(patient.resourceType).toBe("Patient");
  expect(typeof patient.id).toBe("string");
  expect(Array.isArray(patient.identifier)).toBe(true);
});

test("createPatientBuilder is deterministic", () => {
  const [a] = createPatientBuilder().locale("nl").seed(42).build();
  const [b] = createPatientBuilder().locale("nl").seed(42).build();
  expect(JSON.stringify(a)).toBe(JSON.stringify(b));
});

test("createPractitionerBuilder returns a Practitioner", () => {
  const [prac] = createPractitionerBuilder().locale("de").seed(1).build();
  expect(prac.resourceType).toBe("Practitioner");
});

test("createOrganizationBuilder returns an Organization", () => {
  const [org] = createOrganizationBuilder().locale("au").seed(1).build();
  expect(org.resourceType).toBe("Organization");
});

test("createBundleBuilder returns a Bundle with entries", () => {
  const [bundle] = createBundleBuilder().locale("us").seed(1).build();
  expect(bundle.resourceType).toBe("Bundle");
  expect(Array.isArray(bundle.entry)).toBe(true);
  expect(bundle.entry.length).toBeGreaterThan(0);
});
