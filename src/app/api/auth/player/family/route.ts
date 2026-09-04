import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { msg } from "@/lib/messages";
import { getPlayerId } from "@/lib/player-auth";
import {
  isPopIdTakenForFamily,
  MAX_FAMILY_MEMBERS,
  serializeFamilyMember,
  validateFamilyMemberInput,
} from "@/lib/player/family-members";
import { Player } from "@/models/Player";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const playerId = await getPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      playerName?: string;
      popId?: string;
      birthDate?: string;
    };

    const parsed = validateFamilyMemberInput(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    await connectDB();
    const player = await Player.findById(playerId);
    if (!player) {
      return NextResponse.json({ error: msg.api.playerNotFound }, { status: 404 });
    }

    if ((player.familyMembers?.length ?? 0) >= MAX_FAMILY_MEMBERS) {
      return NextResponse.json(
        { error: `Puedes agregar hasta ${MAX_FAMILY_MEMBERS} familiares` },
        { status: 400 }
      );
    }

    if (
      await isPopIdTakenForFamily(parsed.popId, { excludePlayerId: playerId })
    ) {
      return NextResponse.json(
        { error: msg.api.duplicatePopIdAccount },
        { status: 409 }
      );
    }

    player.familyMembers.push({
      playerName: parsed.playerName,
      popId: parsed.popId,
      birthDate: parsed.birthDate,
    });
    await player.save();

    const added = player.familyMembers[player.familyMembers.length - 1];
    return NextResponse.json(
      { member: serializeFamilyMember(added) },
      { status: 201 }
    );
  } catch (err) {
    console.error("Add family member error:", err);
    return NextResponse.json(
      { error: "No se pudo agregar el familiar" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const playerId = await getPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { memberId?: string };
    const memberId = body.memberId?.trim();
    if (!memberId) {
      return NextResponse.json({ error: msg.api.allFieldsRequired }, { status: 400 });
    }

    await connectDB();
    const player = await Player.findById(playerId);
    if (!player) {
      return NextResponse.json({ error: msg.api.playerNotFound }, { status: 404 });
    }

    const before = player.familyMembers.length;
    player.familyMembers = player.familyMembers.filter(
      (m) => m._id.toString() !== memberId
    ) as typeof player.familyMembers;
    if (player.familyMembers.length === before) {
      return NextResponse.json({ error: "Familiar no encontrado" }, { status: 404 });
    }
    await player.save();

    return NextResponse.json({
      ok: true,
      familyMembers: player.familyMembers.map(serializeFamilyMember),
    });
  } catch (err) {
    console.error("Remove family member error:", err);
    return NextResponse.json(
      { error: "No se pudo quitar el familiar" },
      { status: 500 }
    );
  }
}
