const router = require("express").Router();

const debugController = require("../controller/debugSpreadsheetController");
// Di file route Anda
router.get("/debug/all-files", debugController.debugAllfiles);
router.get("/debug/permissions", debugController.checkPermissions);
router.get("/debug/folder/:folderId", debugController.getFilesInFolder);

module.exports = router;
