import { List, ListItem, Paper, Stack, Typography } from "@mui/material";
import { Collaborateur } from "@/data/getActeurCollaborateurs";

export default function CollaborateursSection({
  collaborateurs,
}: {
  collaborateurs: Collaborateur[];
}) {
  if (collaborateurs.length === 0) return null;

  return (
    <Paper sx={{ p: 2, bgcolor: "grey.100", width: 300, borderRadius: "16px" }} elevation={0}>
      <Stack direction="column" spacing={1}>
        <Typography variant="subtitle1" fontWeight="bold">
          Collaborateurs
        </Typography>
        <List disablePadding>
          {collaborateurs.map((c, i) => (
            <ListItem
              key={i}
              disablePadding
              sx={{ flexDirection: "column", alignItems: "flex-start", mb: 1 }}
            >
              <Typography variant="body2" fontWeight="medium">
                {[c.qualite, c.prenom, c.nom].filter(Boolean).join(" ")}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
}
