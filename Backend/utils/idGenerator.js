// /backend/utils/idGenerator.js
const mongoose = require("mongoose");

/**
 * Counter collection: one doc per sequence "name"
 * Example docs:
 *  { name: "SUB-20251103", seq: 42 }
 *  { name: "TRQ-20251103", seq: 7 }
 */
const CounterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { collection: "counters" }
);

const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

/**
 * Atomically increments and returns the next number for a given sequence name.
 * Uses findOneAndUpdate with upsert to be safe under concurrency.
 */
async function getNextSequence(name) {
  const updated = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return updated.seq;
}

/**
 * Formats a YYYYMMDD string.
 */
function formatYMD(date = new Date()) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * Create a dated, sequential ID like: SUB-20251103-0001
 * - prefix: "SUB" | "TRQ" | "USR" | "INST" | etc.
 * - width: number of digits for the running counter
 * - date: optional Date (defaults to now)
 *
 * The counter “scope” is per day, so SUB-20251103 and SUB-20251104 maintain separate sequences.
 * If you prefer a global counter regardless of date, set useDateScope=false.
 */
async function generateSequentialId({ prefix, width = 4, date = new Date(), useDateScope = true }) {
  const ymd = formatYMD(date);
  const scope = useDateScope ? `${prefix}-${ymd}` : `${prefix}`;
  const n = await getNextSequence(scope);
  const padded = String(n).padStart(width, "0");
  return useDateScope ? `${prefix}-${ymd}-${padded}` : `${prefix}-${padded}`;
}

/**
 * Create a region/organization-aware ID, e.g. INST-HT-0001 (no date).
 * - prefix: "INST"
 * - regionOrOrg: "HT", "US", "WES", etc.
 * - width: padding width
 */
async function generateScopedSequentialId({ prefix, regionOrOrg, width = 4 }) {
  const scope = `${prefix}-${regionOrOrg}`; // single running counter per region
  const n = await getNextSequence(scope);
  const padded = String(n).padStart(width, "0");
  return `${prefix}-${regionOrOrg}-${padded}`;
}

module.exports = {
  generateSequentialId,
  generateScopedSequentialId,
  formatYMD,
};
