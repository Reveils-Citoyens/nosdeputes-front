import * as React from "react";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

import { CardHeader, CardHeaderProps } from "@mui/material";

export interface CardLayoutProps
  extends Pick<CardHeaderProps, "title" | "action"> {
  children: React.ReactNode;
}

export const CardLayout = ({ title, action, children }: CardLayoutProps) => {
  return (
    <Card
      elevation={0}
      sx={{
        pb: 0,
        mb: 0,
        borderRadius: 4,
        border: "1px solid",
        borderColor: "grey.300"
      }}
    >
      <CardHeader
        title={title}
        titleTypographyProps={{
          variant: "subtitle1",
          fontWeight: "bold",
        }}
        action={action}
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
};
