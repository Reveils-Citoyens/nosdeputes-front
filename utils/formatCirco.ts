type DeptInfo = {
  code: string;
  prep: string; // préposition + article : "de l'", "du ", "de la ", "des ", "de ", "d'"
};

const DEPT_MAP: Record<string, DeptInfo> = {
  // ── Métropole ───────────────────────────────────────────────────────────────
  "Ain":                        { code: "01",  prep: "de l'" },
  "Aisne":                      { code: "02",  prep: "de l'" },
  "Allier":                     { code: "03",  prep: "de l'" },
  "Alpes-de-Haute-Provence":    { code: "04",  prep: "des "  },
  "Hautes-Alpes":               { code: "05",  prep: "des "  },
  "Alpes-Maritimes":            { code: "06",  prep: "des "  },
  "Ardèche":                    { code: "07",  prep: "de l'" },
  "Ardennes":                   { code: "08",  prep: "des "  },
  "Ariège":                     { code: "09",  prep: "de l'" },
  "Aube":                       { code: "10",  prep: "de l'" },
  "Aude":                       { code: "11",  prep: "de l'" },
  "Aveyron":                    { code: "12",  prep: "de l'" },
  "Bouches-du-Rhône":           { code: "13",  prep: "des "  },
  "Calvados":                   { code: "14",  prep: "du "   },
  "Cantal":                     { code: "15",  prep: "du "   },
  "Charente":                   { code: "16",  prep: "de la " },
  "Charente-Maritime":          { code: "17",  prep: "de la " },
  "Cher":                       { code: "18",  prep: "du "   },
  "Corrèze":                    { code: "19",  prep: "de la " },
  "Corse-du-Sud":               { code: "2A",  prep: "de "   },
  "Haute-Corse":                { code: "2B",  prep: "de "   },
  "Côte-d'Or":                  { code: "21",  prep: "de la " },
  "Côtes-d'Armor":              { code: "22",  prep: "des "  },
  "Creuse":                     { code: "23",  prep: "de la " },
  "Dordogne":                   { code: "24",  prep: "de la " },
  "Doubs":                      { code: "25",  prep: "du "   },
  "Drôme":                      { code: "26",  prep: "de la " },
  "Eure":                       { code: "27",  prep: "de l'" },
  "Eure-et-Loir":               { code: "28",  prep: "d'"    },
  "Finistère":                  { code: "29",  prep: "du "   },
  "Gard":                       { code: "30",  prep: "du "   },
  "Haute-Garonne":              { code: "31",  prep: "de la " },
  "Gers":                       { code: "32",  prep: "du "   },
  "Gironde":                    { code: "33",  prep: "de la " },
  "Hérault":                    { code: "34",  prep: "de l'" },
  "Ille-et-Vilaine":            { code: "35",  prep: "d'"    },
  "Indre":                      { code: "36",  prep: "de l'" },
  "Indre-et-Loire":             { code: "37",  prep: "d'"    },
  "Isère":                      { code: "38",  prep: "de l'" },
  "Jura":                       { code: "39",  prep: "du "   },
  "Landes":                     { code: "40",  prep: "des "  },
  "Loir-et-Cher":               { code: "41",  prep: "du "   },
  "Loire":                      { code: "42",  prep: "de la " },
  "Haute-Loire":                { code: "43",  prep: "de la " },
  "Loire-Atlantique":           { code: "44",  prep: "de la " },
  "Loiret":                     { code: "45",  prep: "du "   },
  "Lot":                        { code: "46",  prep: "du "   },
  "Lot-et-Garonne":             { code: "47",  prep: "du "   },
  "Lozère":                     { code: "48",  prep: "de la " },
  "Maine-et-Loire":             { code: "49",  prep: "du "   },
  "Manche":                     { code: "50",  prep: "de la " },
  "Marne":                      { code: "51",  prep: "de la " },
  "Haute-Marne":                { code: "52",  prep: "de la " },
  "Mayenne":                    { code: "53",  prep: "de la " },
  "Meurthe-et-Moselle":         { code: "54",  prep: "de la " },
  "Meuse":                      { code: "55",  prep: "de la " },
  "Morbihan":                   { code: "56",  prep: "du "   },
  "Moselle":                    { code: "57",  prep: "de la " },
  "Nièvre":                     { code: "58",  prep: "de la " },
  "Nord":                       { code: "59",  prep: "du "   },
  "Oise":                       { code: "60",  prep: "de l'" },
  "Orne":                       { code: "61",  prep: "de l'" },
  "Pas-de-Calais":              { code: "62",  prep: "du "   },
  "Puy-de-Dôme":                { code: "63",  prep: "du "   },
  "Pyrénées-Atlantiques":       { code: "64",  prep: "des "  },
  "Hautes-Pyrénées":            { code: "65",  prep: "des "  },
  "Pyrénées-Orientales":        { code: "66",  prep: "des "  },
  "Bas-Rhin":                   { code: "67",  prep: "du "   },
  "Haut-Rhin":                  { code: "68",  prep: "du "   },
  "Rhône":                      { code: "69",  prep: "du "   },
  "Haute-Saône":                { code: "70",  prep: "de la " },
  "Saône-et-Loire":             { code: "71",  prep: "de la " },
  "Sarthe":                     { code: "72",  prep: "de la " },
  "Savoie":                     { code: "73",  prep: "de la " },
  "Haute-Savoie":               { code: "74",  prep: "de la " },
  "Paris":                      { code: "75",  prep: "de "   },
  "Seine-Maritime":             { code: "76",  prep: "de la " },
  "Seine-et-Marne":             { code: "77",  prep: "de la " },
  "Yvelines":                   { code: "78",  prep: "des "  },
  "Deux-Sèvres":                { code: "79",  prep: "des "  },
  "Somme":                      { code: "80",  prep: "de la " },
  "Tarn":                       { code: "81",  prep: "du "   },
  "Tarn-et-Garonne":            { code: "82",  prep: "du "   },
  "Var":                        { code: "83",  prep: "du "   },
  "Vaucluse":                   { code: "84",  prep: "du "   },
  "Vendée":                     { code: "85",  prep: "de la " },
  "Vienne":                     { code: "86",  prep: "de la " },
  "Haute-Vienne":               { code: "87",  prep: "de la " },
  "Vosges":                     { code: "88",  prep: "des "  },
  "Yonne":                      { code: "89",  prep: "de l'" },
  "Territoire de Belfort":      { code: "90",  prep: "du "   },
  "Essonne":                    { code: "91",  prep: "de l'" },
  "Hauts-de-Seine":             { code: "92",  prep: "des "  },
  "Seine-Saint-Denis":          { code: "93",  prep: "de la " },
  "Val-de-Marne":               { code: "94",  prep: "du "   },
  "Val-d'Oise":                 { code: "95",  prep: "du "   },

  // ── Outre-mer (DROM) ────────────────────────────────────────────────────────
  "Guadeloupe":                 { code: "971", prep: "de la " },
  "Martinique":                 { code: "972", prep: "de la " },
  "Guyane":                     { code: "973", prep: "de la " },
  "La Réunion":                 { code: "974", prep: "de "   },
  "Réunion":                    { code: "974", prep: "de la " },
  "Mayotte":                    { code: "976", prep: "de "   },

  // ── Collectivités d'outre-mer ────────────────────────────────────────────────
  "Saint-Pierre-et-Miquelon":   { code: "975", prep: "de "   },
  "Saint-Barthélemy":           { code: "977", prep: "de "   },
  "Saint-Martin":               { code: "978", prep: "de "   },
  "Wallis-et-Futuna":           { code: "986", prep: "de "   },
  "Polynésie française":        { code: "987", prep: "de la " },
  "Nouvelle-Calédonie":         { code: "988", prep: "de "   },

  // ── Français établis hors de France ─────────────────────────────────────────
  "Français établis hors de France": { code: "FE", prep: "des " },
};

