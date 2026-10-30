
import multer from "multer";

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG and WEBP image files are allowed."
      )
    );
  }
};

const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG and PDF files are allowed."
      )
    );
  }
};

const createUpload = (fileFilter) =>
  multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter,
  });

const upload = createUpload(documentFileFilter);

export const uploadImages = createUpload(imageFileFilter);

export default upload;