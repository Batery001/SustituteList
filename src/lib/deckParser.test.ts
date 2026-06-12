import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  categorizeByName,
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
    assert.equal(isBasicEnergy("Darkness Energy"), true);
    assert.equal(isBasicEnergy("Fire Energy"), true);
    assert.equal(isBasicEnergy("Double Turbo Energy"), false);
    assert.equal(isBasicEnergy("Charmander"), false);
    assert.equal(isEnergyCardName("12 Basic Water Energy"), true);
  });

  it("permite más de 4 copias de energía básica tipo Limitless", () => {
    const deck = [
      ...Array.from(
        { length: 12 },
        (_, i) => `4 Testmon ${String.fromCharCode(65 + i)} OBF ${i + 1}`
      ),
      "11 Darkness Energy HS 121",
      "1 Ultra Ball MEG 131",
    ].join("\n");
    const result = parsePokemonDecklist(deck);
    assert.equal(result.cardCount, 60);
    assert.equal(result.isValid, true);
    assert.ok(
      !result.errors.some((e) => e.includes("Darkness Energy")),
      `no debería fallar por Darkness Energy: ${result.errors.join("; ")}`
    );
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

  it("toStoredParsedCards incluye categoría", () => {
    const parsed = parsePokemonDecklist("4 Pikachu OBF 25");
    const stored = toStoredParsedCards(parsed.cards);
    assert.deepEqual(stored[0], {
      qty: 4,
      name: "Pikachu",
      setCode: "OBF",
      number: "25",
      category: "pokemon",
    });
  });

  it("respeta bloques separados por línea en blanco (Pokémon / Entrenadores / Energías)", () => {
    const deck = `4 Toxel PFL 67
4 Toxtricity PFL 68
3 Munkidori TWM 95
1 Pecharunt ex SFA 39
1 Pecharunt SVP 129
1 Fezandipiti ex SFA 38
1 Brute Bonnet TWM 118
1 Mega Absol ex MEG 86
1 Shaymin DRI 10

4 Lillie's Determination ASC 192
4 Team Rocket's Petrel DRI 176
3 Boss's Orders
4 Poké Pad POR 81
3 Night Stretcher ASC 196
1 Team Rocket's Watchtower ASC 210
2 Team Rocket's Transceiver ASC 209
1 Team Rocket's Factory DRI 173
2 Energy Switch MEG 115
1 Energy Recycler DRI 164
1 Ultra Ball MEG 131
1 Buddy-Buddy Poffin TEF 144
1 Pokégear 3.0 BLK 84
1 Secret Box TWM 163
2 Air Balloon BLK 79
1 Punk Helmet PFL 92

11 Darkness Energy`;

    const result = parsePokemonDecklist(deck);
    assert.equal(result.cardCount, 60);
    assert.equal(result.categories.totals.pokemon, 17);
    assert.equal(result.categories.totals.trainer, 32);
    assert.equal(result.categories.totals.energy, 11);
    assert.ok(
      result.categories.pokemon.every((c) => c.setCode && c.number),
      "pokémon deben tener set"
    );
    assert.ok(
      !result.categories.pokemon.some((c) =>
        /balloon|pad|stretcher|petrel/i.test(c.name)
      ),
      "entrenadores no deben quedar en pokémon"
    );
    const boss = result.categories.trainer.find((c) =>
      c.name.includes("Boss")
    );
    assert.ok(boss && !boss.setCode, "entrenador puede ir sin set");
  });

  it("categoriza entrenadores comunes por nombre", () => {
    assert.equal(categorizeByName("Air Balloon"), "trainer");
    assert.equal(categorizeByName("Poké Pad"), "trainer");
    assert.equal(categorizeByName("Night Stretcher"), "trainer");
    assert.equal(categorizeByName("Lillie's Determination"), "trainer");
    assert.equal(categorizeByName("Team Rocket's Petrel"), "trainer");
    assert.equal(categorizeByName("Energy Switch"), "trainer");
    assert.equal(categorizeByName("Darkness Energy"), "energy");
    assert.equal(categorizeByName("Mega Absol ex"), "pokemon");
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
