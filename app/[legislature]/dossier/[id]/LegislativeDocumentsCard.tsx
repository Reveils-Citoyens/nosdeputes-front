import * as React from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

import LinkIcon from "@/icons/LinkIcon";

import Link from "next/link";

import { getDocument } from "@/data/getDocument";

interface LegislativeDocumentsCardProps {
  documentIds: string[];
}
export const LegislativeDocumentsCard = async (
  props: LegislativeDocumentsCardProps
) => {
  const documents = await Promise.all(
    props.documentIds.map((documentUid) => getDocument(documentUid))
  );

  return (
    <Accordion elevation={0} disableGutters defaultExpanded sx={{ bgcolor: "grey.100", borderRadius: "16px", "&.MuiAccordion-root": { borderRadius: "16px" }, "&.Mui-expanded": {borderRadius: "16px", margin: 0 }, "& .MuiAccordionSummary-root": {borderRadius: "16px" } }}>
      <AccordionSummary
        aria-controls="additional-info-content"
        id="additional-info-header"
        sx={{ minHeight: 48, '& .MuiAccordionSummary-content': {my: 1}}}>
        <Typography variant="subtitle1" fontWeight={"bold"}>Documents législatifs</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
        <Stack direction="column" spacing={2}>
          {Object.values(documents).map((document) => {
            if (!document) {
              return null;
            }

            return (
              <Stack
                key={document.uid}
                direction="row"
                spacing={1}
                alignItems="flex-start"
              >
              <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    height: "25px",
                    flexShrink: 0
                  }}
                >
                <Box
                  component="img"
                  src="/documents.png"
                  alt="Icone document"
                  sx={{ 
                    width: 18, 
                    height: 18, 
                  }}
                />
                </Box>
                <Typography
                  variant="body2"
                  fontWeight="medium"
                  href={document.pdfUrl ?? undefined}
                  component={document.pdfUrl ? Link : "p"}
                  target="_blank"
                  sx={{ 
                    textDecoration: "none", 
                    color: "inherit",
                    lineHeight: 1.5
                  }}
                >
                  {document.titrePrincipalCourt}
                  {document.chambre ? ` (${document.chambre})` : "  "}
                  {document.pdfUrl && (
                    <LinkIcon sx={{ ml: 1, fontSize: "14px" }} />
                  )}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
