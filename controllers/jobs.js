
const Job = require("../models/Job");

exports.index = async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user._id });
  res.render("jobs", { jobs });
};

exports.newForm = (req, res) => {
  res.render("job", { job: null, _csrf: req.csrfToken() });
};

exports.create = async (req, res) => {
  try {
    await Job.create({ ...req.body, createdBy: req.user._id });
    res.redirect("/jobs");
  } catch (err) {
    console.error("Job creation error:", err);
    res.send("Validation failed.");
  }
};

exports.editForm = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, createdBy: req.user._id });
  res.render("job", { job, _csrf: req.csrfToken() });
};

exports.update = async (req, res) => {
  await Job.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    req.body
  );
  res.redirect("/jobs");
};

exports.delete = async (req, res) => {
  await Job.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  res.redirect("/jobs");
};
