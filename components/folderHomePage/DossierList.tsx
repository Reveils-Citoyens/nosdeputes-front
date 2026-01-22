"use client";

import * as React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useQueryState } from "nuqs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import Pagination from "../Pagination";
import DossierCard from "@/components/home/Dossiers/DossierCard";
import { searchDossier } from "@/data/searchDossier";
import { getCurrentStatus, statusInfo } from "@/app/[legislature]/dossier/[id]/dataFunctions";
import { TYPES_DE_DOSSIERS } from "@/components/const";

export default function DossierList() {
  const [theme] = useQueryState("theme");
  const [search] = useQueryState("search");
  const [codeProcedure] = useQueryState("codeProcedure");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => { setPage(1); }, [search, theme, codeProcedure]);

  const { data: result, isPending, isError } = useQuery({
    queryKey: ["dossiers_server_search", page, search, theme, codeProcedure],
    queryFn: async () => {
      const response = await searchDossier({
        page: page,
        perPage: 20,
        search: search ?? "",
        codeProcedure: codeProcedure ?? "",
        include: "actesLegislatifs", 
      });
      return response;
    },
    placeholderData: keepPreviousData,
  });

  if (isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Typography color="error" sx={{ mt: 4, textAlign: 'center' }}>
        Impossible de récupérer les dossiers.
      </Typography>
    );
  }

  const dossiers = result?.data ?? [];
  const pagination = result?.pagination;

  // Filtrage de secours côté client pour le thème (si l'API ne le gère pas encore)
  // Idéalement, cela devrait être fait côté serveur aussi.
  const displayData = theme 
    ? dossiers.filter((d: any) => d.theme === theme)
    : dossiers;

  return (
    <div>
      <Pagination 
        totalPage={pagination?.totalPage ?? 1} 
        page={page} 
        setPage={setPage} 
        isPending={isPending} 
      />
      
      <Box sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gridGap: 24,
          mt: 3, mb: 3
      }}>
        {displayData.map((dossier: any) => {
          // Logique d'affichage (Type & Statut)
          const typeInfo = TYPES_DE_DOSSIERS.find((t) => t.code === dossier.codeProcedure);
          const typeLabel = typeInfo ? typeInfo.label : "Dossier";

          const actes = dossier.actesLegislatifs || [];
          const statusCode = actes.length > 0 ? getCurrentStatus(actes) : null;
          const statusLabel = statusCode ? statusInfo[statusCode]?.label : null;
          const statusType = statusCode ? statusInfo[statusCode]?.status : undefined;

          return (
            <DossierCard
              key={dossier.uid}
              href={`/${dossier.legislature}/dossier/${dossier.uid}`}
              titre={dossier.titre}
              dateDernierActe={dossier.dateDernierActe ? new Date(dossier.dateDernierActe) : null}
              type={typeLabel}
              statusLabel={statusLabel}
              statusType={statusType}
              thematique={dossier.theme}
              // On ne passe plus 'amendements' car vous n'en avez pas besoin ici
            />
          );
        })}

        {displayData.length === 0 && (
            <Typography sx={{ gridColumn: "1 / -1", textAlign: "center", mt: 4, fontStyle: "italic", color: "text.secondary" }}>
                Aucun dossier trouvé pour "{search}".
            </Typography>
        )}
      </Box>

      {displayData.length > 0 && (
        <Pagination 
            totalPage={pagination?.totalPage ?? 1} 
            page={page} 
            setPage={setPage} 
            isPending={isPending} 
        />
      )}
    </div>
  );
}