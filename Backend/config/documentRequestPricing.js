// backend/config/documentRequestPricing.js
//
// ⚠️ PLACEHOLDER PRICES — edit these to your actual fees before going live.
// All amounts are in CENTS (USD). This is the single source of truth for
// what Stripe charges — the frontend has a matching display-only copy in
// Frontend/src/components/DocumentRequestSection.jsx, but the backend price
// here is what's actually billed, so keep both in sync when you change a price.
const PRICING_CENTS = {
  academic: {
    "Transcript": 4000,               // $40
    "Diploma": 5000,                  // $50
    "Degree Certificate": 5000,       // $50
    "Enrollment Letter": 3000,        // $30
    "Academic Record": 4000,          // $40
  },
  civil: {
    "Birth Certificate": 3500,        // $35
    "Marriage Certificate": 3500,     // $35
    "Death Certificate": 3500,        // $35
    "Divorce Certificate": 4000,      // $40
    "National ID Records": 3000,      // $30
  },
  professional: {
    "Medical License": 6000,          // $60
    "Engineering License": 6000,      // $60
    "Bar Certificate": 6000,          // $60
    "Professional Certifications": 5000, // $50
  },
  government: {
    "Police Certificate": 4500,       // $45
    "Tax Certificate": 4000,          // $40
    "Business Registration": 5000,    // $50
    "Others": 4000,                   // $40 fallback for anything under "Others"
  },
};

// Used only if a (category, type) pair isn't found above — should rarely happen
// since the submission route validates against the same category/type list.
const DEFAULT_DOCUMENT_FEE_CENTS = 4000; // $40

function getDocumentRequestPriceCents(category, type) {
  const byCategory = PRICING_CENTS[category];
  if (byCategory && typeof byCategory[type] === "number") {
    return byCategory[type];
  }
  return DEFAULT_DOCUMENT_FEE_CENTS;
}

module.exports = {
  PRICING_CENTS,
  DEFAULT_DOCUMENT_FEE_CENTS,
  getDocumentRequestPriceCents,
};
