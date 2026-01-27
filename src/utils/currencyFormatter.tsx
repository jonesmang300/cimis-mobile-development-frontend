// ✅ Reusable currency formatting utility for Malawi Kwacha (MWK)

export const CurrencyFormatter = (
  amount: number | string | null | undefined
): string => {
  const numericValue = Number(amount);

  if (amount == null || isNaN(numericValue)) {
    return "Invalid amount";
  }

  return new Intl.NumberFormat("en-MW", {
    style: "currency",
    currency: "MWK",
    minimumFractionDigits: 2,
  }).format(numericValue);
};