export function formatOrdinal(n: number): string {
  return n === 1 ? "1re" : `${n}e`;
}

function lookupDept(departement: string): DeptInfo | null {
  const lower = departement.toLowerCase();
  const key = Object.keys(DEPT_MAP).find((k) => k.toLowerCase() === lower);
  return key ? DEPT_MAP[key] : null;
}

export function formatCirco(
  numCirco: number | null | undefined,
  departement: string | null | undefined,
  numDepartement?: number | null,
): string {
  if (!numCirco) return "";

  const ordinal = formatOrdinal(numCirco);

  if (!departement) return `${ordinal} circ.`;

  const info = lookupDept(departement);

  if (!info) {
    // Fallback : préposition générique, numéro brut si disponible
    const code = numDepartement != null
      ? `(${numDepartement < 10 ? String(numDepartement).padStart(2, "0") : numDepartement})`
      : "";
    return `${ordinal} circ. de ${departement}${code ? " " + code : ""}`;
  }

  const { prep, code } = info;

  // Cas spécial : "des Français établis hors de France" → la prep contient tout
  if (departement.toLowerCase() === "français établis hors de france") {
    return `${ordinal} circ. des Français établis hors de France`;
  }

  return `${ordinal} circ. ${prep}${departement} (${code})`;
}
