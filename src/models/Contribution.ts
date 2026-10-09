import mongoose, { Schema, model } from "mongoose";

/** Money a partner actually put into the business cash pot. */
export type ContributionDoc = {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  partnerId: mongoose.Types.ObjectId;
  partnerName: string;
  amount: number;
  note?: string;
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const ContributionSchema = new Schema<ContributionDoc>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
      index: true,
    },
    partnerName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
    date: { type: Date, required: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, strict: true },
);

ContributionSchema.index({ businessId: 1, date: -1 });

if (mongoose.models.Contribution) {
  mongoose.deleteModel("Contribution");
}

export const Contribution = model<ContributionDoc>(
  "Contribution",
  ContributionSchema,
);
