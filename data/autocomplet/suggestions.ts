
import type { Acteur } from "@tricoteuses/assemblee"

export interface CollectiviteOutreMer {
    /**
     * Code de la collectivité d'outre-mer
     */
    COMER: string
    /**
     * Type de nom en clair
     */
    TNCC: TypeNomEnClair
    /**
     * Libellé en lettres majuscules sans accents
     */
    NCC: string
    /**
     * Libellé en caractères majuscules, minuscules et accentués.)
     */
    NCCENR: string
    /**
     * Libellé en caractères majuscules, minuscules et accentués avec article
     */
    LIBELLE: string
}

export interface Commune {
    /**
     * Type de commune
     */
    TYPECOM: TypeCommune
    /**
     * Code commune
     */
    COM: string
    /**
     * Code région. Absent pour les communes associées ou déléguées
     */
    REG?: string
    /**
     * Code département. Absent pour les communes associées ou déléguées
     */
    DEP?: string
    /**
     * Code de la collectivité territoriale ayant les compétences départementales. Absent pour les communes associées ou déléguées
     */
    CTCD?: string
    /**
     * Code arrondissement. Absent pour les communes associées ou déléguées
     */
    ARR?: string
    /**
     * Type de nom en clair
     */
    TNCC: TypeNomEnClair
    /**
     * Nom en clair (majuscules)
     */
    NCC: string
    /**
     * Nom en clair (typographie riche)
     */
    NCCENR: string
    /**
     * Nom en clair (typographie riche) avec article
     */
    LIBELLE: string
    /**
     * Code canton. Pour les communes « multi-cantonales » code décliné de 99 à 90 (pseudo-canton) ou de 89 à 80 (communes nouvelles). Absent pour les communes associées ou déléguées
     */
    CAN?: string
    /**
     * Code de la commune parente pour les arrondissements municipaux et les communes associées ou déléguées.
     */
    COMPARENT?: string
}

export interface CommuneCollectiviteOutreMer {
    /**
     * Code du zonage
     */
    COM_COMER: string
    /**
     * Type de nom en clair
     */
    TNCC: TypeNomEnClair
    /**
     * Libellé en lettres majuscules sans accents
     */
    NCC: string
    /**
     * Libellé en caractères majuscules, minuscules et accentués.)
     */
    NCCENR: string
    /**
     * Libellé en caractères majuscules, minuscules et accentués avec article
     */
    LIBELLE: string
    /**
     * Code Nature Zonage
     */
    NATURE_ZONAGE: NatureZonage
    /**
     * Code de la collectivité d’outre-mer
     */
    COMER: string
    /**
     * Libellé de la collectivité d’outre-mer
     */
    LIBELLE_COMER: string
}

export interface Departement {
    /**
     * Code département
     */
    DEP: string
    /**
     * Code région
     */
    REG: string
    /**
     * Code de la commune chef-lieu
     */
    CHEFLIEU: string
    /**
     * Type de nom en clair
     */
    TNCC: TypeNomEnClair
    /**
     * Nom en clair (majuscules)
     */
    NCC: string
    /**
     * Nom en clair (typographie riche)
     */
    NCCENR: string
    /**
     * Nom en clair (typographie riche) avec article
     */
    LIBELLE: string
}

export type NatureZonage =
    | "COM" // Commune
    | "DIS" // District
    | "CIR" // Circonscription territoriale
    | "CPT" // Code à 5 chiffres de Clipperton

export type TypeCommune =
    | "COM" // Commune
    | "COMA" // Commune associée
    | "COMD" // Commune déléguée
    | "ARM" // Arrondissement municipal

export type TypeNomEnClair =
    | 0 // Pas d'article et le nom commence par une consonne sauf H muet ; charnière = DE
    | 1 // Pas d'article et le nom commence par une voyelle ou un H muet ; charnière = D'
    | 2 // Article = LE ; charnière = DU
    | 3 // Article = LA ; charnière = DE LA
    | 4 // Article = LES ; charnière = DES
    | 5 // Article = L' ; charnière = DE L'
    | 6 // Article = AUX ; charnière = DES
    | 7 // Article = LAS ; charnière = DE LAS
    | 8 // Article = LOS ; charnière = DE LOS
























