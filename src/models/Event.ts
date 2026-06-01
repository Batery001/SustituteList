import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const EventSchema = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["cup", "challenge", "local"],
      default: "challenge",
    },
    slug: { type: String, required: true, unique: true },
    startsAt: { type: Date, required: true },
    decklistDeadlineAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["open", "closed", "archived"],
      default: "open",
      index: true,
    },
    allowedRegulationMarks: {
      type: [String],
      default: ["G", "H"],
    },
  },
  { timestamps: true }
);

EventSchema.index({ storeId: 1, status: 1 });

export type IEvent = InferSchemaType<typeof EventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Event: Model<IEvent> =
  mongoose.models.Event ?? mongoose.model<IEvent>("Event", EventSchema);
