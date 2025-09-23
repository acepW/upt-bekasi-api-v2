const router = require("express").Router();

const dataKinerjaUpt = require("../controller/kinerja/kinerjaUptController");

router.get("/kinerja/upt", dataKinerjaUpt.getKinerjaUpt);

module.exports = router;
