const HomePageImage = require("../model/homePageImageModel");

const VideoController = {
  getHomePage: async (req, res) => {
    try {
      const response = await HomePageImage.findByPk(1);
      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data: response,
      });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },

  updateHomePage: async (req, res) => {
    const { image_url } = req.body;
    try {
      const DataHomePage = await HomePageImage.findByPk(1);
      if (!DataHomePage) return res.status(404).json({ msg: "Data Not Found" });

      await HomePageImage.update(
        {
          image_url: image_url,
        },
        {
          where: {
            id: DataHomePage.id,
          },
        }
      ),
        res.status(200).json({ msg: "User Update Successfuly" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },
};

module.exports = VideoController;
