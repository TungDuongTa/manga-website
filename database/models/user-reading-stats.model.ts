import { Schema, model, models } from "mongoose";

const userReadingStatsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    chaptersRead: { type: Number, required: true, default: 0, min: 0 },
    totalExp: { type: Number, required: true, default: 0, min: 0 },
    level: { type: Number, required: true, default: 1, min: 1 },
  },
  {
    timestamps: true,
  },
);

userReadingStatsSchema.index({ level: -1, updatedAt: -1 });

export const UserReadingStatsModel =
  models.UserReadingStats || model("UserReadingStats", userReadingStatsSchema);
