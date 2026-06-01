import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const StoreSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    timezone: { type: String, default: "America/Mexico_City" },
  },
  { timestamps: true }
);

export type IStore = InferSchemaType<typeof StoreSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Store: Model<IStore> =
  mongoose.models.Store ?? mongoose.model<IStore>("Store", StoreSchema);
