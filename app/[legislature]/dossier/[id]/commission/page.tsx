import { redirect } from "next/navigation";
import { getDebats } from "@/data/getDebats";

export default async function Page({
  params,
}: {
  params: Promise<{ legislature: string; id: string }>;
}) {
  const { legislature, id } = await params;
  const debats = await getDebats(id);
  const firstCommissionDebate = debats?.find(
    (debat) =>
      debat.debateType === "commission" && debat._count.paragraphes > 0
  );

  if (firstCommissionDebate) {
    redirect(
      `/${legislature}/dossier/${id}/commission/${firstCommissionDebate.uid}`
    );
  }

  return null;
}
