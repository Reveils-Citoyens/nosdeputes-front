import { ActeLegislatif } from "@prisma/client";


export type ActeLegislatifWithDate = ActeLegislatif & { date: Date; children: string[] };

export type ActLookupWithChild = Record<string, ActeLegislatif & { date?: Date; children: string[] }>

/**
 * This function recursively process acts to 
 * - add `date` property that is either the act date or the earliest date of its children 
 * - sort the children by increasing date
 */
function recursiveDateProcessing(
  /**
   * The act to process.Can be undefined when it's to root of the strucutre.
   */
  parentId: string | undefined,
  /**
   * The children to process.
   */
  ids: string[],
  /**
   * The data structure to modify.
   */
  actsLookup: ActLookupWithChild) {

  for (const id of ids) {
    recursiveDateProcessing(id, actsLookup[id].children, actsLookup);
  }

  ids.sort((a, b) => {
    const dateA = actsLookup[a].date;
    const dateB = actsLookup[b].date;

    if (dateA === undefined && dateB === undefined) {
      return 0;
    }
    if (dateA === undefined) {
      return 1;
    }
    if (dateB === undefined) {
      return -1;
    }
    return dateA.getTime() - dateB.getTime();
  });

  if (parentId) {
    actsLookup[parentId].date = actsLookup[parentId].dateActe ?? undefined
    if (actsLookup[parentId].date === undefined) {
      actsLookup[parentId].date = actsLookup[parentId].dateActe ?? (ids.length > 0 ? actsLookup[ids[0]].date : undefined);
    }
  }
}

/**
 * Add `date` and `children` properties to acts.
 * Also returns `rootIds` that are acts without parent.
 */
export function groupActs(acts: ActeLegislatif[]): {
  rootIds: string[];
  actsLookup: Record<string, ActeLegislatifWithDate>;
} {
  const actsLookup: ActLookupWithChild = Object.fromEntries(
    acts.map((act) => [act.uid, { ...act, children: [] }])
  );

  const rootIds: string[] = [];
  for (const act of acts) {
    const { uid, parentUid } = act;

    if (parentUid && actsLookup[parentUid]) {
      actsLookup[parentUid].children.push(uid);
    }
    if (!parentUid) {
      rootIds.push(uid);
    }
  }

  recursiveDateProcessing(undefined, rootIds, actsLookup);


  return {
    rootIds,
    actsLookup: actsLookup as Record<string, ActeLegislatifWithDate>,
  };
}
