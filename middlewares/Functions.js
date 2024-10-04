import crypto from "crypto";
import ApiKey from "../models/APIKey.js";

export const generateApiKey = () => {
  return crypto.randomBytes(10).toString("hex");
};

export const validateApiKey = async (req, res, next) => {
  try {
    const apiKey =
      req.headers["x-authorization"] || req.headers["X-Authorization"];

    if (!apiKey) {
      return res.status(403).json({ message: "API Key is required" });
    }

    const key = await ApiKey.findOne({ key: apiKey });

    if (!key) {
      return res.status(403).json({ message: "Invalid API Key" });
    }

    const currentTime = new Date();
    if (key.expiresAt < currentTime) {
      return res.status(403).json({ message: "API Key has expired" });
    }
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const generateAPIKey = async (req, res) => {
  const apiKey = generateApiKey();
  const expirationTime = new Date();
  expirationTime.setMonth(expirationTime.getMonth() + 1);
  const newAPIKey = new ApiKey({
    key: apiKey,
    expiresAt: expirationTime,
  });
  await newAPIKey.save();
  res.json({
    message: "API Key generated with expiration time!",
    apiKey: apiKey,
    expiresAt: expirationTime,
  });
};
