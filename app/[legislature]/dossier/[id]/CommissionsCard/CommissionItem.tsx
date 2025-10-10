import * as React from "react";
import Typography, { TypographyProps } from "@mui/material/Typography";
import { Organe } from "@prisma/client";

async function getCommissionUnCached(uid: string): Promise<Organe | null> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/organes/${uid}`
    );

    const { data } = await rep.json();

    return data;
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return null;
  }
}

export const getCommission = React.cache(getCommissionUnCached);

export default async function CommissionItem({
  id,
  ...other
}: { id: string } & TypographyProps) {
  const commission = await getCommission(id);

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
      {commission.libelleAbrege || commission.libelle}
    </Typography>
  );
}
