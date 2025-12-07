//backend/controllers/admin/institutionAccess.js
const User = require("../../models/User");
const Institution = require("../../models/Institution");
const InviteInstitution = require("../../models/InviteInstitution");

// POST /api/admin/institution-invites
exports.createInvite = async (req, res, next) => {
  try {
    const { institutionId, email } = req.body;
    if (!institutionId || !email) {
      return res.status(400).json({ message: "institutionId and email required." });
    }

    const inst = await Institution.findById(institutionId);
    if (!inst) {
      return res.status(404).json({ message: "Institution not found." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const invite = new InviteInstitution({
      institution: inst._id,
      email: normalizedEmail,
      used: false,
    });

    await invite.save();

    return res.status(201).json({
      _id: invite._id,
      institution: { _id: inst._id, name: inst.name },
      email: invite.email,
      used: invite.used,
      createdAt: invite.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/institutions/:id/access
exports.getAccessDetails = async (req, res, next) => {
  try {
    const instId = req.params.id;
    const inst = await Institution.findById(instId);
    if (!inst) {
      return res.status(404).json({ message: "Institution not found." });
    }

    const invites = await InviteInstitution.find({ institution: instId })
      .sort({ createdAt: -1 });

    const users = await User.find({
      institution: instId,
      role: "institution",
    }).sort({ createdAt: -1 });

    const pendingUsers   = [];
    const activeUsers    = [];
    const suspendedUsers = [];

    users.forEach((u) => {
      const basic = {
        _id:       u._id,
        firstName: u.firstName,
        lastName:  u.lastName,
        email:     u.email,
        position:  u.position || "",
        status:    u.status,
      };
      if (u.status === "pending")     pendingUsers.push(basic);
      else if (u.status === "active") activeUsers.push(basic);
      else if (u.status === "suspended") suspendedUsers.push(basic);
    });

    return res.json({
      institution: {
        _id: inst._id,
        name: inst.name,
        contactEmail: inst.contactEmail || "",
        contactPhone: inst.contactPhone || "",
      },
      invites: invites.map((inv) => ({
        _id: inv._id,
        email: inv.email,
        used: inv.used,
        createdAt: inv.createdAt,
      })),
      pendingUsers,
      activeUsers,
      suspendedUsers,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/institution-users/:userId/activate
exports.activateInstitutionUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("institution");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.role !== "institution") {
      return res.status(400).json({ message: "Not an institution account." });
    }
    if (!user.institution) {
      return res.status(400).json({ message: "User not linked to institution." });
    }

    // Enforce max 2 active accounts per institution
    const activeCount = await User.countDocuments({
      role: "institution",
      institution: user.institution._id,
      status: "active",
    });

    if (activeCount >= 2) {
      return res.status(409).json({
        message: "This institution already has the maximum number of active accounts.",
      });
    }

    user.status = "active";
    await user.save();

    return res.json({
      _id:        user._id,
      firstName:  user.firstName,
      lastName:   user.lastName,
      email:      user.email,
      status:     user.status,
      institution:{ _id: user.institution._id, name: user.institution.name },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/institution-users/:userId/suspend
exports.suspendInstitutionUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("institution");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.role !== "institution") {
      return res.status(400).json({ message: "Not an institution account." });
    }

    user.status = "suspended";
    await user.save();

    return res.json({
      _id:        user._id,
      firstName:  user.firstName,
      lastName:   user.lastName,
      email:      user.email,
      status:     user.status,
      institution: user.institution
        ? { _id: user.institution._id, name: user.institution.name }
        : null,
    });
  } catch (err) {
    next(err);
  }
};
