import { searchActeurParNom, ActeurSearchResult } from "@/data/mongo/searchActeurParNom";
import { searchDossierParTitre, DossierSearchResult } from "@/data/mongo/searchDossierParTitre";
import { searchQuestion, QuestionSearchResult } from "@/data/mongo/searchQuestion";
import {
  searchAmendementMongo,
  AmendementSearchResult,
} from "@/data/mongo/searchAmendementMongo";

export type SearchAllResults = {
  deputes: ActeurSearchResult[];
  dossiers: DossierSearchResult[];
  dossiersTotal: number;
  amendements: AmendementSearchResult[];
  amendementsTotal: number;
  questions: QuestionSearchResult[];
  questionsTotal: number;
};

const PER_SECTION = 5;

/**
 * Recherche multi-catégories pour la page /recherche.
 * Tout est sourcé depuis MongoDB (Atlas Search pour les dossiers, regex pour
 * les questions, jointures pour les amendements). Plus de dépendance à
 * l'API Tricoteuses pour cette page.
 */
export type SortMode = "relevance" | "date";

export async function searchAll(
  query: string,
  options: { legislature?: string | null; sort?: SortMode | null } = {}
): Promise<SearchAllResults> {
  const q = query.trim();
  if (q.length < 5) {
    return {
      deputes: [],
      dossiers: [],
      amendements: [],
      amendementsTotal: 0,
      questions: [],
      questionsTotal: 0,
    };
  }

  const legislature = options.legislature && options.legislature.trim()
    ? options.legislature.trim()
    : "17";
  const sort: SortMode = options.sort === "date" ? "date" : "relevance";

  const [deputes, dossiersResp, amendementsResp, questionsResp] = await Promise.all([
    searchActeurParNom(q, PER_SECTION),
    searchDossierParTitre(q, { limit: PER_SECTION, legislature, sort }),
    searchAmendementMongo(q, { limit: PER_SECTION, legislature, sort }),
    searchQuestion(q, { limit: PER_SECTION, legislature, sort }),
  ]);

  return {
    deputes,
    dossiers: dossiersResp.items,
    dossiersTotal: dossiersResp.total,
    amendements: amendementsResp.items,
    amendementsTotal: amendementsResp.total,
    questions: questionsResp.items,
    questionsTotal: questionsResp.total,
  };
}
