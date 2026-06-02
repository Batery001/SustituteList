import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PlayerSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    playerName: { type: String, required: true, trim: true },
    popId: { type: String, required: true, unique: true, trim: true },
    birthDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export type IPlayer = InferSchemaType<typeof PlayerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Player: Model<IPlayer> =
  mongoose.models.Player ?? mongoose.model<IPlayer>("Player", PlayerSchema);
