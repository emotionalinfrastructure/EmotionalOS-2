// Verifies the built package is importable from both ESM and CJS
// consumers. Run after `npm run build` (see package.json "verify" script).
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const esm = await import("../dist/index.mjs");
assert.equal(typeof esm.sha256Hex, "function", "ESM import missing sha256Hex");
assert.equal(typeof esm.createCTID, "function", "ESM import missing createCTID");
assert.equal(esm.sha256Hex("hello").length, 64, "ESM sha256Hex did not return a hex digest");
console.log("ESM import OK");

const require = createRequire(import.meta.url);
const cjs = require("../dist/index.cjs");
assert.equal(typeof cjs.sha256Hex, "function", "CJS import missing sha256Hex");
assert.equal(typeof cjs.createCTID, "function", "CJS import missing createCTID");
assert.equal(cjs.sha256Hex("hello").length, 64, "CJS sha256Hex did not return a hex digest");
console.log("CJS import OK");
