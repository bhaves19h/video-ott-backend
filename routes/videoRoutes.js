const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ dest: "uploads/" });
const DB_PATH = path.join(__dirname, "../videos.json");

// Helper functions
function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ✅ MULTIPLE VIDEO UPLOAD
router.post("/upload", upload.array("videos"), async (req, res) => {
  try {
    const { title, category } = req.body;
    const files = req.files;

    let db = readDB();
    let uploaded = [];

    for (let file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "video",
        folder: "videos"
      });

      const videoObj = {
        id: Date.now() + Math.random(),
        title,
        category,
        videoUrl: result.secure_url,
        createdAt: new Date()
      };

      db.push(videoObj);
      writeDB(db);

      uploaded.push(videoObj);

      fs.unlinkSync(file.path); // delete temp file
    }

    writeDB(db);

    res.json({
      success: true,
      videos: uploaded
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ FETCH VIDEOS (FOR TV APP)
router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.reverse()); // latest first
});

module.exports = router;
