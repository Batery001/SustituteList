import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ParsedCardSchema = new Schema(
  {
    qty: Number,
    name: String,
    setCode: String,
    number: String,
    lineRaw: String,
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

const DecklistSubmissionSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    playerName: { type: String, required: true },
    popId: { type: String, required: true, trim: true },
    birthDate: { type: Date, required: true },
    division: {
      type: String,
      enum: ["junior", "senior", "master"],
      required: true,
    },
    rawText: { type: String, required: true },
    parsedCards: [ParsedCardSchema],
    validation: { type: ValidationSchema, required: true },
    editToken: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

DecklistSubmissionSchema.index({ eventId: 1, popId: 1 }, { unique: true });

export type IDecklistSubmission = InferSchemaType<
  typeof DecklistSubmissionSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const DecklistSubmission: Model<IDecklistSubmission> =
  mongoose.models.DecklistSubmission ??
  mongoose.model<IDecklistSubmission>(
    "DecklistSubmission",
    DecklistSubmissionSchema
  );
