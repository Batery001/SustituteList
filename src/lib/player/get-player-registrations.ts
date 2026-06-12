import { dbConnect } from "@/lib/dbConnect";
import { isEventOpen } from "@/lib/events/event-status";
import { isDeadlinePassed } from "@/lib/event-utils";
import { Registration } from "@/models/Registration";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import type { IEvent } from "@/models/Event";
import mongoose from "mongoose";

export type PlayerRegistrationRow = {
  id: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventStatus: string;
  startsAt: string;
  decklistDeadlineAt: string;
  deadlinePassed: boolean;
  canUploadDeck: boolean;
  paymentStatus: "pending" | "paid";
  hasDecklist: boolean;
  deckEditToken: string | null;
  division: string;
  createdAt: string;
};

function serializeRegistration(
  reg: {
    _id: mongoose.Types.ObjectId;
    paymentStatus: string;
    division: string;
    createdAt: Date;
    decklistSubmissionId?: mongoose.Types.ObjectId | null;
  },
  event: IEvent,
  editToken: string | null
): PlayerRegistrationRow {
  const deadlinePassed = isDeadlinePassed(new Date(event.decklistDeadlineAt));
  const eventOpen = isEventOpen(event.status);
  const paid = reg.paymentStatus === "paid";

  return {
    id: reg._id.toString(),
    eventId: event._id.toString(),
    eventName: event.name,
    eventSlug: event.slug,
    eventStatus: event.status,
    startsAt: event.startsAt.toISOString(),
    decklistDeadlineAt: event.decklistDeadlineAt.toISOString(),
    deadlinePassed,
    canUploadDeck: eventOpen && !deadlinePassed && paid,
    paymentStatus: paid ? "paid" : "pending",
    hasDecklist: Boolean(reg.decklistSubmissionId),
    deckEditToken: editToken,
    division: reg.division,
    createdAt: reg.createdAt.toISOString(),
  };
}

export async function getPlayerRegistrations(
  playerId: string
): Promise<{ active: PlayerRegistrationRow[]; history: PlayerRegistrationRow[] }> {
  await dbConnect();

  const objectId = new mongoose.Types.ObjectId(playerId);
  const registrations = await Registration.find({ playerId: objectId })
    .sort({ createdAt: -1 })
    .lean();

  if (registrations.length === 0) {
    return { active: [], history: [] };
  }

  const eventIds = [...new Set(registrations.map((r) => r.eventId.toString()))];
  const { Event } = await import("@/models/Event");
  const events = await Event.find({
    _id: { $in: eventIds.map((id) => new mongoose.Types.ObjectId(id)) },
  }).lean();

  const eventMap = new Map(events.map((e) => [e._id.toString(), e]));

  const submissionIds = registrations
    .map((r) => r.decklistSubmissionId)
    .filter((id): id is NonNullable<typeof id> => id != null);

  const submissions =
    submissionIds.length > 0
      ? await DecklistSubmission.find({ _id: { $in: submissionIds } })
          .select("_id editToken")
          .lean()
      : [];

  const tokenMap = new Map(
    submissions.map((s) => [s._id.toString(), s.editToken])
  );

  const rows: PlayerRegistrationRow[] = [];

  for (const reg of registrations) {
    const event = eventMap.get(reg.eventId.toString());
    if (!event) continue;

    const editToken = reg.decklistSubmissionId
      ? tokenMap.get(reg.decklistSubmissionId.toString()) ?? null
      : null;

    rows.push(serializeRegistration(reg, event as IEvent, editToken));
  }

  const active = rows.filter((r) => isEventOpen(r.eventStatus));
  const history = rows.filter((r) => !isEventOpen(r.eventStatus));

  return { active, history };
}

export async function getPlayerRegistrationById(
  playerId: string,
  registrationId: string
): Promise<PlayerRegistrationRow | null> {
  if (!mongoose.Types.ObjectId.isValid(registrationId)) return null;

  await dbConnect();

  const reg = await Registration.findOne({
    _id: registrationId,
    playerId: new mongoose.Types.ObjectId(playerId),
  }).lean();

  if (!reg) return null;

  const { Event } = await import("@/models/Event");
  const event = await Event.findById(reg.eventId).lean();
  if (!event) return null;

  let editToken: string | null = null;
  if (reg.decklistSubmissionId) {
    const sub = await DecklistSubmission.findById(reg.decklistSubmissionId)
      .select("editToken")
      .lean();
    editToken = sub?.editToken ?? null;
  }

  return serializeRegistration(reg, event as IEvent, editToken);
}