export interface Epci {
    /**
     * Code de l'EPCI
     */
    EPCI: string
    /**
     * Nom en clair (typographie riche)
     */
    LIBEPCI: string
    /**
     * Nature de l'EPCI
     */
    NATURE_EPCI:
    | "CA" // Communauté d'agglomération
    | "CC" // Communauté de communes
    | "CU" // Communauté urbaine
    | "ME" // Métropole
    /**
     * Codes des communes constituant l'EPCI
     */
    COM: string[]
}


export interface DistributionPostale {
    code_commune_insee: string
    nom_de_la_commune: string
    code_postal: string
    libelle_d_acheminement: string
    /**
     * Ligne 5 dans l'écriture de l'adresse, utilisée notamment pour préciser l'ancienne commune ou le lieu-dit
     */
    ligne_5?: string
    coordonnees_geographiques: [number, number] // latitude, longitude
}

export interface CirconscriptionLegislative {
    /**
     * Code de la circonscription (sur 5 caractères)
     * Les 3 premiers caractères sont constitués du code du département
     * (complété par un 0 pour les départements métropolitains) suivi
     * d'un numéro de circonscription de deux chiffres.
     * Dans le cas des circonscriptions contenant des communes nouvelles, il
     * est possible que des communes nouvelles aient été créées en fusionnant
     * des communes de départements différents. Dans ce cas la commune sera
     * rattachée à deux circonscriptions appartenant à deux départements
     * différents. Mais il n'empêche que chaque circonscription reste dans un
     * seul département.
     */
    code: string
    /**
     * Codes des communes de la circonscription
     *
     * Note : Certaines communes nouvelles sont constituées à partir de communes
     * situées dans des départements différents => Ces commune sont rattachées
     * à des circonscriptions situées dans des départements différents.
     *
     * Note : les circonscriptions des Français établis hors de France n'ont pas
     * de communes.
     */
    codes_communes?: string[]
    /**
     * Libellé de la circonscription (typographie riche)
     */
    libelle: string
}


export interface CirconscriptionLegislativeSuggestion extends SuggestionBase {
    circonscription_legislative?: CirconscriptionLegislative
    communes?: Array<Commune | CommuneCollectiviteOutreMer>
    depute?: Acteur
    role?: "commune" | "député" | "distribution postale" | "lieu-dit"
}
export interface CommuneSuggestion extends SuggestionBase {
    commune?: Commune | CommuneCollectiviteOutreMer
    distributions_postales?: Array<DistributionPostale>
    role?: "distribution postale" | "lieu-dit"
}
export interface DepartementSuggestion extends SuggestionBase {
    departement?: CollectiviteOutreMer | Departement
    communes?: Array<Commune | CommuneCollectiviteOutreMer>
    role?: "commune" | "distribution postale" | "lieu-dit"
}
export interface EpciSuggestion extends SuggestionBase {
    epci?: Epci
    communes?: Array<Commune | CommuneCollectiviteOutreMer>
    role?: "commune" | "distribution postale" | "lieu-dit"
}
export interface SuggestionBase {
    autocompletion: string
    code: string
    libelle: string
    // match: …
    score: number
    // terms: string[]
}

export const deputeAutocompletions = async (search: string) => {
    const response = await fetch(
        "https://territoires.code4code.eu/circonscriptions_legislatives/autocomplete?" + (new URLSearchParams([
            ["q", search],
            ["field", "circonscription_legislative"],
            ["field", "depute"],
        ])).toString(),
        { headers: { Accept: "application/json" } }
    );
    const { suggestions } = await response.json();
    return suggestions as CirconscriptionLegislativeSuggestion[];
}