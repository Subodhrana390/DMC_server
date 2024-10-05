import { validationResult } from "express-validator";
import { cloudinary } from "../middlewares/Cloudinary.js";
import fs from "fs";
import Event from "../models/Event.js";
import { query } from "express";

// CREATE EVENT
const uploadToCloudinary = async (filePath, folder) => {
  try {
    return await cloudinary.uploader.upload(filePath, { folder });
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

const deleteTemporaryFiles = (filePaths) => {
  filePaths.forEach((filePath) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to delete file: ${filePath} - ${err.message}`);
      }
      console.info(`Deleted temporary file: ${filePath}`);
    });
  });
};

const createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { flyer, photos } = req.files || {};
  console.log(photos);
  if (!flyer || flyer.length === 0 || !photos || photos.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Flyer and photos are required." });
  }

  try {
    const flyerFilePath = flyer[0].path;
    const flyerUpload = await uploadToCloudinary(flyerFilePath, "flyers");

    const photosUploads = await Promise.all(
      photos.map(async (photo) => uploadToCloudinary(photo.path, "photos"))
    );

    const photosArray = photosUploads.map((photo) => ({
      asset_id: photo.asset_id,
      public_id: photo.public_id,
      version: photo.version,
      version_id: photo.version_id,
      signature: photo.signature,
      width: photo.width,
      height: photo.height,
      format: photo.format,
      resource_type: photo.resource_type,
      created_at: photo.created_at,
      tags: photo.tags,
      bytes: photo.bytes,
      type: photo.type,
      etag: photo.etag,
      placeholder: photo.placeholder,
      url: photo.url,
      secure_url: photo.secure_url,
      folder: photo.folder,
      original_filename: photo.original_filename,
    }));

    const event = new Event({
      creator: req.userId,
      title: req.body.title,
      description: req.body.description,
      photos: photosArray,
      flyer: {
        asset_id: flyerUpload.asset_id,
        public_id: flyerUpload.public_id,
        version: flyerUpload.version,
        version_id: flyerUpload.version_id,
        signature: flyerUpload.signature,
        width: flyerUpload.width,
        height: flyerUpload.height,
        format: flyerUpload.format,
        resource_type: flyerUpload.resource_type,
        created_at: flyerUpload.created_at,
        tags: flyerUpload.tags,
        bytes: flyerUpload.bytes,
        type: flyerUpload.type,
        etag: flyerUpload.etag,
        placeholder: flyerUpload.placeholder,
        url: flyerUpload.url,
        secure_url: flyerUpload.secure_url,
        folder: flyerUpload.folder,
        original_filename: flyerUpload.original_filename,
      },
      featured: false,
    });

    await event.save();

    deleteTemporaryFiles([flyerFilePath, ...photos.map((photo) => photo.path)]);

    return res.status(201).json({ success: true, event });
  } catch (error) {
    logger.error("Error creating event:", error);
    return res.status(500).json({
      success: false,
      message: "Server error, event creation failed.",
    });
  }
};

// READ EVENTS
const getEvents = async (req, res) => {
  const query = {};
  if (req.query.featured) query.featured = req.query.featured;
  try {
    const events = await Event.find(query)
      .sort({ _id: -1 })
      .populate("creator");
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// READ EVENTS
const getFeaturedEvent = async (req, res) => {
  try {
    const events = await Event.find();

    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No featured events found." });
    }

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching featured events:", error);

    if (error.name === "MongoNetworkError") {
      return res.status(503).json({ message: "Database connection error." });
    } else if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid query." });
    }

    res.status(500).json({ message: "An unexpected error occurred." });
  }
};

// READ EVENT BY ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("creator");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE EVENT
const updateEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (req.files?.flyer) {
      const flyerUpload = await cloudinary.uploader.upload(
        req.files.flyer[0].path,
        { folder: "flyers" }
      );
      await cloudinary.uploader.destroy(event.flyer.public_id);
      event.flyer = flyerUpload; // Updated flyer information
    }

    if (req.files?.photos) {
      const newPhotos = await Promise.all(
        req.files.photos.map((file) =>
          cloudinary.uploader.upload(file.path, { folder: "photos" })
        )
      );

      const formattedPhotos = newPhotos.map((photo) => ({
        asset_id: photo.asset_id,
        public_id: photo.public_id,
        version: photo.version,
        version_id: photo.version_id,
        signature: photo.signature,
        width: photo.width,
        height: photo.height,
        format: photo.format,
        resource_type: photo.resource_type,
        created_at: photo.created_at,
        tags: photo.tags,
        bytes: photo.bytes,
        type: photo.type,
        etag: photo.etag,
        url: photo.url,
        secure_url: photo.secure_url,
        folder: photo.folder,
        original_filename: photo.original_filename,
      }));
      event.photos.push(...formattedPhotos); // Add new photos
    }

    if (req.body.public_ids) {
      const publicIdsToDelete = Array.isArray(req.body.public_ids)
        ? req.body.public_ids
        : [req.body.public_ids];

      await Promise.all(
        publicIdsToDelete.map(async (publicId) => {
          const photoIndex = event.photos.find(
            (photo) => photo.public_id === publicId
          );
          console.log(photoIndex);
          if (photoIndex !== -1) {
            const result = await cloudinary.uploader.destroy(publicId);
            if (result.result === "ok") {
              event.photos.splice(photoIndex, 1); // Remove deleted photo from event
            } else {
              console.error(
                `Failed to delete photo from Cloudinary: ${publicId}`
              );
            }
          } else {
            console.error(`Photo not found in MongoDB: ${publicId}`);
          }
        })
      );
    }

    Object.assign(event, req.body); // Update event details
    await event.save(); // Save changes

    return res.status(200).json({ success: true, event });
  } catch (error) {
    console.error("Error updating event:", error);
    return res
      .status(500)
      .json({ success: false, message: "Event update failed." });
  }
};

// DELETE EVENT
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    await cloudinary.uploader.destroy(event.flyer.public_id);
    await Promise.all(
      event.photos.map((photo) => cloudinary.uploader.destroy(photo.public_id))
    );
    await event.save();

    await Event.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Event deletion failed.",
    });
  }
};

const featuredUpdate = async (req, res) => {
  const { id } = req.params;

  try {
    const EventUpdate = await Event.findOneAndUpdate(
      { _id: id, creator: req.userId },
      { featured: true },
      { new: true, runValidators: true }
    );

    if (!EventUpdate) {
      return res.status(404).json({
        success: false,
        message: "Update not found or you are not authorized to disable this.",
        update: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event featured successfully.",
      event: EventUpdate,
    });
  } catch (err) {
    console.error("Error disabling update with ID:", id, "Error:", err);
    return res.status(500).json({
      success: false,
      message:
        "Internal Server Error: Failed to disable update. Please try again later.",
      error: err.message,
      update: null,
    });
  }
};
const disableFeatured = async (req, res) => {
  const { id } = req.params;

  try {
    const EventUpdate = await Event.findOneAndUpdate(
      { _id: id, creator: req.userId },
      { featured: false },
      { new: true, runValidators: true }
    );

    if (!EventUpdate) {
      return res.status(404).json({
        success: false,
        message: "Update not found or you are not authorized to disable this.",
        update: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event featured disbaled successfully.",
      event: EventUpdate,
    });
  } catch (err) {
    console.error("Error disabling update with ID:", id, "Error:", err);
    return res.status(500).json({
      success: false,
      message:
        "Internal Server Error: Failed to disable update. Please try again later.",
      error: err.message,
      update: null,
    });
  }
};

export default {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getFeaturedEvent,
  featuredUpdate,
  disableFeatured,
};
