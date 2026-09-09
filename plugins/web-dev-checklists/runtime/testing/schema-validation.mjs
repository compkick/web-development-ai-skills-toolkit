import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

// Test-only dependencies belong to the repository, never the installed audit runtime.
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validators = Object.fromEntries(["evidence", "coverage"].map((kind) => {
  const schema = JSON.parse(readFileSync(new URL(`../schemas/review-${kind}-v1.schema.json`, import.meta.url), "utf8"));
  return [kind, ajv.compile(schema)];
}));

export function validateEvidence(evidence, expectedProfile) {
  validate("evidence", evidence);
  if (expectedProfile) assert.equal(evidence.profile.id, expectedProfile);
}

export function validateCoverage(coverage, expectedProfile) {
  validate("coverage", coverage);
  if (expectedProfile) assert.equal(coverage.profile.id, expectedProfile);
}

function validate(kind, value) {
  const validator = validators[kind];
  assert.ok(validator(value), `${kind} violates its JSON schema:\n${ajv.errorsText(validator.errors, { separator: "\n" })}`);
}
