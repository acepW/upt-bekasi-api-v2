const router = require("express").Router();

const dataHsseController = require("../controller/monitoring/hsseController");
const datakonstruksiController = require("../controller/monitoring/konstruksiController");
const dataAnggaranController = require("../controller/monitoring/anggaranController");
const dataLmAboController = require("../controller/monitoring/lmAboController");

router.get("/monitoring/hsse/peralatan", dataHsseController.getHssePeralatan);
router.get(
  "/monitoring/hsse/pekerjaanK3",
  dataHsseController.getHsseJadwalPekerjaanK3
);
router.get(
  "/monitoring/hsse/katalog",
  dataHsseController.getHsseKatalogPeralatan
);

router.get(
  "/monitoring/hsse/maturing-level-sustainability",
  dataHsseController.getHsseMaturingLevelSustain
);
router.get(
  "/monitoring/konstruksi/adkonDalkon",
  datakonstruksiController.getAdkonDalkon
);
router.get(
  "/monitoring/konstruksi/logistik/gudang",
  datakonstruksiController.getMonitoringGudang
);

router.get("/monitoring/anggaran", dataAnggaranController.getAnggaran);

router.get("/monitoring/lm-abo", dataLmAboController.getLmAbo);

module.exports = router;
