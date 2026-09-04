import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getDivision } from "@/lib/division";
import { serializeFamilyMember } from "@/lib/player/family-members";
import { getPlayerId } from "@/lib/player-auth";
import { Player } from "@/models/Player";
import { Registration } from "@/models/Registration";
import { Event } from "@/models/Event";

export async function GET() {
  const playerId = await getPlayerId();
  if (!playerId) {
    return NextResponse.json({ player: null });
  }

  await connectDB();

  const player = await Player.findById(playerId).lean();
  if (!player) {
    return NextResponse.json({ player: null });
  }

  const registrations = await Registration.find({
    $or: [{ playerId: player._id }, { registeredByPlayerId: player._id }],
  })
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();

  const eventIds = registrations.map((r) => r.eventId);
  const events = await Event.find({ _id: { $in: eventIds } }).lean();
  const eventMap = new Map(events.map((e) => [e._id.toString(), e]));

  return NextResponse.json({
    player: {
      id: player._id.toString(),
      playerName: player.playerName,
      popId: player.popId,
      email: player.email,
      birthDate: player.birthDate,
      division: getDivision(player.birthDate),
      familyMembers: (player.familyMembers ?? []).map(serializeFamilyMember),
    },
    registrations: registrations.map((r) => {
      const ev = eventMap.get(r.eventId.toString());
      return {
        id: r._id.toString(),
        accessToken: r.accessToken,
        paymentStatus: r.paymentStatus,
        playerName: r.playerName,
        popId: r.popId,
        eventSlug: ev?.slug,
        eventName: ev?.name,
        decklistSubmissionId: r.decklistSubmissionId?.toString(),
        isFamilyMember: Boolean(r.registeredByPlayerId),
      };
    }),
  });
}
