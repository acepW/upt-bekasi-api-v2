const router = require("express").Router();

const dataMtuController = require("../controller/dataAsset/mtuController");

router.get("/data-asset/mtu/penggantian", dataMtuController.getPenggantianMtu);
router.get(
  "/data-asset/mtu/kondisi",
  dataMtuController.getMonitoringKondisiMtu
);

module.exports = router;
