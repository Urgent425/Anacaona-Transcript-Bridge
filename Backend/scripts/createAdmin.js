// scripts/createAdmin.js
require("dotenv").config();
const mongoose   = require("mongoose");
const bcrypt     = require("bcrypt");
const AdminUser  = require("../models/AdminUser");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.argv[2];
  const password = process.argv[3];
  const role = process.argv[4] || "Reviewer"; // or "SuperAdmin"/"Translator"

  if (!email || !password) {
    console.error("Usage: node createAdmin.js <email> <password> [role]");
    process.exit(1);
  }
  if (!email.endsWith("@anacaona.org")) {
    console.error("❌ Email must end with @anacaona.org");
    process.exit(1);
  }

  const existing = await AdminUser.findOne({ email });
  if (existing) {
    console.log(`⚠️  Admin ${email} already exists`);
  } else {
    const hash = await bcrypt.hash(password, 12);
    await AdminUser.create({ email, passwordHash: hash, role, name: email.split("@")[0] });
    console.log(`✅  Created admin ${email} with role ${role}`);
  }

  process.exit();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
