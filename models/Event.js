import mongoose from "mongoose";
const EventSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    photos: [
      {
        asset_id: { type: String, required: true },
        public_id: { type: String, required: true },
        version: { type: Number, required: true },
        version_id: { type: String, required: true },
        signature: { type: String, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        format: { type: String, required: true },
        resource_type: { type: String, required: true },
        created_at: { type: Date, required: true },
        tags: { type: [String], default: [] },
        bytes: { type: Number, required: true },
        type: { type: String, required: true },
        etag: { type: String, required: true },
        placeholder: { type: Boolean, default: false },
        url: { type: String, required: true },
        secure_url: { type: String, required: true },
        folder: { type: String, default: "" },
        original_filename: { type: String, required: true },
      },
    ],
    flyer: {
      asset_id: { type: String, required: true },
      public_id: { type: String, required: true },
      version: { type: Number, required: true },
      version_id: { type: String, required: true },
      signature: { type: String, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      format: { type: String, required: true },
      resource_type: { type: String, required: true },
      created_at: { type: Date, required: true },
      tags: { type: [String], default: [] },
      bytes: { type: Number, required: true },
      type: { type: String, required: true },
      etag: { type: String, required: true },
      placeholder: { type: Boolean, default: false },
      url: { type: String, required: true },
      secure_url: { type: String, required: true },
      folder: { type: String, default: "" },
      original_filename: { type: String, required: true },
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", EventSchema);

export default Event;
