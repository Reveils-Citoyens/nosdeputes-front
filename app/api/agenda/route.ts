import { NextRequest, NextResponse } from "next/server";
import { getAgendaSemaine } from "@/data/getAgendaSemaine";

export async function GET(request: NextRequest) {
  const weekStartParam = request.nextUrl.searchParams.get("weekStart");
  if (!weekStartParam)
    return NextResponse.json({ error: "Missing weekStart" }, { status: 400 });

  const date = new Date(weekStartParam);
  if (isNaN(date.getTime()))
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const reunions = await getAgendaSemaine(date);
  return NextResponse.json(reunions);
}
