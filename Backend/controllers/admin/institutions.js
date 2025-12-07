//Backend/controllers/admin/institutions

const Institution = require("../../models/Institution");

exports.listInstitutions = async (req, res, next) => {
  try {
    const insts = await Institution.find().sort("name");
    res.json(insts);
  } catch (err) {
    next(err);
  }
};

exports.createInstitution = async (req, res, next) => {
  try {
    const inst = new Institution(req.body);
    await inst.save();
    res.status(201).json(inst);
  } catch (err) {
    next(err);
  }
};
