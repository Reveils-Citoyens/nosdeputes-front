import { NextResponse } from "next/server";
import { getCComptesParTheme } from "@/data/mongo/getCComptesParTheme";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const themes = searchParams.getAll("themes");
  const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10));
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "5", 10)));

  if (themes.length === 0)
    return NextResponse.json({ error: "Missing themes" }, { status: 400 });

  const result = await getCComptesParTheme(themes, limit, skip);
  return NextResponse.json(result);
}
