//backend/admin/controllers/adminController.js

const mongoose = require("mongoose");
const Transcript = require("../../models/Transcript");
const TranslationRequest = require("../../models/TranslationRequest");
const AdminUser = require("../../models/AdminUser");
const Institution = require("../../models/Institution");

// GET /api/admin/dashboard-overview
async function getDashboardOverview(req, res) {
  try {
    //
    // 1. Transcript evaluation counts by approvalStatus
    //    approvalStatus: "pending" | "approved" | "rejected"
    //
    const evalCountsAgg = await Transcript.aggregate([
      {
        $group: {
          _id: "$approvalStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const evalCounts = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    evalCountsAgg.forEach((row) => {
      evalCounts.total += row.count;
      if (row._id === "pending") evalCounts.pending = row.count;
      if (row._id === "approved") evalCounts.approved = row.count;
      if (row._id === "rejected") evalCounts.rejected = row.count;
    });

    //
    // 2. Translation request counts by status
    //    TranslationRequest.status: "pending" | "locked" | "paid" | "completed"
    //
    const transCountsAgg = await TranslationRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const translationCounts = {
      total: 0,
      pending: 0,
      locked: 0,
      paid: 0,
      completed: 0,
    };

    transCountsAgg.forEach((row) => {
      translationCounts.total += row.count;
      if (row._id === "pending") translationCounts.pending = row.count;
      if (row._id === "locked") translationCounts.locked = row.count;
      if (row._id === "paid") translationCounts.paid = row.count;
      if (row._id === "completed") translationCounts.completed = row.count;
    });

    //
    // 3. Backlog aging for PENDING transcripts
    //    Bucket by how old they are.
    //
    const now = Date.now();
    const pendingSubs = await Transcript.find(
      { approvalStatus: "pending" },
      { createdAt: 1 }
    ).lean();

    let bucket_0_2 = 0;
    let bucket_3_7 = 0;
    let bucket_8_plus = 0;

    pendingSubs.forEach((sub) => {
      const ageDays =
        (now - new Date(sub.createdAt).getTime()) / 1000 / 60 / 60 / 24;
      if (ageDays <= 2) bucket_0_2++;
      else if (ageDays <= 7) bucket_3_7++;
      else bucket_8_plus++;
    });

    const backlogAging = [
      { label: "0-2 days", count: bucket_0_2 },
      { label: "3-7 days", count: bucket_3_7 },
      { label: "8+ days", count: bucket_8_plus },
    ];

    //
    // 4. Recent approvals / completions timeline
    //    We'll show recently approved transcripts.
    //    We populate student and assignedInstitution (your Transcript schema
    //    does NOT have `institution`, but it DOES have `assignedInstitution`,
    //    so we'll use that).
    //
    const recentApprovedSubs = await Transcript.find(
      { approvalStatus: "approved" },
      {
        purpose: 1,
        updatedAt: 1,
        student: 1,
        assignedInstitution: 1,
      }
    )
      .populate("student", "firstName lastName")
      .populate("assignedInstitution", "name")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const recentApprovals = recentApprovedSubs.map((sub) => ({
      student: sub.student
        ? `${sub.student.firstName || ""} ${
            sub.student.lastName || ""
          }`.trim()
        : "Unknown student",
      institution: sub.assignedInstitution
        ? sub.assignedInstitution.name
        : "—",
      purpose: sub.purpose || "",
      at: sub.updatedAt,
    }));

    return res.json({
      evalCounts,
      translationCounts,
      backlogAging,
      recentApprovals,
    });
  } catch (err) {
    console.error("getDashboardOverview error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load dashboard overview" });
  }
}

// GET /api/admin/translations?status=pending
async function getTranslationQueue(req, res) {
  try {
    // Supported statuses from model: pending | locked | paid | completed
    const status = req.query.status; // "all" | one of the above

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const jobs = await TranslationRequest.find(query)
      .populate("student", "firstName lastName")
      .populate("adminAssignee", "name role") // who is working on it
      .sort({
        // Newest first, but you can change this to oldest first if that’s better operationally.
        createdAt: -1,
      })
      .lean();

    const shaped = jobs.map((job) => ({
      _id: job._id,
      studentName: job.student
        ? `${job.student.firstName || ""} ${job.student.lastName || ""}`.trim()
        : "Unknown student",

      // We'll show file[0] for display
      documentName:
        job.files && job.files.length > 0
          ? job.files[0].filename || "Document"
          : "Document",

      fromLang: job.sourceLanguage || "—",
      toLang: job.targetLanguage || "—",

      // backend model status: pending | locked | paid | completed
      status: job.status || "pending",

      assignee: job.adminAssignee
        ? `${job.adminAssignee.name || ""} ${
            job.adminAssignee.role || ""
          }`.trim()
        : null,

      createdAt: job.createdAt || null,
    }));

    return res.json(shaped);
  } catch (err) {
    console.error("getTranslationQueue error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load translations queue" });
  }
}

module.exports = {
  getDashboardOverview,
  getTranslationQueue,
};
