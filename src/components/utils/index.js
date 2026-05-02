function getOrderAgeDays(order) {
  const history = order.orderHistory || [];
  const packed = history.filter(
    (o) => String(o.updatedTo || "").toLowerCase() === "packed"
  );
  const _date = packed.length > 0 ? packed[0].updateDate : order.orderDate;
  if (!_date) return 0;
  const dateParts = String(_date).split("-");
  const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
  const today = new Date();
  const diffTime = Math.abs(today - dateObject);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? 0 : packed.length > 0 ? -1 * diffDays + 1 : diffDays - 1;
}

function getOrderAge(order) {
  return `${getOrderAgeDays(order)} days`;
}

function getAgeClass(days) {
  if (days < 0) return "age-packed";
  if (days <= 3) return "age-fresh";
  if (days <= 7) return "age-warning";
  return "age-danger";
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
  getOrderAgeDays,
  getAgeClass,
  getStatusClass,
};
