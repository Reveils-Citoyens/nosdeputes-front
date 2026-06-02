import { NextResponse } from "next/server";
import { isThemeSlug } from "@/data/themes";
import { isThemeGroupSlug } from "@/data/themeGroups";
import { getDossiersByTheme } from "@/data/mongo/getDossiersByTheme";
import { getDossiersByThemeGroup } from "@/data/mongo/getDossiersByThemeGroup";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const groupId = searchParams.get("groupId");
  const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));

  if (slug) {
    if (!isThemeSlug(slug))
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    const result = await getDossiersByTheme(slug, { skip, limit });
    return NextResponse.json(result);
  }

  if (groupId) {
    if (!isThemeGroupSlug(groupId))
      return NextResponse.json({ error: "Invalid groupId" }, { status: 400 });
    const result = await getDossiersByThemeGroup(groupId, { skip, limit });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Missing slug or groupId" }, { status: 400 });
}
