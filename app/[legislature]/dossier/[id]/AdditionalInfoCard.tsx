import * as React from "react";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiLink from "@mui/material/Link";
import InfoIcon from "@/icons/InfoIcon";
import Link from "next/link";
import Signataires from "../../../../components/folders/Signataires";
import { getDocument } from "@/data/getDocument";
import { unique } from "@/utils/unique";

export const AdditionalInfoCard = async (props: {
  documentIds: string[];
  legislature: string;
  dossierUid: string;
  showAmendements?: boolean;
  showCoSignataires?: boolean;
}) => {
  if (!props.showAmendements && !props.showCoSignataires) {
    return null;
  }

  const documents = await Promise.all(
    props.documentIds.map((documentUid) => getDocument(documentUid))
  );

  const validDocuments = documents
    .filter((document) => document != null)
    .filter(
      (document) =>
        (props.showAmendements && document._count.amendements > 0) ||
        (props.showCoSignataires &&
          document.coSignataires &&
          document.coSignataires.length > 0)
    );

  const totalAmendements = validDocuments.reduce(
    (sum, document) => sum + document._count.amendements,
    0
  );

  const coSignataires = unique(
    validDocuments
      .flatMap((document) => [
        // Not sure if document autors should be included.
        ...(document.auteurs?.map((auteur) => auteur.acteurRefUid) ?? []),
        ...(document.coSignataires?.map(
          (coSignataire) => coSignataire.acteurRefUid
        ) ?? []),
      ])
      .filter((acteur) => acteur !== null)
  );

  return (
    <Accordion elevation={0} disableGutters defaultExpanded color="secondary">
      <AccordionSummary
        aria-controls="additional-info-content"
        id="additional-info-header"
      >
        <Typography>Informations complémentaires</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack direction="column" spacing={2}>
          {props.showAmendements && (
            <React.Fragment>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" fontWeight="light">
                  Amendements
                </Typography>
                <InfoIcon sx={{ fontSize: "14px" }} />
              </Stack>
              <Stack direction="column" spacing={1}>
                <MuiLink
                  variant="body2"
                  fontWeight="light"
                  component={Link}
                  href={`/${props.legislature}/dossier/${props.dossierUid}/amendement`}
                >
                  {totalAmendements} amendements
                </MuiLink>
              </Stack>
            </React.Fragment>
          )}

          {props.showCoSignataires && (
            <Signataires signataireUids={coSignataires} limite={3} />
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
