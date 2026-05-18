import { getParlementDb } from "@/lib/mongodb";

export type ReunionType =
  | "seance_type"
  | "reunionCommission_type"
  | "reunionInitParlementaire_type";

export type ReunionAgenda = {
  uid: string;
  type: ReunionType;
  timeStampDebut: string;
  timeStampFin: string | null;
  organeUid: string | null;
  organeLibelle: string | null;
  etat: string;
  odj: string | string[] | null;
};

/** Renvoie le lundi de la semaine à afficher.
 *  Si on est vendredi, samedi ou dimanche → semaine suivante. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=dim, 1=lun … 6=sam
  let daysToMonday: number;
  if (day === 0) daysToMonday = 1;
  else if (day >= 5) daysToMonday = 8 - day;
  else daysToMonday = 1 - day;
  d.setDate(d.getDate() + daysToMonday);
  return d;
}

export async function getAgendaSemaine(
  weekStart: Date
): Promise<ReunionAgenda[]> {
  const db = await getParlementDb();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startStr = weekStart.toISOString().slice(0, 10);
  const endStr = weekEnd.toISOString().slice(0, 10) + "T23:59:59";

  const pipeline = [
    {
      $match: {
        timeStampDebut: { $gte: startStr, $lte: endStr },
        "cycleDeVie.etat": { $ne: "Annulé" },
      },
    },
    {
      $lookup: {
        from: "organes",
        localField: "organeReuniRef",
        foreignField: "uid",
        as: "organe",
      },
    },
    { $unwind: { path: "$organe", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        uid: 1,
        type: "$@xsi:type",
        timeStampDebut: 1,
        timeStampFin: 1,
        organeUid: "$organeReuniRef",
        organeLibelle: "$organe.libelle",
        etat: "$cycleDeVie.etat",
        // Commissions : resumeODJ.item ou convocationODJ.item (string ou array)
        // Séances : pointsODJ.pointODJ[].objet
        // $ifNull gère correctement les champs "manquants" contrairement à $ne[x, null]
        odj: {
          $let: {
            vars: {
              commOdj: {
                $ifNull: ["$ODJ.resumeODJ.item", "$ODJ.convocationODJ.item"],
              },
              seanceOdj: {
                $cond: {
                  if: { $isArray: "$ODJ.pointsODJ.pointODJ" },
                  then: {
                    $filter: {
                      input: {
                        $map: {
                          input: "$ODJ.pointsODJ.pointODJ",
                          as: "p",
                          in: "$$p.objet",
                        },
                      },
                      as: "o",
                      cond: { $ne: ["$$o", null] },
                    },
                  },
                  else: null,
                },
              },
            },
            in: { $ifNull: ["$$commOdj", "$$seanceOdj"] },
          },
        },
      },
    },
    { $sort: { timeStampDebut: 1 } },
  ];

  const results = await db
    .collection("reunions")
    .aggregate(pipeline)
    .toArray();

  return results as ReunionAgenda[];
}
