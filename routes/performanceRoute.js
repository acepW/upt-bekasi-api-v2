const router = require("express").Router();

const dataRekapAnomali = require("../controller/performance/rekapAnomaliController");

router.get("/performance/rekap-anomali", dataRekapAnomali.getRekapAnomali);

module.exports = router;
