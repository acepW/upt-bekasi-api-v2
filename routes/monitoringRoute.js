const router = require("express").Router();

const dataHsseController = require("../controller/monitoring/hsseController");

router.get("/monitoring/hsse/peralatan", dataHsseController.getHssePeralatan);

module.exports = router;
