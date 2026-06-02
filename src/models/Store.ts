import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const StoreSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    timezone: { type: String, default: "America/Mexico_City" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    phone: { type: String, default: "" },
    description: { type: String, default: "" },
    defaultEntryFeeCents: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type IStore = InferSchemaType<typeof StoreSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Store: Model<IStore> =
  mongoose.models.Store ?? mongoose.model<IStore>("Store", StoreSchema);
