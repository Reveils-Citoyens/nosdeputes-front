import { searchActeurParNom, ActeurSearchResult } from "@/data/mongo/searchActeurParNom";
import { searchDossierParTitre, DossierSearchResult } from "@/data/mongo/searchDossierParTitre";
import { searchQuestion, QuestionSearchResult } from "@/data/mongo/searchQuestion";
import {
  searchAmendementMongo,
  AmendementSearchResult,
} from "@/data/mongo/searchAmendementMongo";
import { searchInterventions, DebatSearchResult } from "@/data/searchInterventions";

export type SearchAllResults = {
  deputes: ActeurSearchResult[];
  dossiers: DossierSearchResult[];
  dossiersTotal: number;
  amendements: AmendementSearchResult[];
  amendementsTotal: number;
  questions: QuestionSearchResult[];
  questionsTotal: number;
  debats: DebatSearchResult[];
  debatsTotal: number;
};

const PER_SECTION = 5;

/**
 * Recherche multi-catégories pour la page /recherche.
 * Les débats restent sourcés depuis Tricoteuses ; les autres catégories
 * utilisent MongoDB. Chaque promesse peut être rendue indépendamment.
 */
export type SortMode = "relevance" | "date";

export function searchAllSections(
  query: string,
  options: { legislature?: string | null; sort?: SortMode | null } = {}
) {
  const q = query.trim();
  if (q.length < 5) {
    return {
      deputes: Promise.resolve([] as ActeurSearchResult[]),
      dossiers: Promise.resolve({ items: [] as DossierSearchResult[], total: 0 }),
      amendements: Promise.resolve({ items: [] as AmendementSearchResult[], total: 0 }),
      questions: Promise.resolve({ items: [] as QuestionSearchResult[], total: 0 }),
      debats: Promise.resolve({ items: [] as DebatSearchResult[], total: 0 }),
    };
  }

  const legislature = options.legislature && options.legislature.trim()
    ? options.legislature.trim()
    : "17";
  const sort: SortMode = options.sort === "date" ? "date" : "relevance";

  return {
    deputes: searchActeurParNom(q, PER_SECTION),
    dossiers: searchDossierParTitre(q, { limit: PER_SECTION, legislature, sort }),
    amendements: searchAmendementMongo(q, { limit: PER_SECTION, legislature, sort }),
    questions: searchQuestion(q, { limit: PER_SECTION, legislature, sort }),
    debats: searchInterventions(q, { perPage: PER_SECTION }),
  };
}

export type SearchSections = ReturnType<typeof searchAllSections>;

export async function searchAll(
  query: string,
  options: { legislature?: string | null; sort?: SortMode | null } = {}
): Promise<SearchAllResults> {
  const sections = searchAllSections(query, options);
  const [deputes, dossiersResp, amendementsResp, questionsResp, debatsResp] =
    await Promise.all([
      sections.deputes, sections.dossiers, sections.amendements,
      sections.questions, sections.debats,
    ]);

  return {
    deputes,
    dossiers: dossiersResp.items,
    dossiersTotal: dossiersResp.total,
    amendements: amendementsResp.items,
    amendementsTotal: amendementsResp.total,
    questions: questionsResp.items,
    questionsTotal: questionsResp.total,
    debats: debatsResp.items,
    debatsTotal: debatsResp.total,
  };
}
