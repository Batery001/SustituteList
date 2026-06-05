import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const RegistrationSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      index: true,
    },
    playerName: { type: String, required: true, trim: true },
    popId: { type: String, required: true, trim: true },
    birthDate: { type: Date, required: true },
    division: {
      type: String,
      enum: ["junior", "senior", "master"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      index: true,
    },
    paidAt: { type: Date },
    tbkBuyOrder: { type: String, index: true },
    tbkToken: { type: String, index: true },
    tbkAuthorizationCode: { type: String },
    accessToken: { type: String, required: true, unique: true, index: true },
    decklistSubmissionId: {
      type: Schema.Types.ObjectId,
      ref: "DecklistSubmission",
    },
    decklist: { type: String, default: "" },
  },
  { timestamps: true }
);

RegistrationSchema.index({ eventId: 1, popId: 1 }, { unique: true });

export type IRegistration = InferSchemaType<typeof RegistrationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Registration: Model<IRegistration> =
  mongoose.models.Registration ??
  mongoose.model<IRegistration>("Registration", RegistrationSchema);
