import type { IndexDescription } from "mongodb";
import { Registration } from "@/models/Registration";

function isPlayerUniqueIndex(idx: IndexDescription): boolean {
  const key = idx.key as Record<string, unknown> | undefined;
  if (!key) return false;
  return (
    key.eventId === 1 &&
    key.playerId === 1 &&
    Object.keys(key).length === 2
  );
}

function isLegacyUniquePopIdIndex(idx: IndexDescription): boolean {
  const key = idx.key as Record<string, unknown> | undefined;
  if (!key || !idx.unique) return false;
  const keys = Object.keys(key);
  return keys.length === 1 && keys[0] === "popId";
}

function hasObjectIdPartial(idx: IndexDescription): boolean {
  const filter = idx.partialFilterExpression as
    | { playerId?: { $type?: string } }
    | undefined;
  return filter?.playerId?.$type === "objectId";
}

async function dropIndexQuietly(name: string) {
  try {
    await Registration.collection.dropIndex(name);
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 27) return;
    throw err;
  }
}

/** El índice sparse {eventId, playerId} bloqueaba a todos los invitados menos uno. */
export async function ensureRegistrationIndexes(): Promise<void> {
  await Registration.updateMany(
    { playerId: null },
    { $unset: { playerId: 1 } }
  );

  const indexes = await Registration.collection.indexes();

  for (const idx of indexes) {
    if (!idx.name || idx.name === "_id_") continue;
    if (isLegacyUniquePopIdIndex(idx)) {
      await dropIndexQuietly(idx.name);
    }
    if (isPlayerUniqueIndex(idx) && !hasObjectIdPartial(idx)) {
      await dropIndexQuietly(idx.name);
    }
  }

  await Registration.collection.createIndex(
    { eventId: 1, popId: 1 },
    { unique: true, name: "eventId_1_popId_1" }
  );
  await Registration.collection.createIndex(
    { eventId: 1, playerId: 1 },
    {
      unique: true,
      name: "eventId_1_playerId_1",
      partialFilterExpression: { playerId: { $type: "objectId" } },
    }
  );
}
