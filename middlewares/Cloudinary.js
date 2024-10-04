import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: "dyceamtvk",
  api_key: "436569631896442",
  api_secret: "fONElqz3VaxzyDEES2VxKt_7tiM",
});

const upload = multer({ dest: 'uploads/' })


export { cloudinary, upload };
