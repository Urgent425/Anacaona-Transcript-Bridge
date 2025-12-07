// backend/scripts/seedAdmins.js
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const AdminUser = require("../models/AdminUser");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGO_URI in backend/.env");
  process.exit(1);
}

// EDIT THIS ARRAY with the admins you want to seed:
const adminsToSeed = [
  { name: "Super One",   email: "super1@anacaona.org",   role: "SuperAdmin",  password: "Passw0rd!" },
  { name: "Tina Trans",  email: "tina@anacaona.org",     role: "Translator",   password: "Passw0rd!" },
  { name: "Ravi Review", email: "ravi@anacaona.org",     role: "Reviewer",     password: "Passw0rd!" },
];

const VALID_ROLES = new Set(["SuperAdmin", "Translator", "Reviewer"]);
const EMAIL_DOMAIN = /@anacaona\.org$/i; // enforce your domain

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    for (const a of adminsToSeed) {
      if (!VALID_ROLES.has(a.role)) {
        console.warn(`Skip ${a.email}: invalid role ${a.role}`);
        continue;
      }
      if (!EMAIL_DOMAIN.test(a.email)) {
        console.warn(`Skip ${a.email}: must be @anacaona.org`);
        continue;
      }

      const existing = await AdminUser.findOne({ email: a.email });
      if (existing) {
        // idempotent: ensure role / active state
        existing.role = a.role;
        existing.isActive = true;
        await existing.save();
        console.log(`Updated ${a.email} → role=${a.role}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(a.password, 12);
      await AdminUser.create({
        name: a.name,
        email: a.email,
        role: a.role,
        isActive: true,
        passwordHash,                 // <-- IMPORTANT: matches your schema
      });

      console.log(`Created ${a.email} (${a.role}) with password: ${a.password}`);
    }

    console.log("Seeding complete.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
