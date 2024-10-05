import Updates from "../models/Updates.js";

/**
 * Create a new update.
 */
const createUpdate = async (req, res) => {
  const { title, description, type, link } = req.body;

  // Validate required fields
  if (!title || !description || !type) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: All fields (title, description, type, link) are required.",
      update: null,
    });
  }

  try {
    const update = new Updates({
      title,
      description,
      type,
      link,
      creator: req.userId, // Add the creator's ID from the authenticated user
    });

    await update.save();

    return res.status(201).json({
      success: true,
      message: "Update successfully created.",
      update,
    });
  } catch (err) {
    console.error("Error creating update:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Failed to create the update. Please try again later.",
      update: null,
    });
  }
};

/**
 * Retrieve all active updates created by the current user.
 */
const getUpdates = async (req, res) => {
  try {
    const updates = await Updates.find({
      status: "Active",
      creator: req.userId, // Only get updates created by the current user
    }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      message: "Updates retrieved successfully.",
      updates,
    });
  } catch (err) {
    console.error("Error fetching updates:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Failed to fetch updates. Please try again later.",
      error: err.message,
      updates: null,
    });
  }
};

/**
 * Retrieve all active updates.
 */
const getPublicUpdates = async (req, res) => {
  try {
    const updates = await Updates.find({ status: "Active" }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      message: "Updates retrieved successfully.",
      updates,
    });
  } catch (err) {
    console.error("Error fetching updates:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Failed to fetch updates. Please try again later.",
      error: err.message,
      updates: null,
    });
  }
};

/**
 * Retrieve a specific active update created by the current user.
 */
const getUpdatesByUserId = async (req, res) => {
  const { id } = req.params;
  try {
    const update = await Updates.findOne({
      status: "Active",
      _id: id,
      creator: req.userId,
    });

    if (!update) {
      return res.status(404).json({
        success: false,
        message: "Update not found or you are not authorized to access this.",
        update: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Update retrieved successfully.",
      update,
    });
  } catch (err) {
    console.error("Error fetching update:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Failed to fetch update. Please try again later.",
      error: err.message,
      update: null,
    });
  }
};

/**
 * Update an existing update created by the current user.
 */
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { title, description, type } = req.body;

  // Validate required fields
  if (!title || !description || !type) {
    return res.status(400).json({
      success: false,
      message: "Validation Error: Title, description, and type are required.",
      update: null,
    });
  }

  try {
    const updatedUpdate = await Updates.findOneAndUpdate(
      { _id: id, creator: req.userId },
      { title, description, type },
      { new: true, runValidators: true }
    );

    if (!updatedUpdate) {
      return res.status(404).json({
        success: false,
        message: "Update not found or you are not authorized to update this.",
        update: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Update status updated successfully.",
      update: updatedUpdate,
    });
  } catch (err) {
    console.error("Error updating status for ID:", id, "Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Failed to update status. Please try again later.",
      error: err.message,
      update: null,
    });
  }
};

/**
 * Delete an existing update created by the current user.
 */
const deleteUpdate = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUpdate = await Updates.findOneAndDelete({
      _id: id,
      creator: req.userId,
    });

    if (!deletedUpdate) {
      return res.status(404).json({
        success: false,
        message: "Update not found or you are not authorized to delete this.",
        update: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Update deleted successfully.",
      update: deletedUpdate,
    });
  } catch (err) {
    console.error("Error deleting update with ID:", id, "Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Failed to delete update. Please try again later.",
      error: err.message,
      update: null,
    });
  }
};

/**
 * Disable an existing update created by the current user by setting its status to Inactive.
 */
const disableUpdate = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedUpdate = await Updates.findOneAndUpdate(
      { _id: id, creator: req.userId },
      { status: "Inactive" },
      { new: true, runValidators: true }
    );

    if (!updatedUpdate) {
      return res.status(404).json({
        success: false,
        message: "Update not found or you are not authorized to disable this.",
        update: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Update disabled successfully.",
      update: updatedUpdate,
    });
  } catch (err) {
    console.error("Error disabling update with ID:", id, "Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: Failed to disable update. Please try again later.",
      error: err.message,
      update: null,
    });
  }
};

export default {
  createUpdate,
  getUpdates,
  getPublicUpdates,
  getUpdatesByUserId,
  updateStatus,
  deleteUpdate,
  disableUpdate,
};
