"use client";
import { styled, Theme } from "@mui/system";
import Chip, { chipClasses, ChipProps } from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";

export type Status = "validated" | "review" | "refused" | "dropped" | "error";
interface StatusChipProps extends ChipProps {
  status?: Status;
  tooltip?: string;
}

function getColor(status: StatusChipProps["status"], theme: Theme) {
  switch (status) {
    case "validated":
      return theme.palette.success;
    case "review":
      return theme.palette.info;
    case "refused":
      return theme.palette.warning;
    case "error":
      return { main: theme.palette.error.dark, light: "#fde8e8" };
    case "dropped":
    default:
      return { main: theme.palette.grey[800], light: theme.palette.grey[100] };
  }
}

function StatusChip({ tooltip, ...props }: StatusChipProps) {
  const chip = <Chip icon={<div className="point" />} {...props} />;
  if (!tooltip) return chip;
  return (
    <Tooltip title={tooltip} arrow placement="top">
      <span>{chip}</span>
    </Tooltip>
  );
}

const StyledStatusChip = styled(StatusChip, {
  shouldForwardProp: (prop) => prop !== "status",
  name: "StatusChip",
})(({ theme, status, size }) => {
  const color = getColor(status, theme);

  return {
    backgroundColor: color.light,
    color: color.main,
    height: 37,
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    borderRadius: 37 / 2,
    ...(size === "small" && {
      height: 30,
      borderRadius: 30 / 2,
    }),
    [`& .${chipClasses.label}`]: {
      paddingLeft: theme.spacing(1),
      paddingRight: 0,
    },
    fontWeight: 600,
    [`& .${chipClasses.icon}`]: {
      margin: 0,
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: color.main,
      ...(size === "small" && {
        width: 6,
        height: 6,
      }),
    },
  };
});

export default StyledStatusChip;
