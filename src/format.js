const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatAmount(amount) {
  return currencyFormatter.format(amount);
}
