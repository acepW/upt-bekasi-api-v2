const Article = require("../model/articleModel");

const articleController = {
  getArticle: async (req, res) => {
    const _id = req.params.id;
    const { is_active, limit, page } = req.query;

    let obj = {};
    if (is_active) obj.is_active = is_active;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
      if (page && limit) {
        const length = await Article.count({ where: obj });
        const data = await Article.findAll({
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
        const response = await Article.findByPk(_id);
        res.status(200).json({
          status: "success",
          message: "get data successfully",
          data: response,
        });
      } else {
        const response = await Article.findAll({
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

  createArticle: async (req, res) => {
    const { title, description, date, image, link } = req.body;

    if (!title || !description || !date || !image || !link)
      return res.status(400).json({ msg: "incomplite data" });

    try {
      await Article.create({
        title,
        description,
        date,
        image,
        link,
      }),
        res.status(201).json({ msg: "Register Successful" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },

  updateArticle: async (req, res) => {
    const _id = req.params.id;
    const { title, description, date, image, link } = req.body;

    try {
      const DataArticle = await Article.findByPk(_id);
      if (!DataArticle) return res.status(404).json({ msg: "Data Not Found" });

      await Article.update(
        {
          title: title,
          description: description,
          date: date,
          image: image,
          link: link,
        },
        {
          where: {
            id: DataArticle.id,
          },
        }
      ),
        res.status(200).json({ msg: "User Update Successfuly" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },

  deleteArticle: async (req, res) => {
    const _id = req.params.id;
    try {
      const DataArticle = await Article.findByPk(_id);
      if (!DataArticle) return res.status(404).json({ msg: "Data Not Found" });
      await Article.update(
        { is_active: false },
        {
          where: {
            id: DataArticle.id,
          },
        }
      ),
        res.status(200).json({ msg: "User Delete Successful" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },
};

module.exports = articleController;
