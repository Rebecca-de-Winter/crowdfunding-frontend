import findNeedDetailId from "./find-need-detail-id";
import getNeedDetail from "./get-need-detail";

export default async function getNeedDetailFromNeed(need) {
  if (!need?.id || !need?.need_type) return null;

  // Money needs don't have a detail table in your schema
  if (need.need_type === "money") return null;

  // Find the detail row ID first
  const detailId = await findNeedDetailId(need.id, need.need_type);
  if (!detailId) return null;

  // Then fetch the detail record
  return await getNeedDetail(need.need_type, detailId);
}
