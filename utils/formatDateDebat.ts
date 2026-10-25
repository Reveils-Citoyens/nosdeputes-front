// utils/formatDateDebat.ts

export const formatDateDebat = (rawDate: string | Date | null | undefined): string => {
  if (!rawDate) return "-";

  let dateObj: Date | null = null;

  // 1. Si c'est déjà un objet Date
  if (rawDate instanceof Date) {
    dateObj = rawDate;
  } 
  // 2. Si c'est une chaîne de caractères
  else if (typeof rawDate === "string") {
    // Cas du format "AAAAMMJJHHMMSS..." (ex: 20251127000000000)
    // On vérifie s'il n'y a que des chiffres et si c'est assez long
    if (/^\d{12,}$/.test(rawDate)) {
      const year = parseInt(rawDate.substring(0, 4), 10);
      const month = parseInt(rawDate.substring(4, 6), 10) - 1; // Attention : mois commence à 0 en JS
      const day = parseInt(rawDate.substring(6, 8), 10);
      const hour = parseInt(rawDate.substring(8, 10), 10);
      const minute = parseInt(rawDate.substring(10, 12), 10);
      
      dateObj = new Date(year, month, day, hour, minute);
    } 
    // Cas d'une date ISO standard (2025-11-24) ou formatable directement
    else {
      const timestamp = Date.parse(rawDate);
      if (!isNaN(timestamp)) {
        dateObj = new Date(timestamp);
      }
    }
  }

  // Si on n'a pas réussi à parser (ex: "Mercredi 11 juin..."), on retourne la chaîne brute
  if (!dateObj || isNaN(dateObj.getTime())) {
    // Optionnel : Vous pouvez essayer de nettoyer la string brute ici si besoin
    return String(rawDate); 
  }

  // 3. Formatage final en Français avec Heure
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", // lundi
    year: "numeric", // 2025
    month: "long",   // novembre
    day: "numeric",  // 24
    hour: "2-digit", // 14 h
    minute: "2-digit" // 30
  }).format(dateObj);
};