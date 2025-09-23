const router = require("express").Router();

const dataMtuController = require("../controller/dataAsset/mtuController");
const dataKaryawan = require("../controller/dataAsset/dataKaryawanController");
const dataSldController = require("../controller/dataAsset/sldController");
const dataSloController = require("../controller/dataAsset/sloController");
const dataTowerController = require("../controller/dataAsset/towerController");

router.get("/data-asset/mtu/penggantian", dataMtuController.getPenggantianMtu);
router.get(
  "/data-asset/mtu/kondisi",
  dataMtuController.getMonitoringKondisiMtu
);
router.get("/data-asset/karyawan", dataKaryawan.getKaryawan);
router.get("/data-asset/sld", dataSldController.getSld);
router.get("/data-asset/slo", dataSloController.getSlo);
router.get("/data-asset/tower-kritis", dataTowerController.getTowerKritis);
router.get("/data-asset/row-kritis", dataTowerController.getRowKritis);

module.exports = router;
