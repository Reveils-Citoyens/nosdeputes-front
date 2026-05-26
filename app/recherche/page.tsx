import * as React from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import {
  Person as PersonIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  QuestionAnswer as QuestionIcon,
  RecordVoiceOver as VoiceIcon,
  Label as ThemeIcon,
} from "@mui/icons-material";
import { searchAll } from "@/data/searchAll";
import type { AmendementSearchResult } from "@/data/mongo/searchAmendementMongo";
import SearchAmendementCard from "./SearchAmendementCard";
import SearchQuestionCard from "./SearchQuestionCard";
import AmendementsLoadMore from "./AmendementsLoadMore";
import QuestionsLoadMore from "./QuestionsLoadMore";
import DossiersLoadMore from "./DossiersLoadMore";
import DossierBadge from "@/components/folders/DossierBadge";
import type { ActeurSearchResult } from "@/data/mongo/searchActeurParNom";
import type { DossierSearchResult } from "@/data/mongo/searchDossierParTitre";
import type { QuestionSearchResult } from "@/data/mongo/searchQuestion";
import { FilterContainer } from "@/components/FilterContainer";
import RechercheFilter from "./Filter";
import AlerteButton from "@/components/AlerteButton";

export const metadata = {
  title: "Recherche — Nos Députés",
};

