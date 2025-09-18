const express = require("express");
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

function getExtension(filename) {
  const regex = /\.[^.]+$/;
  const match = filename.match(regex);
  return match ? match[0] : ".png"; // Default extension jika tidak ditemukan
}

// Function untuk memastikan direktori ada
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log("Created directory:", dirPath);
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Debug informasi
    console.log("=== UPLOAD DEBUG INFO ===");
    console.log("__dirname:", __dirname);
    console.log("process.cwd():", process.cwd());

    // Coba beberapa path yang mungkin benar
    const possiblePaths = [
      path.join(__dirname, "../file"), // Jika route di subfolder
      path.join(__dirname, "./file"), // Jika route di root
      path.join(process.cwd(), "file"), // Dari working directory
      "/www/wwwroot/backendProd/cblApiProd/file", // Absolute path
    ];

    let uploadPath = null;

    // Cari path yang benar
    for (const testPath of possiblePaths) {
      console.log("Testing path:", testPath);
      console.log("Path exists:", fs.existsSync(testPath));

      if (fs.existsSync(testPath)) {
        uploadPath = testPath;
        console.log("Using path:", uploadPath);
        break;
      }
    }

    // Jika tidak ada yang ditemukan, gunakan path pertama dan buat direktori
    if (!uploadPath) {
      uploadPath = possiblePaths[0];
      console.log("No existing path found, creating:", uploadPath);
      ensureDirectoryExists(uploadPath);
    }

    // Test write permission
    const testFile = path.join(uploadPath, "test-write-" + Date.now() + ".tmp");
    try {
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
      console.log("Write permission test: SUCCESS");
    } catch (err) {
      console.error("Write permission test: FAILED", err.message);
    }

    console.log("Final upload path:", uploadPath);
    console.log("=== END DEBUG INFO ===");

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    try {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = getExtension(file.originalname);
      const filename = file.fieldname + "-" + uniqueSuffix + ext;

      console.log("Generated filename:", filename);
      console.log("Original filename:", file.originalname);
      console.log("File mimetype:", file.mimetype);

      cb(null, filename);
    } catch (err) {
      console.error("Error generating filename:", err);
      cb(err);
    }
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Cek tipe file
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Endpoint upload
router.post("/images", (req, res) => {
  console.log("=== UPLOAD REQUEST START ===");
  console.log("Request headers:", req.headers);

  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({
        error: err.message,
        details: {
          code: err.code,
          errno: err.errno,
          path: err.path,
        },
      });
    }

    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    console.log("Upload successful:", req.file);
    console.log("=== UPLOAD REQUEST END ===");

    res.json({
      success: true,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
    });
  });
});

// Endpoint delete
router.delete("/images/:file", (req, res) => {
  try {
    console.log("=== DELETE REQUEST ===");
    console.log("File to delete:", req.params.file);

    // Cari file di beberapa lokasi yang mungkin
    const possiblePaths = [
      path.join(__dirname, "../file", req.params.file),
      path.join(__dirname, "./file", req.params.file),
      path.join(process.cwd(), "file", req.params.file),
      path.join("/www/wwwroot/backendProd/cblApiProd/file", req.params.file),
    ];

    let fileFound = false;
    let filePath = null;

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        fileFound = true;
        console.log("File found at:", filePath);
        break;
      }
    }

    if (!fileFound) {
      console.error("File not found:", req.params.file);
      return res.status(404).json({
        error: "File not found",
      });
    }

    fs.unlinkSync(filePath);
    console.log("File deleted successfully:", filePath);

    res.json({
      success: true,
      message: "Delete image successfully!",
      filename: req.params.file,
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});

// Test endpoint untuk debugging
router.get("/test-upload-path", (req, res) => {
  const debugInfo = {
    __dirname: __dirname,
    "process.cwd()": process.cwd(),
    "process.getuid()": process.getuid ? process.getuid() : "N/A",
    "process.getgid()": process.getgid ? process.getgid() : "N/A",
    paths: {},
  };

  const possiblePaths = [
    path.join(__dirname, "../file"),
    path.join(__dirname, "./file"),
    path.join(process.cwd(), "file"),
    "/www/wwwroot/backendProd/cblApiProd/file",
  ];

  possiblePaths.forEach((testPath, index) => {
    debugInfo.paths[`path_${index + 1}`] = {
      path: testPath,
      exists: fs.existsSync(testPath),
      isDirectory: fs.existsSync(testPath)
        ? fs.lstatSync(testPath).isDirectory()
        : false,
    };
  });

  res.json(debugInfo);
});

module.exports = router;
