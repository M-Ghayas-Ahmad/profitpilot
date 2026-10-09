import mongoose, { Schema, model } from "mongoose";

export type PartnerDoc = {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  name: string;
  /** How much this partner agreed to put in (e.g. 25_000). */
  committedAmount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const PartnerSchema = new Schema<PartnerDoc>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    committedAmount: { type: Number, required: true, min: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, strict: true },
);

PartnerSchema.index({ businessId: 1, name: 1 }, { unique: true });

if (mongoose.models.Partner) {
  mongoose.deleteModel("Partner");
}

export const Partner = model<PartnerDoc>("Partner", PartnerSchema);
