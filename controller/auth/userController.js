const Users = require("../../model/userModel");
const bcrypt = require("bcryptjs");

const userController = {
  getUsers: async (req, res) => {
    const _id = req.params.id;
    const { role, is_active, limit, page } = req.query;

    let obj = {};
    if (role) obj.role = role;
    if (is_active) obj.is_active = is_active;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
      if (page && limit) {
        const length = await Users.count({ where: obj });
        const data = await Users.findAll({
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
        const response = await Users.findByPk(_id);
        res.status(200).json({
          status: "success",
          message: "get data successfully",
          data: response,
        });
      } else {
        const response = await Users.findAll({
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

  createUsers: async (req, res) => {
    const { nama, email, password, confPassword, role } = req.body;

    if (!nama || !email || !password || !confPassword || !role)
      return res.status(400).json({ msg: "incomplite data" });

    if (password !== confPassword)
      return res
        .status(400)
        .json({ msg: "Password And Confirm Password Doesn't Mach" });

    try {
      const users = await Users.findOne({
        where: {
          email: email,
        },
      });
      if (users) return res.status(404).json({ msg: "Email Alredy To Use" });
      const hasPassword = await bcrypt.hash(password, 10);
      await Users.create({
        nama: nama,
        email: email,
        password: hasPassword,
        role: role,
      }),
        res.status(201).json({ msg: "Register Successful" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },

  updateUsers: async (req, res) => {
    const _id = req.params.id;
    const { nama, email, password, confPassword, role, image_url } = req.body;

    try {
      const users = await Users.findByPk(_id);
      if (!users) return res.status(404).json({ msg: "User Not Found" });

      let hashPassword;
      //console.log(password);
      if (password === "" || password === null) {
        hashPassword = users.password;
      } else {
        hashPassword = await bcrypt.hash(password, 10);
      }

      if (password !== confPassword)
        return res
          .status(400)
          .json({ msg: "Password And Confirm Password Doesn't Mact" });

      await Users.update(
        {
          nama: nama,
          email: email,
          password: hashPassword,
          role: role,
          image_url: image_url,
        },
        {
          where: {
            id: users.id,
          },
        }
      ),
        res.status(200).json({ msg: "User Update Successfuly" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },

  deleteUsers: async (req, res) => {
    const _id = req.params.id;
    try {
      const users = await Users.findByPk(_id);
      if (!users) return res.status(404).json({ msg: "User Not Found" });
      await Users.update(
        { is_active: false },
        {
          where: {
            id: users.id,
          },
        }
      ),
        res.status(200).json({ msg: "User Delete Successful" });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },
};

module.exports = userController;
