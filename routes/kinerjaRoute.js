const router = require("express").Router();

const dataKinerjaUpt = require("../controller/kinerja/kinerjaUptController");
const dataKinerjaUltg = require("../controller/kinerja/kinerjaUltgController");

router.get("/kinerja/upt", dataKinerjaUpt.getKinerjaUpt);
router.get("/kinerja/ultg", dataKinerjaUltg.getKinerjaultg);

module.exports = router;
