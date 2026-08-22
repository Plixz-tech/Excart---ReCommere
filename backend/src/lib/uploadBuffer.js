import cloudinary from "../lib/cloudinary.js";

export const uploadBufferToCloudinary = (
  buffer,
  options = {}
) => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder:
            options.folder ||
            "excart/uploads",

          resource_type:
            options.resource_type ||
            "auto",

          public_id:
            options.public_id,

          format:
            options.format,

        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

    uploadStream.end(buffer);
  });
};