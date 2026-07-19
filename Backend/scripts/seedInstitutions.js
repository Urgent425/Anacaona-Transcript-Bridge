// backend/scripts/seedInstitutions.js
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mongoose = require("mongoose");
const Institution = require("../models/Institution");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGO_URI in backend/.env");
  process.exit(1);
}

// EDIT THIS ARRAY with the institutions you want to seed.
// contactEmail / contactPhone / address are optional but recommended —
// they show up in the admin "Manage Access" panel and on invite emails.
const institutionsToSeed = [
  {
    name: "Archives Nationales d'Haïti",
    contactEmail: "",
    contactPhone: "",
    address: "",
  },
  {
    name: "Direction Centrale de la Police Judiciaire (DCPJ)",
    contactEmail: "",
    contactPhone: "",
    address: "",
  },
  {
    name: "Office d'Assurance Véhicules Contre Tiers (OAVCT)",
    contactEmail: "",
    contactPhone: "",
    address: "",
  },
  {
    name: "Direction Générale des Impôts (DGI)",
    contactEmail: "",
    contactPhone: "",
    address: "",
  },
];

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    for (const inst of institutionsToSeed) {
      if (!inst.name || !inst.name.trim()) {
        console.warn("Skip entry: missing name", inst);
        continue;
      }

      const existing = await Institution.findOne({ name: inst.name });
      if (existing) {
        // idempotent: update contact info if you changed it above, but never
        // touch anything else (assignments, invites, etc. stay untouched)
        existing.contactEmail = inst.contactEmail || existing.contactEmail;
        existing.contactPhone = inst.contactPhone || existing.contactPhone;
        existing.address = inst.address || existing.address;
        await existing.save();
        console.log(`Updated (already existed): ${inst.name}`);
        continue;
      }

      await Institution.create({
        name: inst.name,
        contactEmail: inst.contactEmail || "",
        contactPhone: inst.contactPhone || "",
        address: inst.address || "",
      });

      console.log(`Created: ${inst.name}`);
    }

    console.log("Seeding complete.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();