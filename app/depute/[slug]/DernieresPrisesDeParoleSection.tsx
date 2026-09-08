import * as React from "react";
import { getDernieresPrisesDeParole } from "@/data/getDernieresPrisesDeParole";
import DernieresPrisesDeParole from "./DernieresPrisesDeParole";

export async function DernieresPrisesDeParoleSection({
  acteurUid,
}: {
  acteurUid: string;
}) {
  const prises = await getDernieresPrisesDeParole(acteurUid);

  // Aucune vidéo consultable — député récent, ou séances trop anciennes pour
  // que l'archive du diffuseur les conserve : la section ne s'affiche pas.
  if (prises.length === 0) return null;

  return <DernieresPrisesDeParole prises={prises} />;
}
