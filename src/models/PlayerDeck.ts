import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ParsedCardSchema = new Schema(
  {
    qty: Number,
    name: String,
    setCode: String,
    number: String,
    lineRaw: String,
    category: {
      type: String,
      enum: ["pokemon", "trainer", "energy"],
    },
  },
  { _id: false }
);

const ValidationSchema = new Schema(
  {
    cardCount: Number,
    errorMessages: [String],
    warnings: [String],
  },
  { _id: false }
);

const PlayerDeckSchema = new Schema(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    rawText: { type: String, required: true },
    parsedCards: [ParsedCardSchema],
    validation: { type: ValidationSchema, required: true },
  },
  { timestamps: true }
);

PlayerDeckSchema.index({ playerId: 1, name: 1 });

export type IPlayerDeck = InferSchemaType<typeof PlayerDeckSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PlayerDeck: Model<IPlayerDeck> =
  mongoose.models.PlayerDeck ??
  mongoose.model<IPlayerDeck>("PlayerDeck", PlayerDeckSchema);
