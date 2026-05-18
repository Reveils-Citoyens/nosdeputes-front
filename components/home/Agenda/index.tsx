import React from "react";
import Box from "@mui/material/Box";
import { getAgendaSemaine, getWeekStart } from "@/data/getAgendaSemaine";
import AgendaCalendar from "./AgendaCalendar";

export default async function AgendaSection() {
  const weekStart = getWeekStart(new Date());
  const reunions = await getAgendaSemaine(weekStart);

  return (
    <Box
      sx={{
        maxWidth: 1088,
        mx: { xs: 1, md: 4, lg: "auto" },
        mt: { xs: 4, md: 8 },
        mb: 4,
      }}
    >
      <AgendaCalendar
        initialReunions={reunions}
        initialWeekStart={weekStart.toISOString().slice(0, 10)}
      />
    </Box>
  );
}
