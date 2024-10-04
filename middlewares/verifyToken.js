import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Access denied, no token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access denied, no token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || user.token !== token) {
      return res.status(403).json({ message: "Session expired or invalid." });
    }

    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid token. Please login again." });
  }
};
