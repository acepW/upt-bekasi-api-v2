const Users = require("../../model/userModel");
const { generate_access_token } = require("../../utils/jwt");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const bcrypt = require("bcryptjs");

const authController = {
  Login: async (req, res) => {
    try {
      if (!req.body.email && !req.body.password)
        return res.status(400).json({ msg: "Incomplete input data!" });

      const users = await Users.findOne({
        is_active: true,
        where: {
          email: req.body.email,
        },
      });
      if (!users) return res.status(404).json({ msg: "User Not Found" });

      const mach = await bcrypt.compare(req.body.password, users.password);
      if (!mach) return res.status(400).json({ msg: "Wrong Password" });

      const id = users.id;
      const name = users.nama;
      const email = users.email;
      const role = users.role;

      const access_token = generate_access_token({
        id: id,
        name: name,
        email: email,
        role: role,
      });

      res.cookie("access_token", access_token, {
        sameSite: "None",
        secure: true,
        httpOnly: true,
        path: "/",
      });

      res.status(200).json({
        status: "success",
        message: "login successfully",
        name,
        email,
        role,
      });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },

  Me: async (req, res, next) => {
    try {
      if (!req.cookies.access_token)
        return res.status(401).json({ msg: "Pliss Login!!" });

      const _id = req.user.id;

      const users = await Users.findByPk(_id);
      if (!users) return res.status(404).json({ msg: "User Not Found" });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },

  Logout: async (req, res) => {
    try {
      if (!req.cookies.access_token)
        return res.status(403).json({ msg: "Pliss Login" });

      const clear = res.clearCookie("access_token", {
        sameSite: "None",
        secure: true,
        httpOnly: true,
        path: "/",
      });
      if (!clear) return res.status(400).json({ msg: "Cannot Logout" });
      res.status(200).json({ msg: "Logout Succsess" });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },
};

module.exports = authController;
