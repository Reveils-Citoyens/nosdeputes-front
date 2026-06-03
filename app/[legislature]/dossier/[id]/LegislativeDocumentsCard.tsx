import * as React from "react";
import Image from "next/image";

import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

import Link from "next/link";

import { getDocument } from "@/data/getDocument";

interface LegislativeDocumentsCardProps {
  documentIds: string[];
}
export const LegislativeDocumentsCard = async (
  props: LegislativeDocumentsCardProps
) => {
  let documents = await Promise.all(
    props.documentIds.map((documentUid) => getDocument(documentUid))
  );
  documents = documents.filter((doc) => doc?.pdfUrl);

  const docsList = Object.values(documents).filter(Boolean) as any[];

  const formatDate = (date?: string | Date | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : (date as Date);
    return d.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" });
  };

  const chambreLabel = (chambre?: string | null) => {
    if (chambre === "AN") return "Assemblée nationale";
    if (chambre === "SN") return "Sénat";
    return chambre ?? "";
  };

  // Group documents by typeLibelle
  const grouped = docsList.reduce((acc: Record<string, any[]>, document) => {
    const key = document.typeLibelle ?? "Autre";
    if (!acc[key]) acc[key] = [];
    acc[key].push(document);
    return acc;
  }, {});

  // Sort groups by first document's dateCreation (chronological order)
  const sortedGroups = Object.entries(grouped).sort(([, docsA], [, docsB]) => {
    const dateA = docsA[0]?.dateCreation;
    const dateB = docsB[0]?.dateCreation;
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    const timeA = typeof dateA === "string" ? new Date(dateA).getTime() : (dateA as Date).getTime();
    const timeB = typeof dateB === "string" ? new Date(dateB).getTime() : (dateB as Date).getTime();
    return timeA - timeB;
  });

  return (
    <Accordion
      elevation={0}
      disableGutters
      defaultExpanded
      sx={{
        bgcolor: "grey.100",
        borderRadius: "16px",
        "&.MuiAccordion-root": { borderRadius: "16px" },
        "&.Mui-expanded": { borderRadius: "16px", margin: 0 },
        "& .MuiAccordionSummary-root": { borderRadius: "16px" },
      }}
    >
      <AccordionSummary
        aria-controls="additional-info-content"
        id="additional-info-header"
        sx={{ minHeight: 48, "& .MuiAccordionSummary-content": { my: 1 } }}
      >
        <Typography variant="subtitle1" fontWeight={"bold"}>
          Documents législatifs
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
        <Stack direction="column" spacing={2}>
          {sortedGroups.map(([typeLibelle, docs]) => {
            // Chambre commune au groupe ? Si oui, on l'affiche une seule fois
            // (sous-titre) et les lignes ne montrent que la date — sinon on garde
            // la chambre par ligne (cas navette AN ↔ Sénat).
            const chambres = Array.from(
              new Set(docs.map((d) => d.chambre).filter(Boolean))
            );
            const groupChamber = chambres.length === 1 ? chambres[0] : null;
            // Les textes de loi sont des versions successives → on l'explicite.
            const isLoi = /loi/i.test(typeLibelle);

            return (
            <Stack key={typeLibelle} direction="column" spacing={1}>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {typeLibelle}
                </Typography>
                {groupChamber && (
                  <Typography variant="caption" color="text.secondary">
                    {chambreLabel(groupChamber)}
                  </Typography>
                )}
              </Box>
              {docs.map((document) => (
                <Stack key={document.uid} direction="row" spacing={1} alignItems="flex-start">
                  {document.pdfUrl && (
                    <Box sx={{ display: "flex", alignItems: "center", height: "25px", flexShrink: 0 }}>
                      <Image src="/documents.png" alt="Icone document" width={18} height={18} />
                    </Box>
                  )}
                  <Typography variant="body2" fontWeight="medium" href={document.pdfUrl ?? undefined} component={document.pdfUrl ? Link : "p"} target="_blank">
                    {/* Chambre par ligne uniquement si le groupe mélange les chambres */}
                    {!groupChamber && document.chambre ? chambreLabel(document.chambre) : ""}
                    {!groupChamber && document.dateCreation && document.chambre ? ` — ` : ""}
                    {document.dateCreation
                      ? isLoi
                        ? `Version du ${formatDate(document.dateCreation)}`
                        : formatDate(document.dateCreation)
                      : ""}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            );
          })}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
