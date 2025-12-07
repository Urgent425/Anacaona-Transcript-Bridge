// backend/routes/admin/users.js
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const requireAdmin = require("../../middleware/requireAdmin");
const { canAssignToOthers } = require("../../utils/adminPerms");
const AdminUser = require("../../models/AdminUser");

router.use(requireAdmin);

// GET /api/admin/users?roles=TRANSLATOR,REVIEWER
router.get("/", async (req, res) => {
  if (!canAssignToOthers(req.admin.role)) return res.status(403).json({ message: "Not allowed" });
  const roles = (req.query.roles || "").split(",").filter(Boolean);
  const filter = { isActive: true };
  if (roles.length) filter.role = { $in: roles };
  const list = await AdminUser.find(filter).select("_id name email role").sort("name");
  res.json(list);
});

// POST /api/admin/users  (SUPER_ADMIN only)
router.post("/", async (req, res) => {
  if (!canAssignToOthers(req.admin.role)) return res.status(403).json({ message: "Not allowed" });
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "name, email, password, role are required" });
  }
  if (!["SuperAdmin", "Translator", "Reviewer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  // Optional: restrict domain
  if (!/@anacaona\.org$/i.test(email)) {
    return res.status(400).json({ message: "Email must be @anacaona.org" });
  }

  const exists = await AdminUser.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 12);              // <—
  const user = await AdminUser.create({ name, email, role, isActive: true, passwordHash }); // <—

  res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
});

// PATCH /api/admin/users/:id/activate
router.patch("/:id/activate", async (req, res) => {
  if (!canAssignToOthers(req.admin.role)) return res.status(403).json({ message: "Not allowed" });
  const user = await AdminUser.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true, projection: "_id name email role isActive" }
  );
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
});

// PATCH /api/admin/users/:id/suspend
router.patch("/:id/suspend", async (req, res) => {
  if (!canAssignToOthers(req.admin.role)) return res.status(403).json({ message: "Not allowed" });
  const user = await AdminUser.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true, projection: "_id name email role isActive" }
  );
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
});

// PATCH /api/admin/users/:id/role
router.patch("/:id/role", async (req, res) => {
  if (!canAssignToOthers(req.admin.role)) return res.status(403).json({ message: "Not allowed" });
  const { role } = req.body;
  if (!["SuperAdmin", "Translator", "Reviewer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  const user = await AdminUser.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, projection: "_id name email role isActive" }
  );
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
});

// POST /api/admin/users/:id/reset-password
// Option A (simple): set a temporary password; frontend shows it once.
// Option B: generate a token + email a reset link (recommended later).
router.post("/:id/reset-password", async (req, res) => {
  if (!canAssignToOthers(req.admin.role)) return res.status(403).json({ message: "Not allowed" });

  const { tempPassword } = req.body; // send from UI or generate here
  if (!tempPassword || tempPassword.length < 8) {
    return res.status(400).json({ message: "tempPassword (>=8 chars) required" });
  }

  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const user = await AdminUser.findByIdAndUpdate(
    req.params.id,
    { passwordHash },
    { new: true, projection: "_id name email role isActive" }
  );
  if (!user) return res.status(404).json({ message: "Not found" });

  res.json({ message: "Temporary password set" });
});


module.exports = router;
