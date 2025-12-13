"use client";
import * as React from "react";
import {
  InfoDialogContext,
  InfoDialogDispatchContext,
} from "./InfoDialogContext";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import { Typography } from "@mui/material";
import { infoDialogContents } from "../contents";

export default function InfoDialog() {
  const contentKey = React.useContext(InfoDialogContext);
  const setContentKey = React.useContext(InfoDialogDispatchContext);

  const [cat, key] = contentKey ? contentKey.split(".") : [null, null];
  const info = cat && key ? infoDialogContents[cat][key] : null;

  return (
    <Dialog
      maxWidth="lg"
      onClose={() => setContentKey?.(null)}
      open={info?.dialog ? true : false}
    >
      <DialogTitle>{info?.translation}</DialogTitle>
      {contentKey &&
        info?.dialog?.split("\n").map((line, index) => (
          <Typography sx={{ p: 2 }} key={index}>
            {line}
          </Typography>
        ))}
    </Dialog>
  );
}
