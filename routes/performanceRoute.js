const router = require("express").Router();

const dataRekapAnomali = require("../controller/performance/rekapAnomaliController");
const dataCommonEnemy = require("../controller/performance/commonEnemyController");

router.get("/performance/rekap-anomali", dataRekapAnomali.getRekapAnomali);
router.get("/performance/common-enemy", dataCommonEnemy.getCommonEnemy);

module.exports = router;
