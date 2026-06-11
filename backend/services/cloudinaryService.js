const { v2: cloudinary } = require("cloudinary");
const env = require("../config/env");

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

function isCloudinaryConfigured() {
  return (
    Boolean(env.cloudinary.cloudName) &&
    Boolean(env.cloudinary.apiKey) &&
    Boolean(env.cloudinary.apiSecret)
  );
}

async function uploadPropertyImage(buffer, fileName) {
  if (!isCloudinaryConfigured()) {
    return new Promise((resolve) => {
      const placeholder = `https://placehold.co/600x400?text=${encodeURIComponent("Property Image")}`;
      resolve({
        imageUrl: placeholder,
        publicId: `placeholder-${Date.now()}-${fileName.replace(/\s+/g, "-")}`,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "real-estate-marketplace/properties",
        resource_type: "image",
        public_id: `${Date.now()}-${fileName.replace(/\s+/g, "-")}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({
          imageUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
}

async function deletePropertyImage(publicId) {
  if (!isCloudinaryConfigured() || !publicId || publicId.startsWith("placeholder-")) {
    return;
  }
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("Cloudinary delete warning:", err.message);
  }
}

module.exports = {
  uploadPropertyImage,
  deletePropertyImage,
};
