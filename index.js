const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();
dotenv.config();

app.use(
  cors({
    credentials: true,
    origin: true,
  })
);
app.use(express.json());
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello");
});

app.use("/api", require("./routes/router"));

app.listen(process.env.APP_PORT, () => {
  console.log(`Example app listening on port ${process.env.APP_PORT}`);
});
