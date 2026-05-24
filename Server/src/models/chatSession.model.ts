import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { _id: false },
);

const ChatSessionSchema = new Schema(
  {
    documentIds: [{ type: String, required: true }],
    scope: {
      type: String,
      enum: ["selected", "all"],
      default: "selected",
    },
    messages: [MessageSchema],
  },
  { timestamps: true },
);

export const ChatSession = mongoose.model("ChatSession", ChatSessionSchema);
