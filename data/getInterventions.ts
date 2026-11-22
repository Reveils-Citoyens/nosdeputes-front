import * as React from 'react'
import { Paragraphe } from "@prisma/client";
import { DELAI_TRICOTEUSES_LISTE_MS, fetchTricoteuses } from "@/lib/fetchTricoteuses";

/**
 * Paragraphes d'un compte rendu, ou `null` s'ils n'ont pas pu être lus (API
 * indisponible) : la page le dit, plutôt que d'afficher « aucun débat ».
 */
async function getInterventionsUnCached(debatUid: string): Promise<Paragraphe[] | null> {
    // Notre base d'abord (cf. data/mongo/interventionsAN.ts) ; l'API reste le
    // repli pour les transcriptions provisoires, que nous n'importons pas.
    // L'import reste DANS ce bloc : il est ainsi retiré du code du navigateur.
    if (typeof window === "undefined") {
        const { getInterventionsAN } = await import("./mongo/interventionsAN");
        const depuisBase = await getInterventionsAN(debatUid);
        if (depuisBase) return depuisBase;
    }
    try {
        // Transcription provisoire : son texte, contenu même de la page, n'existe
        // que chez Tricoteuses. Délai long (le couper à 8 s affichait une page
        // vide pendant une lenteur passagère) et cache de 5 minutes.
        const rep = await fetchTricoteuses(
            `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/interventions/?debatRefUid=${debatUid}&perPage=1000`,
            { next: { revalidate: 300 } },
            DELAI_TRICOTEUSES_LISTE_MS
        );

        // API indisponible (503 en HTML) : rien à lire.
        if (!rep.ok) return null;
        const { data } = await rep.json();

        data.sort(
            (a: Paragraphe, b: Paragraphe) =>
                (a.ordreAbsoluSeance ?? 0) - (b.ordreAbsoluSeance ?? 0)
        );

        return data;
    } catch (error) {
        console.warn("getInterventions: API indisponible", debatUid, error);
        return null;
    }
}

export const getInterventions = React.cache(getInterventionsUnCached);
