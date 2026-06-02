import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getDivision } from "@/lib/division";
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

  const registrations = await Registration.find({ playerId: player._id })
    .sort({ createdAt: -1 })
    .limit(20)
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
    },
    registrations: registrations.map((r) => {
      const ev = eventMap.get(r.eventId.toString());
      return {
        id: r._id.toString(),
        accessToken: r.accessToken,
        paymentStatus: r.paymentStatus,
        eventSlug: ev?.slug,
        eventName: ev?.name,
        decklistSubmissionId: r.decklistSubmissionId?.toString(),
      };
    }),
  });
}
