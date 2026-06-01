import { NextResponse } from "next/server";
import { parseDecklist } from "@/lib/decklist-parser";

export async function POST(request: Request) {
  const { rawText } = (await request.json()) as { rawText?: string };
  const result = parseDecklist(rawText ?? "");
  return NextResponse.json(result);
}
