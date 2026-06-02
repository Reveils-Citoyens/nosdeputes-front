import { groupDeputes } from "./groupDeputes";
import DeputesFilter from "./DeputesFilter";
import { getDeputes } from "@/data/getDeputes";

export default async function DeputesContent() {
  const data = await getDeputes(17);
  if (!data) return null;

  const { acteurs, groups } = data;
  const { uidPerNom, uidPerGroup, uidPerCirco } = groupDeputes(acteurs);

  return (
    <DeputesFilter
      deputes={acteurs}
      uidPerNom={uidPerNom}
      uidPerGroup={uidPerGroup}
      uidPerCirco={uidPerCirco}
      groups={groups}
    />
  );
}
