"use client";
import * as React from "react";
import {
  InfoDialogContext,
  InfoDialogDispatchContext,
} from "./InfoDialogContext";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { infoDialogContents } from "../contents";

export default function InfoDialog() {
  const contentKey = React.useContext(InfoDialogContext);
  const setContentKey = React.useContext(InfoDialogDispatchContext);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const handleClose = () => setContentKey?.(null);

  const [cat, key] = contentKey ? contentKey.split(".") : [null, null];
  const info = cat && key ? infoDialogContents[cat][key] : null;

  if (!info) return null;

  return (
    <Dialog
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      onClose={handleClose}
      open={!!contentKey}
      PaperProps={{
        elevation: 2,
        sx: {
          borderRadius: 3,
          backgroundImage: "none",
        }
      }}
    >
      <DialogTitle sx={{
          m: 0,
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
      }}>
        <Typography variant="h6" component="div" fontWeight="bold" sx={{ lineHeight: 1.3, mr: 2 }}>
          {info.translation}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
            mr: -1.5
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, borderColor: 'grey.100' }}>
        {info.dialog?.split("\n").map((line, index) => {
           if (!line.trim()) return <Box key={index} sx={{ height: 16 }} />;
           return (
            <Typography 
                key={index} 
                variant="body1" 
                color="text.secondary" 
                sx={{ mb: 1.5, lineHeight: 1.6 }}
            >
              {line}
            </Typography>
           );
        })}
      </DialogContent>
    </Dialog>
  );
}