import createPledge from "./create-pledge";
import createItemPledge from "./create-item-pledge";
import createMoneyPledge from "./create-money-pledge";
import createTimePledge from "./create-time-pledge";

export default async function createPledgeWithDetail({
  fundraiser,
  need,
  need_type, // "money" | "time" | "item"
  anonymous = false,
  status = "pending",
  pledgeComment = "",

  // money
  amount,
  moneyComment = "",

  // item
  quantity,
  mode = "donation",
  itemComment = "",

  // time
  start_datetime,
  end_datetime,
  hours_committed,
  timeComment = "",
}) {
  const base = await createPledge({
    fundraiser,
    need,
    comment: pledgeComment,
    anonymous,
    status,
  });

  const pledgeId = base.id;
  if (!pledgeId) throw new Error("Pledge created but no id returned");

  if (need_type === "money") {
    return await createMoneyPledge({
      pledge: pledgeId,
      amount,
      comment: moneyComment,
    });
  }

  if (need_type === "item") {
    return await createItemPledge({
      pledge: pledgeId,
      quantity,
      mode,
      comment: itemComment,
    });
  }

  if (need_type === "time") {
    return await createTimePledge({
      pledge: pledgeId,
      start_datetime,
      end_datetime,
      hours_committed,
      comment: timeComment,
    });
  }

  throw new Error(`Unknown need_type: ${need_type}`);
}
