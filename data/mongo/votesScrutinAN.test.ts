import { describe, expect, it } from "vitest";
import { votesDepuisAN } from "./votesScrutinAN";

describe("votesDepuisAN", () => {
  it("restitue chaque vote nominatif avec son groupe, au format de l'API", () => {
    const scrutin = {
      uid: "VTANR5L17V8738",
      dateScrutin: "2026-10-15",
      typeVote: { codeTypeVote: "SPO" },
      ventilationVotes: {
        organe: {
          groupes: {
            groupe: {
              organeRef: "PO845401",
              vote: {
                decompteNominatif: {
                  pours: { votant: { acteurRef: "PA720668", mandatRef: "PM840342", parDelegation: "true" } },
                  contres: null,
                  abstentions: null,
                  nonVotants: { votant: [{ acteurRef: "PA1", mandatRef: "PM1", causePositionVote: "PAN" }] },
                },
              },
            },
          },
        },
      },
    };
    const votes = votesDepuisAN(
      scrutin,
      new Map([["PA720668", { prenom: "Emmanuel", nom: "Blairy" }]]),
      new Map([["PO845401", { libelle: "Rassemblement National", libelleAbrev: "RN", couleurAssociee: "#5C6BC0" }]])
    );
    expect(votes).toHaveLength(2);
    expect(votes[0]).toMatchObject({
      uid: "V-VTANR5L17V8738-PA720668",
      positionVote: "pour",
      parDelegation: true,
      groupeVotantRefId: "GV-VTANR5L17V8738-PO845401",
      dateVote: "2026-10-15T00:00:00.000Z",
      codeTypeVote: "SPO",
      acteurRef: { uid: "PA720668", slug: "emmanuel-blairy", prenom: "Emmanuel", nom: "Blairy" },
      groupeVotantRef: { uid: "GV-VTANR5L17V8738-PO845401", organeRef: { libelleAbrev: "RN", couleurAssociee: "#5C6BC0" } },
    });
    expect(votes[1]).toMatchObject({ positionVote: "nonVotant", causePositionVote: "PAN", parDelegation: null, acteurRef: null });
  });
});