function toSlug(prenom: string, nom: string): string {
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function deputePhotoUrl(uid: string): string {
  return `https://tricoteuses-assets.s3.fr-par.scw.cloud/photos/${uid.replace(/^PA/, "")}_124x124.jpg`;
}


// ─── Wrappers de section ──────────────────────────────────────────────────────

function SectionShell({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count?: number | string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        bgcolor: "white",
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: "16px",
        p: { xs: 2, md: 3 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Icon sx={{ color: "grey.700" }} />
        <Typography variant="h6" fontWeight="bold" sx={{ color: "#1A1A1B" }}>
          {title}
        </Typography>
        {count !== undefined && (
          <Chip
            label={count}
            size="small"
            sx={{
              bgcolor: "grey.100",
              color: "grey.700",
              fontWeight: "bold",
              fontSize: "0.7rem",
              height: 22,
            }}
          />
        )}
      </Stack>
      {children}
    </Box>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
      {message}
    </Typography>
  );
}

// ─── Sections par catégorie ───────────────────────────────────────────────────

function DeputesSection({ items }: { items: ActeurSearchResult[] }) {
  return (
    <SectionShell icon={PersonIcon} title="Députés" count={items.length || undefined}>
      {items.length === 0 ? (
        <EmptyRow message="Aucun député trouvé." />
      ) : (
        <Stack spacing={1.5}>
          {items.map((d) => (
            <Link
              key={d.uid}
              href={`/depute/${toSlug(d.prenom, d.nom)}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  p: 1.25,
                  borderRadius: "10px",
                  "&:hover": { bgcolor: "grey.50" },
                }}
              >
                <Avatar src={deputePhotoUrl(d.uid)} sx={{ width: 40, height: 40 }}>
                  {d.prenom[0]}
                  {d.nom[0]}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" fontWeight="bold" noWrap>
                      {d.prenom} {d.nom}
                    </Typography>
                    {d.mandatAcheve && (
                      <Chip
                        label="Mandat achevé"
                        size="small"
                        sx={{
                          bgcolor: "grey.200",
                          color: "grey.800",
                          fontWeight: 600,
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          height: 18,
                          "& .MuiChip-label": { px: 0.8 },
                        }}
                      />
                    )}
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={0.8}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ mt: 0.25 }}
                  >
                    {d.groupeParlementaire && (
                      <>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor:
                              d.groupeParlementaire.couleurAssociee ?? "grey.400",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ fontWeight: 500 }}
                        >
                          {d.groupeParlementaire.libelleAbrev ??
                            d.groupeParlementaire.libelle}
                        </Typography>
                      </>
                    )}
                    {d.groupeParlementaire && d.departement && d.numCirco && (
                      <Typography variant="caption" color="text.secondary">·</Typography>
                    )}
                    {d.departement && d.numCirco && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {d.numCirco}e circ. — {d.departement}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Link>
          ))}
        </Stack>
      )}
    </SectionShell>
  );
}

function DossiersSection({
  items,
  total,
  query,
  legislature,
}: {
  items: DossierSearchResult[];
  total: number;
  query: string;
  legislature: string | null;
}) {
  return (
    <SectionShell icon={DescriptionIcon} title="Dossiers" count={total || undefined}>
      {items.length === 0 ? (
        <EmptyRow message="Aucun dossier trouvé." />
      ) : (
        <>
          <Stack spacing={1.5}>
            {items.map((d) => (
              <Link
                key={d.uid}
                href={`/${d.legislature}/dossier/${d.uid}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{
                    p: 1.25,
                    borderRadius: "10px",
                    "&:hover": { bgcolor: "grey.50" },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight="bold" noWrap>
                      {d.titre}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.25 }}>
                      {d.typeLibelle && (
                        <Typography variant="caption" color="text.secondary">
                          {d.typeLibelle}
                        </Typography>
                      )}
                      {d.amendementsTotal > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          · {d.amendementsTotal} amendement{d.amendementsTotal > 1 ? "s" : ""}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  <DossierBadge badge={d.badge} />
                </Stack>
              </Link>
            ))}
          </Stack>
          <DossiersLoadMore
            query={query}
            legislature={legislature}
            alreadyShown={items.length}
            total={total}
          />
        </>
      )}
    </SectionShell>
  );
}

function AmendementsSection({
  items,
  total,
  query,
  legislature,
}: {
  items: AmendementSearchResult[];
  total: number;
  query: string;
  legislature: string | null;
}) {
  return (
    <SectionShell icon={EditIcon} title="Amendements" count={total || undefined}>
      {items.length === 0 ? (
        <EmptyRow message="Aucun amendement trouvé." />
      ) : (
        <>
          <Stack spacing={0}>
            {items.map((a) => (
              <SearchAmendementCard key={a.uid} amendement={a} />
            ))}
          </Stack>
          <AmendementsLoadMore
            query={query}
            legislature={legislature}
            alreadyShown={items.length}
            total={total}
          />
        </>
      )}
    </SectionShell>
  );
}

function QuestionsSection({
  items,
  total,
  query,
  legislature,
}: {
  items: QuestionSearchResult[];
  total: number;
  query: string;
  legislature: string | null;
}) {
  return (
    <SectionShell icon={QuestionIcon} title="Questions" count={total || undefined}>
      {items.length === 0 ? (
        <EmptyRow message="Aucune question trouvée." />
      ) : (
        <>
          <Stack spacing={0}>
            {items.map((q) => (
              <SearchQuestionCard key={q.uid} question={q} />
            ))}
          </Stack>
          <QuestionsLoadMore
            query={query}
            legislature={legislature}
            alreadyShown={items.length}
            total={total}
          />
        </>
      )}
    </SectionShell>
  );
}

function ComingSoonSection({
  icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) {
  return (
    <SectionShell icon={icon} title={title}>
      <Box sx={{ py: 3, textAlign: "center", color: "grey.500" }}>
        <Typography
          variant="caption"
          sx={{ textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "bold" }}
        >
          Bientôt disponible
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {message}
        </Typography>
      </Box>
    </SectionShell>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; legislature?: string; sort?: string }>;
}) {
  const { q = "", legislature, sort } = await searchParams;
  const query = q.trim();
  const sortMode = sort === "date" ? "date" : "relevance";

  return (
    <Container
      sx={{
        pt: 3,
        pb: 6,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 5,
      }}
    >
      {/* Sidebar filtres */}
      <Stack spacing={3} useFlexGap flex={2} maxWidth={300}>
        <React.Suspense>
          <FilterContainer>
            <RechercheFilter />
          </FilterContainer>
        </React.Suspense>
      </Stack>

      {/* Résultats */}
      <Stack spacing={3} flex={5} sx={{ minWidth: 0 }}>
        <Stack spacing={0.5}>
          <Typography
            variant="overline"
            sx={{ fontWeight: "bold", letterSpacing: "0.15em", color: "grey.600" }}
          >
            Résultats de recherche
          </Typography>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Typography
              component="h1"
              sx={{ fontSize: { xs: "1.5rem", md: "2rem" }, fontWeight: "bold", color: "#1A1A1B" }}
            >
              {query ? `« ${query} »` : "Saisir une requête"}
            </Typography>
            {query.length >= 5 && (
              <AlerteButton
                subjectType="recherche"
                subjectUid={query.toLowerCase().trim()}
                subjectLabel={`Recherche « ${query} »`}
                variant="button"
              />
            )}
          </Stack>
        </Stack>

        {query.length < 5 ? (
          <Typography color="text.secondary">
            Saisissez au moins 5 caractères dans la barre de recherche ou dans le
            champ « Affiner la recherche » à gauche pour lancer une recherche.
          </Typography>
        ) : (
          <RechercheResults
            query={query}
            legislature={legislature ?? null}
            sort={sortMode}
          />
        )}
      </Stack>
    </Container>
  );
}

async function RechercheResults({
  query,
  legislature,
  sort,
}: {
  query: string;
  legislature: string | null;
  sort: "relevance" | "date";
}) {
  const results = await searchAll(query, { legislature, sort });
  const totalFound =
    results.deputes.length +
    results.dossiersTotal +
    results.amendementsTotal +
    results.questionsTotal;

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        {totalFound > 0
          ? `${totalFound} résultat${totalFound > 1 ? "s" : ""} dans les sections ci-dessous.`
          : "Aucun résultat dans les catégories actuellement indexées."}
      </Typography>

      <DossiersSection
        items={results.dossiers}
        total={results.dossiersTotal}
        query={query}
        legislature={legislature}
      />
      <DeputesSection items={results.deputes} />
      <AmendementsSection
        items={results.amendements}
        total={results.amendementsTotal}
        query={query}
        legislature={legislature}
      />
      <QuestionsSection
        items={results.questions}
        total={results.questionsTotal}
        query={query}
        legislature={legislature}
      />
      <ComingSoonSection
        icon={VoiceIcon}
        title="Débats en séance"
        message="La recherche dans le verbatim des débats nécessite l'indexation des paragraphes en base — en cours."
      />
      <ComingSoonSection
        icon={ThemeIcon}
        title="Thèmes"
        message="Les classifications thématiques seront ajoutées dès que les données seront livrées."
      />
    </Stack>
  );
}
