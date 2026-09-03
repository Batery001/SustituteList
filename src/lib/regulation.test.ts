import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkRegulationMarks,
  normalizeRegulationMarks,
  regulationMarkForSet,
} from "./regulation";

describe("regulation", () => {
  it("marca OBF como G y rechaza si el torneo no admite G", () => {
    assert.equal(regulationMarkForSet("OBF"), "G");
    const { errors } = checkRegulationMarks(
      [
        {
          qty: 4,
          name: "Charmander",
          setCode: "OBF",
          number: "4",
          lineRaw: "4 Charmander OBF 4",
          category: "pokemon",
        },
      ],
      ["H", "I"]
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /regulación G/);
  });

  it("acepta cartas de la marca permitida", () => {
    const { errors } = checkRegulationMarks(
      [
        {
          qty: 4,
          name: "Testmon",
          setCode: "PFL",
          number: "1",
          lineRaw: "4 Testmon PFL 1",
          category: "pokemon",
          regulationMark: "I",
        },
      ],
      ["H", "I", "J"]
    );
    assert.equal(errors.length, 0);
  });

  it("normaliza marcas vacías al default", () => {
    const marks = normalizeRegulationMarks([]);
    assert.ok(marks.includes("H"));
  });
});
