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
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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

ChatSessionSchema.index({ userId: 1, scope: 1, updatedAt: -1 });

export const ChatSession = mongoose.model("ChatSession", ChatSessionSchema);
