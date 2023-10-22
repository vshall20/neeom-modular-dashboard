function getOrderAge(order) {
  // console.log(order.orderHistory);
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
module.exports = {
  getOrderAge,
};
