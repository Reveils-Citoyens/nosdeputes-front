"use client";
import * as React from "react";
import InfoIcon from "@/icons/InfoIcon";
import {
  IconButton,
  IconButtonProps,
  Tooltip,
  TooltipProps,
} from "@mui/material";
import { InfoDialogDispatchContext } from "./InfoDialogContext";
import { infoDialogContents } from "../contents";

export default function InfoDialogIcon(
  props: IconButtonProps & { category: string; item: string }
) {
  const { category, item, ...other } = props;
  const setContentKey = React.useContext(InfoDialogDispatchContext);

  const info = infoDialogContents[category]?.[item];

  if (!info || (!info.dialog && !info.tooltip)) {
    return null;
  }

  return (
    <Tooltip title={info.tooltip ?? "Plus d'info"} placement="top">
      <IconButton
        size="small"
        {...other}
        onClick={
          info.dialog ? () => setContentKey?.(category + "." + item) : undefined
        }
      >
        <InfoIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}
