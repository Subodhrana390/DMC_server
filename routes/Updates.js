import express from "express";
import controller from "../controllers/updatesController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Route to create a new update
router.post("/",verifyToken ,controller.createUpdate);

// Route to retrieve all active updates created by the current user
router.get("/user",verifyToken, controller.getUpdates);
// Route to retrieve all active updates 
router.get("/public", controller.getPublicUpdates);

// Route to retrieve a specific update by its ID
router.get("/:id",verifyToken, controller.getUpdatesByUserId);

// Route to update an existing update's status
router.patch("/:id",verifyToken, controller.updateStatus);

// Route to delete an existing update
router.delete("/:id", verifyToken,controller.deleteUpdate);

// Route to disable (set to Inactive) an existing update
router.patch("/:id/disable",verifyToken, controller.disableUpdate);

export default router;
