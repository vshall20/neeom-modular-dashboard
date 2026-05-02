function padDateString(s) {
  if (!s) return s;
  const parts = String(s).split("-");
  if (parts.length !== 3) return s;
  const [d, m, y] = parts;
  if (!d || !m || !y) return s;
  return `${String(parseInt(d, 10) || 0).padStart(2, "0")}-${String(
    parseInt(m, 10) || 0
  ).padStart(2, "0")}-${y}`;
}

function parseDmyDate(s) {
  if (!s) return null;
  const parts = String(s).split("-");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function getTodayDmy() {
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${date.getFullYear()}`;
}

function dmyFromInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${date.getFullYear()}`;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getOrderAgeDays(order) {
  const history = order.orderHistory || [];
  const packed = history.filter(
    (o) => String(o.updatedTo || "").toLowerCase() === "packed"
  );
  const _date = packed.length > 0 ? packed[0].updateDate : order.orderDate;
  const dateObject = parseDmyDate(_date);
  if (!dateObject) return 0;
  const today = startOfDay(new Date());
  const diffMs = today - startOfDay(dateObject);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (packed.length > 0) {
    return diffDays === 0 ? 0 : -1 * diffDays;
  }
  return diffDays < 0 ? 0 : diffDays;
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
  padDateString,
  parseDmyDate,
  getTodayDmy,
  dmyFromInputDate,
};
