// controllers/admin/reports.js
const Transcript   = require("../../models/Transcript");
const Institution  = require("../../models/Institution");

exports.getDashboardStats = async (req, res, next) => {
  try {
    // total transcripts
    const totalTranscripts = await Transcript.countDocuments();

    // count by approvalStatus
    const byApprovalStatus = await Transcript.aggregate([
      { $group: { _id: "$approvalStatus", count: { $sum: 1 } } }
    ]);

    // count by purpose
    const byPurpose = await Transcript.aggregate([
      { $group: { _id: "$purpose", count: { $sum: 1 } } }
    ]);

    // count by assigned institution (with lookup for name)
    const byInstitution = await Transcript.aggregate([
      { $match: { assignedInstitution: { $ne: null } } },
      {
        $group: {
          _id: "$assignedInstitution",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "institutions",
          localField: "_id",
          foreignField: "_id",
          as: "institution"
        }
      },
      { $unwind: "$institution" },
      {
        $project: {
          _id: 0,
          institution: "$institution.name",
          count: 1
        }
      }
    ]);

    res.json({
      totalTranscripts,
      byApprovalStatus,
      byPurpose,
      byInstitution,
    });
  } catch (err) {
    next(err);
  }
};
