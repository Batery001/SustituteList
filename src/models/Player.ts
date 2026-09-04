import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const FamilyMemberSchema = new Schema(
  {
    playerName: { type: String, required: true, trim: true },
    popId: { type: String, required: true, trim: true },
    birthDate: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const PlayerSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    playerName: { type: String, required: true, trim: true },
    popId: { type: String, required: true, unique: true, trim: true },
    birthDate: { type: Date, required: true },
    emailVerifiedAt: { type: Date },
    emailVerificationSentAt: { type: Date },
    familyMembers: { type: [FamilyMemberSchema], default: [] },
  },
  { timestamps: true }
);

export type IFamilyMember = InferSchemaType<typeof FamilyMemberSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type IPlayer = InferSchemaType<typeof PlayerSchema> & {
  _id: mongoose.Types.ObjectId;
  familyMembers: IFamilyMember[];
};

export const Player: Model<IPlayer> =
  mongoose.models.Player ?? mongoose.model<IPlayer>("Player", PlayerSchema);
