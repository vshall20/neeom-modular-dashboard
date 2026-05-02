function getOrderAge(order) {
  let history = order.orderHistory;
  let packed = history.filter((o) => o.updatedTo.toLowerCase() === "packed");
  let _date = packed.length > 0 ? packed[0].updateDate : order.orderDate;
  let dateParts = _date.split("-");
  let dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
  let today = new Date();
  const diffTime = Math.abs(today - dateObject);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const finalDiff =
    diffDays === 0 ? 0 : packed.length > 0 ? -1 * diffDays + 1 : diffDays - 1;
  return `${finalDiff} days`;
}

function getStatusClass(status) {
  if (!status) return "status-bom";
  const s = String(status).toLowerCase();
  if (s.includes("close")) return "status-close";
  if (s.includes("dispatch")) return "status-dispatch";
  if (s.includes("pack")) return "status-packed";
  if (s.includes("cutting") || s.includes("edge") || s.includes("drill")) return "status-cutting";
  if (s.includes("bom")) return "status-bom";
  return "status-process";
}

module.exports = {
  getOrderAge,
  getStatusClass,
};
