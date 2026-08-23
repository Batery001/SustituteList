import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMongoDuplicateKey, isValidPopId, normalizePopId } from "./pop-id";

describe("pop-id", () => {
  it("trata el mismo Pop ID con guiones o espacios como uno solo", () => {
    assert.equal(normalizePopId("2360326"), "2360326");
    assert.equal(normalizePopId("236-0326"), "2360326");
    assert.equal(normalizePopId(" 236 0326 "), "2360326");
    assert.equal(normalizePopId("236.0326"), "2360326");
  });

  it("rechaza Pop ID demasiado corto o vacío", () => {
    assert.equal(isValidPopId(""), false);
    assert.equal(isValidPopId("12"), false);
    assert.equal(isValidPopId("2360326"), true);
  });

  it("detecta clave duplicada de Mongo también si viene envuelta", () => {
    assert.equal(isMongoDuplicateKey({ code: 11000 }), true);
    assert.equal(isMongoDuplicateKey({ cause: { code: 11000 } }), true);
    assert.equal(isMongoDuplicateKey({ code: 1 }), false);
  });
});
