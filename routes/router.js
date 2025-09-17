const router = require("express").Router();
//debug
router.use("/", require("./debugSpreadsheetRoute"));

//data asset
router.use("/", require("./dataAssetRoute"));

//monitoring
router.use("/", require("./monitoringRoute"));

//performance
router.use("/", require("./performanceRoute"));

module.exports = router;
