"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Button from "@mui/material/Button"; 

import { DossierVotes } from "@/data/getDossierVotes";
import { ScrutinCard } from "./ScrutinCard";

// Dictionnaire enrichi pour traduire les codes techniques
const ACTE_LABELS: Record<string, string> = {
  // 1ère lecture
  "AN1-DEBATS-SEANCE": "1ère lecture - Séance publique (AN)",
  "AN1-DEBATS-DEC": "1ère lecture - Vote solennel (AN)",
  "SN1-DEBATS-SEANCE": "1ère lecture - Séance publique (Sénat)",
  "SN1-DEBATS-DEC": "1ère lecture - Vote solennel (Sénat)",
  
  // 2ème lecture
  "AN2-DEBATS-SEANCE": "2ème lecture - Séance publique (AN)",
  "AN2-DEBATS-DEC": "2ème lecture - Vote solennel (AN)",
  "SN2-DEBATS-SEANCE": "2ème lecture - Séance publique (Sénat)",
  "SN2-DEBATS-DEC": "2ème lecture - Vote solennel (Sénat)",
  
  // CMP et Nouvelle lecture
  "CMP-DEBATS-AN-SEANCE": "Commission Mixte Paritaire (AN)",
  "CMP-DEBATS-AN-DEC": "Vote sur la CMP (AN)",
  "ANNLEC-DEBATS-SEANCE": "Nouvelle lecture (AN)",
  "ANNLEC-DEBATS-DEC": "Vote nouvelle lecture (AN)",

  // Lecture définitive
  "ANLDEF-DEBATS-SEANCE": "Lecture définitive - Séance (AN)",
  "ANLDEF-DEBATS-DEC": "Lecture définitive - Vote final",

  // Lecture unique (résolutions, motions, etc.)
  "ANLUNI-DEBATS-SEANCE": "Lecture unique - Séance publique (AN)",
  "ANLUNI-DEBATS-DEC": "Lecture unique - Vote (AN)",
  "ANLUNI-COM": "Lecture unique - Commission (AN)",

  // Motions
  "MOTION-CENSURE": "Motion de censure",
  "MOTION-REFERENDAIRE": "Motion référendaire"
};

function formatActeLabel(code: string, nomCanonique?: string | null) {
  if (ACTE_LABELS[code]) return ACTE_LABELS[code];
  
  if (nomCanonique && nomCanonique !== "Décision" && nomCanonique !== "Vote") {
     return nomCanonique;
  }
  
  if (code.includes("ANLDEF")) return "Lecture définitive";
  if (code.includes("ANLUNI")) return "Lecture unique (AN)";
  if (code.includes("CMP")) return "Commission Mixte Paritaire";
  if (code.includes("AN1")) return "1ère lecture (AN)";
  if (code.includes("SN1")) return "1ère lecture (Sénat)";
  
  return code;
}

export function VotesView({ dossier }: { dossier: DossierVotes }) {
  const actsWithVotes = React.useMemo(() => {
    return (
      dossier.actesLegislatifs
        ?.filter((acte) => acte.voteRefs && acte.voteRefs.length > 0)
        .sort((a, b) => {
             const dateA = a.dateActe ? new Date(a.dateActe).getTime() : 0;
             const dateB = b.dateActe ? new Date(b.dateActe).getTime() : 0;
             // Tri décroissant (le plus récent en haut)
             return dateB - dateA;
        }) ?? []
    );
  }, [dossier]);

  const [selectedActeUid, setSelectedActeUid] = React.useState<string>(
    actsWithVotes[0]?.uid ?? ""
  );

  const currentActe = actsWithVotes.find((a) => a.uid === selectedActeUid);
  const acteIndex = actsWithVotes.findIndex(a => a.uid === selectedActeUid);

  if (actsWithVotes.length === 0) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="info" variant="outlined">
          Aucun scrutin public n&apos;a été enregistré pour ce dossier législatif.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ my: 3, gap: 2 }}>
        <Select
          value={selectedActeUid}
          onChange={(event) => setSelectedActeUid(event.target.value)}
          size="small"
          sx={{ 
            minWidth: 300, 
            bgcolor: 'white',
            fontWeight: 600
          }}
        >
          {actsWithVotes.map((act) => (
            <MenuItem key={act.uid} value={act.uid}>
              {formatActeLabel(act.codeActe, act.nomCanonique)}
            </MenuItem>
          ))}
        </Select>
        
        <Stack direction="row" spacing={1}>
           <Button
            variant="outlined"
            size="small"
            onClick={() => setSelectedActeUid(actsWithVotes[acteIndex + 1]?.uid)}
            disabled={acteIndex >= actsWithVotes.length - 1}
          >
            Précédent
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setSelectedActeUid(actsWithVotes[acteIndex - 1]?.uid)}
            disabled={acteIndex <= 0}
          >
            Suivant
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={3} sx={{ mt: 3 }}>
        {currentActe?.voteRefs.map((ref) => {
          const scrutin = ref.voteRef;
          if (!scrutin) return null;
          
          return (
            <ScrutinCard 
              key={scrutin.uid} 
              scrutin={scrutin} 
            />
          );
        })}
      </Stack>
    </Box>
  );
}