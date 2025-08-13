const router = require("express").Router();
//debug
router.use("/", require("./debugSpreadsheetRoute"));

//data asset
router.use("/", require("./dataAssetRoute"));

//monitoring
router.use("/", require("./monitoringRoute"));

module.exports = router;
