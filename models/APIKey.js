import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
  {
    key: String,
    expiresAt: { type: Date, index: { expires: "0s" } },
  },
  { timestamps: true }
);
const ApiKey = mongoose.model("ApiKey", apiKeySchema);

export default ApiKey;
