"use client";
import React from "react";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import { searchDocument } from "@/data/searchDocument";
import LinearProgress from "@mui/material/LinearProgress";
import { searchDossier } from "@/data/searchDossier";

export default function Travaux() {
  const { slug } = useParams<{ slug: string }>();

  const { data: acteur, isPending: acteurIsPending } = useQuery({
    queryKey: ["acteur", slug],

    queryFn: async () => {
      const data = await getActeurBySlug(slug);
      return data;
    },
  });

  const { data: documentsResult, isPending } = useQuery({
    queryKey: ["documents", acteur?.uid],

    queryFn: async () => {
      if (!acteur?.uid) {
        return null;
      }
      const result = await searchDocument({
        perPage: 100,
        auteurPrincipalUid: acteur.uid,
      });
      return result;
    },
  });

  const documents = documentsResult?.data ?? [];

  const { data: dossiersResult, isPending: dossierIsPending } = useQuery({
    queryKey: ["dossiers", acteur?.uid],

    queryFn: async () => {
      if (!acteur?.uid) {
        return null;
      }
      const result = await searchDossier({
        perPage: 100,
        acteurPrincipalRefUid: acteur.uid,
      });
      return result;
    },
  });

  const dossiers = dossiersResult?.data ?? [];

  if (acteurIsPending || isPending) {
    return <LinearProgress />;
  }

  const propositionDeLoi = documents?.filter(
    (doc) => doc.classeCode === "PIONLOI"
  );
  const rapports = documents?.filter(
    (doc) => doc.classeCode === "RAPPORT" || doc.classeCode === "RAPINF"
  );
  const resolutions = documents?.filter((doc) => doc.classeCode === "RES");

  return (
    <Stack>
      <Typography variant="subtitle1" component="h2" fontWeight={"bold"}>Travaux législatifs</Typography>
      <Typography variant="h4" fontWeight="medium" sx={{ mb: 1, mt: 2 }}>
        Propositions de loi
      </Typography>
      {!propositionDeLoi || propositionDeLoi.length === 0 ? (
        <Typography variant="body2">
          Aucune proposition de loi trouvée.
        </Typography>
      ) : (
        <ul>
          {propositionDeLoi?.map((docs) => (
            <li
              key={docs.uid}
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Typography variant="body2">
                {docs.titrePrincipalCourt}
              </Typography>
              <Typography variant="body2" key={docs.uid} fontWeight="light">
                {docs.dateCreation?.toLocaleDateString()}
              </Typography>
            </li>
          ))}
        </ul>
      )}
      <Typography variant="h4" fontWeight="medium" sx={{ mb: 1, mt: 2 }}>
        Rapports
      </Typography>
      {!rapports || rapports.length === 0 ? (
        <Typography variant="body2">Aucun rapport trouvé.</Typography>
      ) : (
        <ul>
          {rapports.map((docs) => (
            <li
              key={docs.uid}
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Typography
                variant="body2"
                component={docs.pdfUrl ? "a" : "p"}
                href={docs.pdfUrl ?? undefined}
                target="_blank"
              >
                {docs.titrePrincipalCourt}
              </Typography>
              <Typography variant="body2" key={docs.uid} fontWeight="light">
                {docs.dateCreation?.toLocaleDateString()}
              </Typography>
            </li>
          ))}
        </ul>
      )}
      <Typography variant="h4" fontWeight="medium" sx={{ mb: 1, mt: 2 }}>
        Résolutions
      </Typography>
      {!resolutions || resolutions.length === 0 ? (
        <Typography variant="body2">Aucune résolution trouvée.</Typography>
      ) : (
        <ul>
          {resolutions.map((docs) => (
            <li
              key={docs.uid}
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Typography
                variant="body2"
                component={docs.pdfUrl ? "a" : "p"}
                href={docs.pdfUrl ?? undefined}
                target="_blank"
              >
                {docs.titrePrincipalCourt}
              </Typography>
              <Typography variant="body2" key={docs.uid} fontWeight="light">
                {docs.dateCreation?.toLocaleDateString()}
              </Typography>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4" fontWeight="medium" sx={{ mb: 1, mt: 2 }}>
        Dossier législatifs initié
      </Typography>
      {!dossiers || dossiers.length === 0 ? (
        <Typography variant="body2">Aucun dossier trouvé.</Typography>
      ) : (
        <ul>
          {dossiers.map((dossier) => (
            <li
              key={dossier.uid}
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Typography
                variant="body2"
                component={Link}
                href={`/${dossier.legislature}/dossier/${dossier.uid}/`}
              >
                {dossier.titre}
              </Typography>
              {/* TODO: Ajouter le status du dossier legislatif ou la date de derniere modification */}
            </li>
          ))}
        </ul>
      )}
    </Stack>
  );
}
