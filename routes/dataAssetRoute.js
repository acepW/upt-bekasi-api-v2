const router = require("express").Router();

const dataMtuController = require("../controller/dataAsset/mtuController");
const dataKaryawan = require("../controller/dataAsset/dataKaryawanController");

router.get("/data-asset/mtu/penggantian", dataMtuController.getPenggantianMtu);
router.get(
  "/data-asset/mtu/kondisi",
  dataMtuController.getMonitoringKondisiMtu
);
router.get("/data-asset/karyawan", dataKaryawan.getKaryawan);

module.exports = router;
