const Video = require("../model/videoModel");

const VideoController = {
  getVideo: async (req, res) => {
    const _id = req.params.id;
    const { is_active, limit, page } = req.query;

    let obj = {};
    if (is_active) obj.is_active = is_active;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
      if (page && limit) {
        const length = await Video.count({ where: obj });
        const data = await Video.findAll({
          order: [["createdAt", "DESC"]],
          limit: parseInt(limit),
          offset,
          where: obj,
        });
        return res.status(200).json({
          status: "success",
          message: "get data successfully",
          data: data,
          total_page: Math.ceil(length / parseInt(limit)),
        });
      } else if (_id) {
        const response = await Video.findByPk(_id);
        res.status(200).json({
          status: "success",
          message: "get data successfully",
          data: response,
        });
      } else {
        const response = await Video.findAll({
          where: obj,
          order: [["id", "DESC"]],
        });
        res.status(200).json({
          status: "success",
          message: "get data successfully",
          data: response,
        });
      }
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },

  createVideo: async (req, res) => {
    const { title, description, date, videoId, thumbnail } = req.body;

    if (!title || !description || !date || !videoId || !thumbnail)
      return res.status(400).json({ msg: "incomplite data" });

    try {
      await Video.create({
        title,
        description,
        date,
        videoId,
        thumbnail,
      }),
        res.status(201).json({ msg: "Register Successful" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },

  updateVideo: async (req, res) => {
    const _id = req.params.id;
    const { title, description, date, videoId, thumbnail } = req.body;

    try {
      const DataVideo = await Video.findByPk(_id);
      if (!DataVideo) return res.status(404).json({ msg: "Data Not Found" });

      await Video.update(
        {
          title: title,
          description: description,
          date: date,
          videoId: videoId,
          thumbnail: thumbnail,
        },
        {
          where: {
            id: DataVideo.id,
          },
        }
      ),
        res.status(200).json({ msg: "User Update Successfuly" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },

  deleteVideo: async (req, res) => {
    const _id = req.params.id;
    try {
      const DataVideo = await Video.findByPk(_id);
      if (!DataVideo) return res.status(404).json({ msg: "Data Not Found" });
      await Video.update(
        { is_active: false },
        {
          where: {
            id: DataVideo.id,
          },
        }
      ),
        res.status(200).json({ msg: "User Delete Successful" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },
};

module.exports = VideoController;
