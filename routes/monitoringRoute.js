const router = require("express").Router();

const dataHsseController = require("../controller/monitoring/hsseController");
const datakonstruksiController = require("../controller/monitoring/konstruksiController");

router.get("/monitoring/hsse/peralatan", dataHsseController.getHssePeralatan);
router.get(
  "/monitoring/konstruksi/adkonDalkon",
  datakonstruksiController.getAdkonDalkon
);

module.exports = router;
