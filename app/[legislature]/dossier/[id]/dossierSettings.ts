export type ApercuVariant = "chronologie" | "document" | "redirect-commission";

type DossierSettings = {
    carteRapporteurs: boolean;
    carteAmendements: boolean;
    carteCoSignataires: boolean;
    carteDocuments: boolean;
    tableDebats: boolean;
    tableAmendements: boolean;
    tableVotes: boolean;
    apercuVariant?: ApercuVariant;
}
export const dossierSettings: Record<string, DossierSettings | undefined> = {
    1: { carteRapporteurs: true, carteAmendements: true, carteCoSignataires: false, carteDocuments: true, tableDebats: true, tableAmendements: true, tableVotes: true, },
    2: { carteRapporteurs: true, carteAmendements: true, carteCoSignataires: true, carteDocuments: true, tableDebats: true, tableAmendements: true, tableVotes: true, },
    3: { carteRapporteurs: true, carteAmendements: true, carteCoSignataires: false, carteDocuments: true, tableDebats: true, tableAmendements: true, tableVotes: true, },
    4: { carteRapporteurs: true, carteAmendements: true, carteCoSignataires: false, carteDocuments: true, tableDebats: true, tableAmendements: true, tableVotes: true, },
    5: { carteRapporteurs: true, carteAmendements: true, carteCoSignataires: true, carteDocuments: true, tableDebats: true, tableAmendements: true, tableVotes: true, },
    6: { carteRapporteurs: true, carteAmendements: true, carteCoSignataires: false, carteDocuments: true, tableDebats: true, tableAmendements: true, tableVotes: true, },
    7: { carteRapporteurs: false, carteAmendements: true, carteCoSignataires: true, carteDocuments: true, tableDebats: true, tableAmendements: true, tableVotes: true, },
    8: { carteRapporteurs: false, carteAmendements: true, carteCoSignataires: true, carteDocuments: true, tableDebats: true, tableAmendements: true, tableVotes: true, apercuVariant: "document" },
    9: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: true, carteDocuments: true, tableDebats: true, tableAmendements: false, tableVotes: true, apercuVariant: "redirect-commission" },
    10: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: true, carteDocuments: true, tableDebats: true, tableAmendements: false, tableVotes: false, apercuVariant: "redirect-commission" },
    12: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: false, carteDocuments: true, tableDebats: true, tableAmendements: false, tableVotes: false, },
    13: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: false, carteDocuments: true, tableDebats: false, tableAmendements: false, tableVotes: true, },
    14: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: false, carteDocuments: true, tableDebats: true, tableAmendements: false, tableVotes: true, },
    15: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: false, carteDocuments: true, tableDebats: true, tableAmendements: false, tableVotes: true, },
    16: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: false, carteDocuments: true, tableDebats: false, tableAmendements: false, tableVotes: false, apercuVariant: "document" },
    17: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: true, carteDocuments: true, tableDebats: true, tableAmendements: false, tableVotes: true, },
    19: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: true, carteDocuments: true, tableDebats: false, tableAmendements: false, tableVotes: false, },
    20: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: false, carteDocuments: true, tableDebats: true, tableAmendements: false, tableVotes: false, },
    21: { carteRapporteurs: true, carteAmendements: true, carteCoSignataires: false, carteDocuments: true, tableDebats: true, tableAmendements: true, tableVotes: true, },
    22: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: true, carteDocuments: true, tableDebats: true, tableAmendements: true, tableVotes: true, apercuVariant: "document" },
    23: { carteRapporteurs: false, carteAmendements: false, carteCoSignataires: true, carteDocuments: true, tableDebats: false, tableAmendements: false, tableVotes: false, },
}
