const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./config/databaseConfig");
const bodyParser = require("body-parser");
const Users = require("./model/userModel");
const Article = require("./model/articleModel");
const Video = require("./model/videoModel");
const path = require("path");
const app = express();
dotenv.config();

// (async () => {
//   await Video.sync({ alter: true });
// })();

app.use(
  cors({
    credentials: true,
    origin: true,
  })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  db.authenticate()
    .then(() => {
      res.json({ msg: "Connection has been established successfully." });
    })
    .catch((error) => {
      res.json({ msg: error });
    });
});

app.use("/api", require("./routes/router"));
app.use("/images", express.static(path.join(__dirname, "./file")));

app.listen(process.env.APP_PORT, () => {
  console.log(`Example app listening on port ${process.env.APP_PORT}`);
});
