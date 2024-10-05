import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import path from "path";

cloudinary.config({
  cloud_name: "dyceamtvk",
  api_key: "436569631896442",
  api_secret: "fONElqz3VaxzyDEES2VxKt_7tiM",
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

export { cloudinary, upload };
