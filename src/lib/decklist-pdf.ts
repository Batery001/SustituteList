import { jsPDF } from "jspdf";
import { formatDivision, type Division } from "@/lib/division";
import {
  groupParsedCardsByName,
  parsePokemonDecklist,
  type ParsedDeckCard,
} from "@/lib/deckParser";

export interface DecklistPdfCard {
  qty: number;
  name: string;
  setCode?: string;
  number?: string;
}

export interface DecklistPdfData {
  eventName: string;
  playerName: string;
  popId: string;
  division: Division | string;
  cards: DecklistPdfCard[];
  rawText?: string;
  cardCount: number;
  updatedAt?: Date | string;
}

const MARGIN = 14;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

function slugifyFilename(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export function decklistPdfFilename(data: DecklistPdfData): string {
  return `decklist_${slugifyFilename(data.popId)}_${slugifyFilename(data.eventName)}.pdf`;
}

function formatDivisionLabel(division: Division | string): string {
  if (division === "junior" || division === "senior" || division === "master") {
    return formatDivision(division);
  }
  return division;
}

function resolveCategories(data: DecklistPdfData) {
  if (data.rawText?.trim()) {
    const parsed = parsePokemonDecklist(data.rawText);
    if (parsed.cards.length > 0) {
      return parsed.categories;
    }
  }

  const synthetic = data.cards
    .map((c) =>
      c.setCode
        ? `${c.qty} ${c.name} ${c.setCode} ${c.number ?? ""}`.trim()
        : `${c.qty} ${c.name}`
    )
    .join("\n");

  const parsed = parsePokemonDecklist(synthetic);
  if (parsed.cards.length > 0) {
    return parsed.categories;
  }

  const fallback: ParsedDeckCard[] = data.cards.map((c) => ({
    ...c,
    lineRaw: "",
    category: "pokemon" as const,
  }));

  const total = fallback.reduce((s, c) => s + c.qty, 0);
  return {
    pokemon: fallback,
    trainer: [] as ParsedDeckCard[],
    energy: [] as ParsedDeckCard[],
    totals: { pokemon: total, trainer: 0, energy: 0 },
  };
}

function cardLineText(card: ParsedDeckCard): string {
  const setPart =
    card.setCode && card.number
      ? `${card.setCode} ${card.number}`
      : card.setCode ?? "";
  return setPart ? `${card.name}  ·  ${setPart}` : card.name;
}

export function generateDecklistPdf(data: DecklistPdfData): ArrayBuffer {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const categories = resolveCategories(data);
  let y = MARGIN;

  function ensureSpace(height: number) {
    if (y + height > 287) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function line(text: string, size = 10, style: "normal" | "bold" = "normal") {
    ensureSpace(size * 0.45 + 2);
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
    for (const ln of lines) {
      ensureSpace(5);
      doc.text(ln, MARGIN, y);
      y += 5;
    }
  }

  function gap(mm = 3) {
    y += mm;
  }

  doc.setFillColor(14, 22, 36);
  doc.rect(0, 0, PAGE_W, 32, "F");
  doc.setTextColor(125, 211, 252);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Substitute List · Deck Check", MARGIN, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(186, 230, 253);
  doc.text("Pokémon TCG · Standard", MARGIN, 18);
  doc.text(
    new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),
    MARGIN,
    24
  );

  y = 40;

  line(data.eventName, 12, "bold");
  gap(1);
  line(`Jugador: ${data.playerName}`, 10);
  line(`Pop ID: ${data.popId}`, 10);
  line(`División: ${formatDivisionLabel(data.division)}`, 10);
  line(`Cartas: ${data.cardCount}/60`, 10, "bold");

  if (data.updatedAt) {
    line(
      `Actualizado: ${new Intl.DateTimeFormat("es-CL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(data.updatedAt))}`,
      9
    );
  }

  gap(4);
  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  gap(5);

  function renderSection(title: string, cards: ParsedDeckCard[], total: number) {
    if (cards.length === 0) return;

    const grouped = groupParsedCardsByName(cards);
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(14, 116, 144);
    doc.text(`${title.toUpperCase()} (${total})`, MARGIN, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);

    for (const card of grouped) {
      ensureSpace(6);
      doc.setFont("helvetica", "bold");
      doc.text(String(card.qty), MARGIN, y);
      doc.setFont("helvetica", "normal");
      const text = cardLineText(card);
      const wrapped = doc.splitTextToSize(text, CONTENT_W - 12) as string[];
      doc.text(wrapped[0] ?? text, MARGIN + 10, y);
      if (wrapped.length > 1) {
        for (let i = 1; i < wrapped.length; i++) {
          y += 5;
          ensureSpace(5);
          doc.text(wrapped[i], MARGIN + 10, y);
        }
      }
      y += 5;
    }

    gap(4);
  }

  renderSection("Pokémon", categories.pokemon, categories.totals.pokemon);
  renderSection("Entrenadores", categories.trainer, categories.totals.trainer);
  renderSection("Energías", categories.energy, categories.totals.energy);

  gap(2);
  ensureSpace(8);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Documento generado por Substitute List. Verifique Pop ID y división en mesa.",
    MARGIN,
    y
  );

  return doc.output("arraybuffer");
}

export function generateDecklistPdfBuffer(data: DecklistPdfData): Buffer {
  return Buffer.from(generateDecklistPdf(data));
}
