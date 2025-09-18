const router = require("express").Router();
const VideoController = require("../controller/videoController");
const { auth } = require("../middlewares/authMiddlewares");

router.get("/video", auth, VideoController.getVideo);
router.get("/video/:id", auth, VideoController.getVideo);
router.post("/video", auth, VideoController.createVideo);
router.put("/video/:id", auth, VideoController.updateVideo);
router.delete("/video/:id", auth, VideoController.deleteVideo);

module.exports = router;
