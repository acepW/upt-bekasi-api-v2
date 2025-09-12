const router = require("express").Router();

const dataMtuController = require("../controller/dataAsset/mtuController");
const dataKaryawan = require("../controller/dataAsset/dataKaryawanController");
const dataSldController = require("../controller/dataAsset/sldController");
const dataSloController = require("../controller/dataAsset/sloController");

router.get("/data-asset/mtu/penggantian", dataMtuController.getPenggantianMtu);
router.get(
  "/data-asset/mtu/kondisi",
  dataMtuController.getMonitoringKondisiMtu
);
router.get("/data-asset/karyawan", dataKaryawan.getKaryawan);
router.get("/data-asset/sld", dataSldController.getSld);
router.get("/data-asset/slo", dataSloController.getSlo);

module.exports = router;
