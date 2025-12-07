// backend/utils/adminPerms.js
exports.canSelfAssign     = (role) => role === "SuperAdmin" || role === "Translator";
exports.canAssignToOthers = (role) => role === "SuperAdmin";
exports.canViewOnly       = (role) => role === "Reviewer";
