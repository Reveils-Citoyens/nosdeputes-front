import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  if (!/^AMANR\d+L\d+[A-Z0-9]+$/.test(uid)) {
    return NextResponse.json({ error: "Invalid amendment UID" }, { status: 400 });
  }
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/amendements/${uid}?select=uid,dispositif,exposeSommaire`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) throw new Error("Upstream unavailable");
    const { data } = await response.json();
    if (!data || data.uid !== uid) throw new Error("Invalid amendment response");
    return NextResponse.json({ dispositif: data.dispositif ?? null, exposeSommaire: data.exposeSommaire ?? null },
      { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Amendment unavailable" }, { status: 502 });
  }
}
