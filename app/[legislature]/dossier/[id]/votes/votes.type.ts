import { Acteur, GroupeVotant, Organe, Vote } from "@prisma/client";

export type VoteWithActeur = Vote & {
  acteurRef: null | Pick<Acteur, "uid" | "slug" | "prenom" | "nom" | "urlImage">;
  groupeVotantRef:
    | null
    | (Pick<GroupeVotant, "uid"> & {
        organeRef: null | Pick<Organe, "libelle" | "libelleAbrev" | "couleurAssociee">;
      });
};
