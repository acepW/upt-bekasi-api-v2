const router = require("express").Router();

const dataHsseController = require("../controller/monitoring/hsseController");
const datakonstruksiController = require("../controller/monitoring/konstruksiController");

router.get("/monitoring/hsse/peralatan", dataHsseController.getHssePeralatan);
router.get(
  "/monitoring/hsse/pekerjaanK3",
  dataHsseController.getHsseJadwalPekerjaanK3
);
router.get(
  "/monitoring/konstruksi/adkonDalkon",
  datakonstruksiController.getAdkonDalkon
);
router.get(
  "/monitoring/konstruksi/logistik/gudang",
  datakonstruksiController.getMonitoringGudang
);

module.exports = router;
