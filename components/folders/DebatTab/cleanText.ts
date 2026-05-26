export function cleanText(text: string, justRemove?: boolean) {
  return text
    .replaceAll("<exposant>", justRemove ? "" : "<sup>")
    .replaceAll("</exposant>", justRemove ? "" : "</sup>")
    .replaceAll("<italique>", justRemove ? "" : "<i>")
    .replaceAll("</italique>", justRemove ? "" : "</i>");
}
