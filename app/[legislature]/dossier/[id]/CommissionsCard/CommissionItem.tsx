import * as React from "react";
import Typography, { TypographyProps } from "@mui/material/Typography";
import { getOrgane } from "@/data/getOrgane";

export default async function CommissionItem({
  id,
  ...other
}: { id: string } & TypographyProps) {
  const commission = await getOrgane(id);

  if (commission == null) {
    return null;
  }

  return (
    <Typography
      key={commission.uid}
      variant="body2"
      fontWeight="bold"
      {...other}
    >
      {commission.libelleAbrege || commission.libelle} ({commission.chambre})
    </Typography>
  );
}
