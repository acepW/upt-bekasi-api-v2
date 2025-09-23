const router = require("express").Router();
//debug
router.use("/", require("./debugSpreadsheetRoute"));

//data asset
router.use("/", require("./dataAssetRoute"));

//monitoring
router.use("/", require("./monitoringRoute"));

//performance
router.use("/", require("./performanceRoute"));

//kinerja
router.use("/", require("./kinerjaRoute"));

//user
router.use("/", require("./userRoute"));

//auth
router.use("/", require("./authRoute"));

//article
router.use("/", require("./articleRoute"));

//video
router.use("/", require("./videoRoute"));

//
router.use("/", require("./uploadRoute"));

module.exports = router;
