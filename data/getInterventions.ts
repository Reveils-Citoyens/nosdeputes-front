import * as React from 'react'
import { Paragraphe } from "@prisma/client";

async function getInterventionsUnCached(debatUid: string): Promise<Paragraphe[]> {
    try {
        const rep = await fetch(
            `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/interventions/?debatRefUid=${debatUid}&perPage=1000`
        );

        const { data } = await rep.json();

        data.sort(
            (a: Paragraphe, b: Paragraphe) =>
                (a.ordreAbsoluSeance ?? 0) - (b.ordreAbsoluSeance ?? 0)
        );

        return data;
    } catch (error) {
        console.error("Error fetching dossier:", error);
        return [];
    }
}

export const getInterventions = React.cache(getInterventionsUnCached);
