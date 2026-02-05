import * as React from "react";
import { ActeLegislatif, Dossier, Rapporteur, Agenda, PointOdj } from "@prisma/client";
import { Status } from "@/components/StatusChip";

// Type pour un acte avec agendaRef inclus (renvoyé par l'API avec include)
type ActeWithAgendaRef = ActeLegislatif & {
  agendaRef?: Agenda & { pointsOdj: PointOdj[] } | null;
};

// Type pour un dossier avec actesLegislatifs incluant agendaRef
type DossierWithActes = Dossier & {
  actesLegislatifs: ActeWithAgendaRef[];
};

const statusOrder = ["AN1", "SN1", "AN2", "SN2", "AN3", "SN3", "CMP", "PROM"];

export const statusInfo: Record<string, { label: string; status: Status }> = {
  AN1: { label: "1e lecture AN", status: "review" },
  SN1: { label: "1e lecture SN", status: "review" },
  AN2: { label: "2e lecture AN", status: "review" },
  SN2: { label: "2e lecture SN", status: "review" },
  AN3: { label: "3e lecture AN", status: "review" },
  SN3: { label: "3e lecture SN", status: "review" },
  CMP: { label: "Commission Mixte Paritaire", status: "review" },
  PROM: { label: "Promulguée", status: "validated" },
};

export function getCurrentStatus(acts: ActeLegislatif[]) {
  const codes = acts.map((act) => act.codeActe);

  for (let i = 0; i < statusOrder.length; i += 1) {
    const status = statusOrder[statusOrder.length - 1 - i];
    if (codes.some((code) => code.startsWith(status))) {
      return status;
    }
  }
}

/**
 * Extrait les commissions saisies sur le dossier.
 * @param acts
 * @param type Le type de saisie (FOND ou AVIS)
 * @returns la liste des uid des commissions
 */
export function getCommissionUids(
  acts: ActeLegislatif[],
  type: "FOND" | "AVIS"
) {
  return Array.from(
    new Set(
      acts
        .filter((act) => act.codeActe.endsWith(`COM-${type}`))
        .map((act) => act.organeRefUid)
        .filter((id) => id !== null)
    )
  );
}

/**
 * Filtre les réunions (agendaRef) des actes législatifs d'un dossier qui ont :
 * - Un compte rendu associé (compteRenduRefUid)
 * - Au moins un point d'ordre du jour lié au dossier et non annulé
 * - Pas de doublons (même agenda.uid)
 */
export function getReunionsWithCompteRendu(dossier: DossierWithActes | null) {
  if (!dossier) return [];
  
  const reunions: (Agenda & { pointsOdj: PointOdj[] })[] = [];
  const seenAgendaUids = new Set<string>();

  dossier.actesLegislatifs.forEach((acte) => {
    if (acte.agendaRef && acte.codeActe.includes("SEANCE")) {
      // Skip si cette réunion a déjà été ajoutée
      if (seenAgendaUids.has(acte.agendaRef.uid)) {
        return;
      }

      if (
        acte.agendaRef.compteRenduRefUid &&
        acte.agendaRef.pointsOdj.filter(
          (pt) => pt.dossierLegislatifUid === dossier.uid && pt.etat !== "Annulé"
        ).length > 0
      ) {
        seenAgendaUids.add(acte.agendaRef.uid);
        reunions.push(acte.agendaRef);
      }
    }
  });

  return reunions;
}