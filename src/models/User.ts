import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { USER_ROLES } from "@/types/models";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    popId: { type: String, trim: true, sparse: true },
    birthDate: { type: Date },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "PLAYER",
      index: true,
    },
  },
  { timestamps: true }
);

export type IUser = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
