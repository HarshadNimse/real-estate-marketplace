const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      const error = new Error("Only image files are allowed.");
      error.statusCode = 400;
      cb(error);
      return;
    }
    cb(null, true);
  },
});

module.exports = {
  upload,
};
