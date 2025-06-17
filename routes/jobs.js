

const express = require("express");
const router = express.Router();
const jobCtrl = require("../controllers/jobs");

router.get("/", jobCtrl.index);
router.get("/new", jobCtrl.newForm);
router.post("/", jobCtrl.create);
router.get("/edit/:id", jobCtrl.editForm);
router.post("/update/:id", jobCtrl.update);
router.post("/delete/:id", jobCtrl.delete);

module.exports = router;