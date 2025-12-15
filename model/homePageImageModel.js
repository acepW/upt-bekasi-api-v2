const { Sequelize } = require("sequelize");
const db = require("../config/databaseConfig");

const { DataTypes } = Sequelize;

const HomePageImage = db.define(
  "home_page_image",
  {
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    freezeTableName: true,
  }
);

module.exports = HomePageImage;
