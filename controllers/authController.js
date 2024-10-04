import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";
import transporter from "../middlewares/mailer.js";

/*
 ******************* Creating a New User ********************
 */
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const profileImage = req.file;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields (firstName, lastName, email, password).",
      });
    }

    if (!profileImage) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please upload a profile image.",
      });
    }

    if (!profileImage.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Uploaded file must be an image.",
      });
    }

    const profileImagePath = profileImage.path;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email.",
      });
    }

    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profileImage:profileImagePath,
      verified: false,
      verificationCode,
    });

    await newUser.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email",
      text: `Your verification code is: ${verificationCode}`,
    };

    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return reject(new Error("Failed to send verification email"));
        }
        resolve(info);
      });
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully! Verification email sent.",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        profileImagePath: newUser.profileImagePath,
        verified: newUser.verified,
      },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again later.",
      error: error.message,
    });
  }
};

/*
 ******************* Verifying User ********************
 */

const verifyUser = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified.",
      });
    }

    if (user.verificationCode === verificationCode) {
      user.verified = true;
      user.verificationCode = undefined;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Email verified successfully!",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }
  } catch (error) {
    console.error("Error verifying user:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: error.message,
    });
  }
};

/*
 ******************* Login User ********************
 */

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist!",
      });
    }

    if (!user.verified) {
      return res.status(400).json({
        success: false,
        message: "Email is not verified. Please verify your email first.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials! Please check your email or password.",
      });
    }

    const token = jwt.sign(
      { id: user._id},
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    user.token=token;
    await user.save();

    const { password: pwd,token:uToken, ...userWithoutPassword } = user.toObject();

    return res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword,
      message: "Login successful!",
    });
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again later.",
      error: err.message,
    });
  }
};

/*
 ******************* Forgot Password ********************
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User does not exist.",
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetPasswordExpires = Date.now() + 3600000;

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}`,
    };

    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return reject(new Error("Failed to send email."));
        }
        resolve(info);
      });
    });

    res.status(200).json({
      success: true,
      message: "Password reset email sent.",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({
      success: false,
      message:
        "Failed to process password reset request. Please try again later.",
      error: error.message,
    });
  }
};

/*
 ******************* reset Password ********************
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful!",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      success: false,
      message: "Password reset failed. Please try again later.",
      error: error.message,
    });
  }
};

/*
 ******************* Get All Users ********************
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .select("-password -token");

    const totalUsers = await User.countDocuments();

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully!",
      data: users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (err) {
    console.error("Error retrieving users:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: err.message,
    });
  }
};

/*
 ******************* Get User By ID ********************
 */

const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format.",
      });
    }

    const user = await User.findById(id).select("-password -token");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully!",
      user,
    });
  } catch (err) {
    console.error(`Error retrieving user with ID ${id}:`, err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user.",
      error: err.message,
    });
  }
};

/*
 ******************* Update User By ID ********************
 */
const updateUserById = async (req, res) => {
  const userId = req.userId;
  const { firstName, lastName, email, password } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID format." });
    }

    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res
          .status(409)
          .json({
            success: false,
            message: "Email is already in use by another account.",
          });
      }
    }

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;
    if (password) {
      const salt = await bcrypt.genSalt();
      updates.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    const {
      password: pwd,
      token,
      ...userWithoutSensitiveData
    } = updatedUser.toObject();

    res.status(200).json({
      success: true,
      message: "User updated successfully!",
      user: userWithoutSensitiveData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to update user.",
      error: err.message,
    });
  }
};

/*
 ******************* Logout ********************
 */
const logOut = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    user.token = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Logout successful. You have been logged out.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error occurred while logging out.",
      error: error.message,
    });
  }
};

/*
 ******************* resend Verification Mail ********************
 */
const resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    if (user.verified)
      return res
        .status(400)
        .json({ success: false, message: "Email already verified." });

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    user.verificationCode = verificationCode;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Resend Verification Code",
      text: `Your new verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email sending error:", error);
        return res
          .status(500)
          .json({
            success: false,
            message: "Failed to send email. Please try again later.",
          });
      }
      res
        .status(200)
        .json({
          success: true,
          message: "Verification email resent successfully.",
        });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while resending verification.",
      error: error.message,
    });
  }
};

/*
 ******************* Delete User ********************
 */
const deleteUser = async (req, res) => {
  const userId = req.userId;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format." });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully.",
      user: deletedUser,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while deleting the user.",
      error: error.message,
    });
  }
};

export default {
  createUser,
  verifyUser,
  loginUser,
  forgotPassword,
  resetPassword,
  resendVerification,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUser,
  logOut,
};
