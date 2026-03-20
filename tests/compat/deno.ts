import {
  createPatientBuilder,
  createPractitionerBuilder,
  createBundleBuilder,
} from "../../dist/core/index.js";

const [patient] = createPatientBuilder().locale("uk").seed(1).build();
if (patient.resourceType !== "Patient") throw new Error("Patient builder failed");
if (typeof patient.id !== "string") throw new Error("Patient id missing");
if (!Array.isArray(patient.identifier)) throw new Error("Patient identifiers missing");

const [a] = createPatientBuilder().locale("nl").seed(42).build();
const [b] = createPatientBuilder().locale("nl").seed(42).build();
if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error("Seeded generation is not deterministic");

const [prac] = createPractitionerBuilder().locale("de").seed(1).build();
if (prac.resourceType !== "Practitioner") throw new Error("Practitioner builder failed");

const [bundle] = createBundleBuilder().locale("us").seed(1).build();
if (bundle.resourceType !== "Bundle") throw new Error("Bundle builder failed");
if (!Array.isArray(bundle.entry) || bundle.entry.length === 0) throw new Error("Bundle entries missing");

console.log("Deno compat: OK");
