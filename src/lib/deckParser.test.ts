import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isBasicEnergy,
  isEnergyCardName,
  parsePokemonDecklist,
  toStoredParsedCards,
} from "./deckParser";
import { normalizeEventStatus, isEventOpen } from "./events/event-status";

function deckWithQtyPerLine(qty: number, lines: number): string {
  return Array.from(
    { length: lines },
    (_, i) => `${qty} Testmon ${String.fromCharCode(65 + i)} OBF ${i + 1}`
  ).join("\n");
}

describe("deckParser", () => {
  it("detecta energías básicas", () => {
    assert.equal(isBasicEnergy("Basic Fire Energy"), true);
    assert.equal(isBasicEnergy("Charmander"), false);
    assert.equal(isEnergyCardName("12 Basic Water Energy"), true);
  });

  it("acepta un mazo válido de 60 cartas", () => {
    const result = parsePokemonDecklist(deckWithQtyPerLine(4, 15));
    assert.equal(result.cardCount, 60);
    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
  });

  it("rechaza mazos con cantidad distinta de 60", () => {
    const result = parsePokemonDecklist(deckWithQtyPerLine(4, 14));
    assert.equal(result.cardCount, 56);
    assert.equal(result.isValid, false);
  });

  it("rechaza más de 4 copias de una carta", () => {
    const result = parsePokemonDecklist(
      `${deckWithQtyPerLine(5, 12)}\n4 Othermon Z OBF 99`
    );
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("máximo permitido es 4")));
  });

  it("toStoredParsedCards omite category y lineRaw", () => {
    const parsed = parsePokemonDecklist("4 Pikachu OBF 25");
    const stored = toStoredParsedCards(parsed.cards);
    assert.deepEqual(stored[0], {
      qty: 4,
      name: "Pikachu",
      setCode: "OBF",
      number: "25",
    });
  });
});

describe("event-status", () => {
  it("normaliza estados legacy", () => {
    assert.equal(normalizeEventStatus("Active"), "open");
    assert.equal(normalizeEventStatus("open"), "open");
    assert.equal(normalizeEventStatus("Draft"), "draft");
    assert.equal(normalizeEventStatus("Finished"), "closed");
    assert.equal(normalizeEventStatus("closed"), "closed");
  });

  it("isEventOpen reconoce valores legacy y canónicos", () => {
    assert.equal(isEventOpen("Active"), true);
    assert.equal(isEventOpen("open"), true);
    assert.equal(isEventOpen("closed"), false);
    assert.equal(isEventOpen("Finished"), false);
  });
});
