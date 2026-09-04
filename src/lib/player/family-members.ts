import { dbConnect } from "@/lib/dbConnect";
import { isValidPopId, normalizePopId } from "@/lib/pop-id";
import { Player, type IFamilyMember, type IPlayer } from "@/models/Player";
import { User } from "@/models/User";
import mongoose from "mongoose";

export const MAX_FAMILY_MEMBERS = 8;

export type FamilyMemberDto = {
  id: string;
  playerName: string;
  popId: string;
  birthDate: string;
};

export function serializeFamilyMember(m: IFamilyMember): FamilyMemberDto {
  return {
    id: m._id.toString(),
    playerName: m.playerName,
    popId: m.popId,
    birthDate:
      m.birthDate instanceof Date
        ? m.birthDate.toISOString().slice(0, 10)
        : String(m.birthDate).slice(0, 10),
  };
}

/** Pop ID ya usado por una cuenta o por otro familiar (excepto exclude). */
export async function isPopIdTakenForFamily(
  popId: string,
  options?: {
    excludePlayerId?: string;
    excludeFamilyMemberId?: string;
  }
): Promise<boolean> {
  await dbConnect();
  const normalized = normalizePopId(popId);

  const [users, players] = await Promise.all([
    User.find({ popId: { $exists: true, $nin: [null, ""] } }).select("popId"),
    Player.find().select("popId familyMembers"),
  ]);

  if (users.some((u) => u.popId && normalizePopId(u.popId) === normalized)) {
    return true;
  }

  for (const p of players) {
    if (
      options?.excludePlayerId &&
      p._id.toString() === options.excludePlayerId
    ) {
      // El padre no puede agregarse a sí mismo como familiar
      if (normalizePopId(p.popId) === normalized) return true;
      for (const m of p.familyMembers ?? []) {
        if (
          options.excludeFamilyMemberId &&
          m._id.toString() === options.excludeFamilyMemberId
        ) {
          continue;
        }
        if (normalizePopId(m.popId) === normalized) return true;
      }
      continue;
    }
    if (normalizePopId(p.popId) === normalized) return true;
    for (const m of p.familyMembers ?? []) {
      if (normalizePopId(m.popId) === normalized) return true;
    }
  }

  return false;
}

export function findFamilyMember(
  player: IPlayer,
  familyMemberId: string
): IFamilyMember | null {
  if (!mongoose.Types.ObjectId.isValid(familyMemberId)) return null;
  return (
    (player.familyMembers ?? []).find(
      (m) => m._id.toString() === familyMemberId
    ) ?? null
  );
}

export function validateFamilyMemberInput(input: {
  playerName?: string;
  popId?: string;
  birthDate?: string;
}): { playerName: string; popId: string; birthDate: Date } | { error: string } {
  const playerName = input.playerName?.trim() ?? "";
  const rawPopId = input.popId?.trim() ?? "";
  if (!playerName || !rawPopId || !input.birthDate) {
    return { error: "Nombre, Pop ID y fecha de nacimiento son obligatorios" };
  }
  if (!isValidPopId(rawPopId)) {
    return { error: "El Pop ID no es válido" };
  }
  const birthDate = new Date(input.birthDate);
  if (Number.isNaN(birthDate.getTime())) {
    return { error: "Fecha de nacimiento no válida" };
  }
  return {
    playerName,
    popId: normalizePopId(rawPopId),
    birthDate,
  };
}
