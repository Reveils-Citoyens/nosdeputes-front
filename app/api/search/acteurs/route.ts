import { NextRequest, NextResponse } from "next/server";
import { searchActeurParNom } from "@/data/mongo/searchActeurParNom";
import { searchActeurParCodePostalTricoteuses } from "@/data/autocomplet/searchParCodePostal";

const CODE_POSTAL_RE = /^\d{5}$/;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = CODE_POSTAL_RE.test(q)
      ? await searchActeurParCodePostalTricoteuses(q)
      : await searchActeurParNom(q, 5);
    return NextResponse.json(results);
  } catch (err) {
    console.error("searchActeurs error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
