import mongoose, { Schema, models, model } from "mongoose";

export type ActivityStatus = "Success" | "Failed";

export type ActivityLogDoc = {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userName: string;
  role: string;
  module: string;
  action: string;
  description: string;
  status: ActivityStatus;
  createdAt: Date;
  updatedAt: Date;
};

const ActivityLogSchema = new Schema<ActivityLogDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    userName: { type: String, required: true, trim: true },
    role: { type: String, required: true, default: "User" },
    module: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Success", "Failed"],
      required: true,
      default: "Success",
    },
  },
  { timestamps: true },
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });

export const ActivityLog =
  models.ActivityLog || model<ActivityLogDoc>("ActivityLog", ActivityLogSchema);
