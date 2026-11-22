import type { Organe, Question } from "@prisma/client";
import { getParlementDb } from "@/lib/mongodb";
import type { PaginatedResponse } from "@/data/pagination";
import { questionDepuisAN } from "./conversionQuestionAN";
import { getOrganesAN } from "./referentielAN";
import { normaliserTexte } from "./rechercheTexte";

/**
 * Questions d'un député (onglet « Questions » de sa page), lues dans notre
 * base plutôt que dans l'API Tricoteuses. Serveur uniquement.
 *
 * Même périmètre et même ordre que l'API (`/questions?acteurRefUid=…`,
 * législature en cours, date de dépôt décroissante). La recherche porte sur le
 * titre, la rubrique et le texte de la question, ainsi que sur le numéro ; pas
 * sur la réponse : celle d'une question au Gouvernement est le compte rendu de
 * l'échange en séance et faisait remonter des questions sans rapport.
 */

export type QuestionActeur = Question & { ministerInteroge: Organe | null };

const LEGISLATURE = "17";

export async function getQuestionsActeurAN(
  acteurUid: string,
  { page = 1, perPage = 10, search = "" }: { page?: number; perPage?: number; search?: string }
): Promise<PaginatedResponse<QuestionActeur>> {
  const db = await getParlementDb();
  const bruts = await db
    .collection("questions")
    .find(
      { "auteur.identite.acteurRef": acteurUid, "identifiant.legislature": LEGISLATURE },
      { projection: { _id: 0 } }
    )
    .toArray();

  let questions = bruts
    .map((brut) => questionDepuisAN(brut as unknown as Parameters<typeof questionDepuisAN>[0]))
    .sort(
      (a, b) =>
        String(b.dateDepot ?? "").localeCompare(String(a.dateDepot ?? "")) ||
        Number(b.numero) - Number(a.numero)
    );

  const recherche = normaliserTexte(search).trim();
  if (recherche) {
    questions = questions.filter(
      (q) =>
        q.numero === recherche ||
        [q.titre, q.rubrique, q.texteQuestion].some((champ) => normaliserTexte(champ).includes(recherche))
    );
  }

  const total = questions.length;
  const pageCourante = questions.slice((page - 1) * perPage, page * perPage);
  const ministeres = await getOrganesAN(
    pageCourante.map((q) => q.minIntRefUid).filter((u): u is string => !!u)
  );
  return {
    data: pageCourante.map((q) => ({
      ...q,
      ministerInteroge: q.minIntRefUid ? ministeres.get(q.minIntRefUid) ?? null : null,
    })),
    pagination: { total, totalPage: Math.ceil(total / perPage), perPage, currentPage: page },
  };
}
