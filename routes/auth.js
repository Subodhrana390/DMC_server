import express from "express";
import controller from "../controllers/authController.js";

import { verifyToken } from "../middlewares/verifyToken.js";
import { upload } from "../middlewares/Cloudinary.js";

const router = express.Router();

// User Registration
router.post(
  "/register",
  upload.single("ProfileImage"),
  controller.createUser
);

// User Verification
router.post("/verify", controller.verifyUser);

// User Login
router.post("/login", controller.loginUser);

// Password Reset Requests
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

// Resend Verification Code
router.post("/resend-verification", controller.resendVerification);

// User Logout
router.post("/logout", verifyToken, controller.logOut);

// Get All Users (Protected Route)
router.get("/", verifyToken, controller.getAllUsers);

// Get User By ID (Protected Route)
router.get("/:id", verifyToken, controller.getUserById);

// Update User Information (Protected Route)
router.put(
  "/",
  verifyToken,
  upload.single("profileImage"),
  controller.updateUserById
);

// Delete User
router.delete("/", verifyToken, controller.deleteUser);

export default router;
