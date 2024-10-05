import express from "express";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();
import cors from "cors";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/Event.js";
import updatesRoutes from "./routes/Updates.js"; 
import {
  generateAPIKey,
  validateApiKey,
} from "./middlewares/Functions.js";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);
app.use(bodyParser.json());
app.use(express.static("uploads"));
app.post("/api/generate-api-key", generateAPIKey);

// Routes
app.use("/api/v1/auth",validateApiKey, authRoutes);
app.use("/api/v1/event",validateApiKey,eventRoutes);
app.use("/api/v1/updates", validateApiKey, updatesRoutes);

app.get("/health", (req, res) => {
  res.send("Health! Ok");
});

const keepAlive = () => {
  setInterval(async () => {
    try {
      const res = await axios.get('https://dmc-server.onrender.com/health');
      console.log(`Self-ping success: ${res.data}`);
    } catch (error) {
      console.error('Self-ping failed:', error.message);
    }
  }, 13 * 60 * 1000);
};

mongoose
  .connect(process.env.MONGO_URI, {
    dbName:"DMC_dev"
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    keepAlive();
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });
