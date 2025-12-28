"use client";
import * as React from "react";
import Typography from "@mui/material/Typography";
import WeeklyActivityChart from "./WeeklyActivityChart";
import { MenuItem, Select, Stack } from "@mui/material";
import { StatistiqueHebdomadaire } from "@prisma/client";

export default function WeeklyActivitySectionClient(props: {
  presenceDetectee: StatistiqueHebdomadaire[];
  presenceCommision: StatistiqueHebdomadaire[];
  presenceDetecteeMax: StatistiqueHebdomadaire[];
  presenceDetecteeMediane: StatistiqueHebdomadaire[];
  presenceCommisionMax: StatistiqueHebdomadaire[];
  presenceCommisionMediane: StatistiqueHebdomadaire[];
}) {
  const [activityType, setActivityType] = React.useState<
    "commission" | "hemicicle"
  >("hemicicle");

  return (
    <div>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="subtitle1" fontWeight={"bold"} component="h2">
          Présences et participations
        </Typography>
        <Select
          value={activityType}
          onChange={(event) =>
            setActivityType(event.target.value as "commission" | "hemicicle")
          }
          disableUnderline
          variant="standard"
          sx={{
                minWidth: 140,
                backgroundColor: 'white',
                borderRadius: '50px',
                fontSize: '0.9rem',
                color: '#666',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0', 
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ccc', 
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#aaa', 
                  borderWidth: '1px'
                },
                '& .MuiSelect-select': {
                  py: 1,
                  px: 2,
                  backgroundColor: 'transparent !important',
                },
                '& .MuiSvgIcon-root': {
                  right: '12px',
                  color: '#888',
                }
              }}>
          <MenuItem value="hemicicle">Hémicycle</MenuItem>
          <MenuItem value="commission">Commissions</MenuItem>
        </Select>
      </Stack>
      <WeeklyActivityChart {...props} activityType={activityType} />
    </div>
  );
}
