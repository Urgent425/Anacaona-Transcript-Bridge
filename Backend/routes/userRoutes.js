//backend/routes/userRoutes.js

// This is for the shipping address

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function requireUser(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return { error: { code: 401, body: { error: "Unauthorized" } } };
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { userId: decoded.id };
  } catch {
    return { error: { code: 401, body: { error: "Unauthorized" } } };
  }
}

function normalizeCountry(v) {
  const s = String(v || "").trim().toUpperCase();
  if (s === "USA" || s === "UNITED STATES" || s === "UNITED STATES OF AMERICA") return "US";
  return s;
}

function isValidUSZip(zip) {
  const z = String(zip || "").trim();
  return /^\d{5}(-\d{4})?$/.test(z);
}

router.get("/me/shipping-address", async (req, res) => {
  const auth = requireUser(req);
  if (auth.error) return res.status(auth.error.code).json(auth.error.body);

  const user = await User.findById(auth.userId).select("firstName lastName phone shippingAddress").lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({
    fullName:
      user.shippingAddress?.fullName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    phone: user.shippingAddress?.phone || user.phone || "",
    shippingAddress: user.shippingAddress || { country: "US" },
  });
});

router.put("/me/shipping-address", async (req, res) => {
  const auth = requireUser(req);
  if (auth.error) return res.status(auth.error.code).json(auth.error.body);

  const {
    fullName = "",
    address1 = "",
    address2 = "",
    city = "",
    state = "",
    zip = "",
    country = "US",
    phone = "",
  } = req.body || {};

  const c = normalizeCountry(country);

  if (c !== "US") {
    return res.status(400).json({ error: "Shipping is available only in the United States." });
  }
  if (!address1.trim() || !city.trim() || !state.trim() || !zip.trim()) {
    return res.status(400).json({ error: "address1, city, state, and zip are required." });
  }
  if (!isValidUSZip(zip)) {
    return res.status(400).json({ error: "Invalid US ZIP code. Use 12345 or 12345-6789." });
  }

  const user = await User.findById(auth.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.shippingAddress = {
    fullName: fullName.trim(),
    address1: address1.trim(),
    address2: address2.trim(),
    city: city.trim(),
    state: state.trim().toUpperCase(),
    zip: zip.trim(),
    country: "US",
    phone: String(phone || "").trim(),
  };

  await user.save();

  return res.json({ message: "Shipping address saved.", shippingAddress: user.shippingAddress });
});

module.exports = router;
