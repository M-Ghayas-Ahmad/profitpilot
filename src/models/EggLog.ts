import mongoose, { Schema, model } from "mongoose";

export type EggLogDoc = {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  /** Collection day, stored as UTC midnight of the YYYY-MM-DD the user picked. */
  date: Date;
  count: number;
  note?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const EggLogSchema = new Schema<EggLogDoc>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    count: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: "Egg count must be a whole number" },
    },
    note: { type: String, trim: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, strict: true },
);

// One entry per day per business — a day is edited, never double-counted.
EggLogSchema.index({ businessId: 1, date: -1 }, { unique: true });

if (mongoose.models.EggLog) {
  mongoose.deleteModel("EggLog");
}

export const EggLog = model<EggLogDoc>("EggLog", EggLogSchema);
