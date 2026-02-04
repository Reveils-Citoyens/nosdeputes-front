import * as React from 'react'
import { Paragraphe } from "@prisma/client";

async function getInterventionsUnCached(debatUid: string, ordrePoint?: string): Promise<Paragraphe[]> {
    try {
        const params = new URLSearchParams({
            debatRefUid: debatUid,
            perPage: '1000',
            sort: 'ordreAbsoluSeance.asc',
        });
        if (ordrePoint) {
            params.set('valeurPtsOdj', ordrePoint);
        }
        console.log(`${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/interventions/?${params.toString()}`)
        const rep = await fetch(
            `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/interventions/?${params.toString()}`
        );

        const { data } = await rep.json();

        data.sort(
            (a: Paragraphe, b: Paragraphe) =>
                (a.ordreAbsoluSeance ?? 0) - (b.ordreAbsoluSeance ?? 0)
        );

        return data;
    } catch (error) {
        console.error("Error fetching interventions:", error);
        return [];
    }
}

export const getInterventions = React.cache(getInterventionsUnCached);
