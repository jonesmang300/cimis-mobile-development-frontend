export const extractDateOnly = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.includes("T") ? raw.split("T")[0] : raw;
};

export const toLocalDateOnly = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (!raw.includes("T")) {
    return raw;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return extractDateOnly(raw);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateOnlyLocal = (value: string | null | undefined) => {
  const dateOnly = toLocalDateOnly(value);
  if (!dateOnly) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateLongLocal = (value: string | null | undefined) => {
  const date = parseDateOnlyLocal(value);
  if (!date) return extractDateOnly(value) || "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const getTodayLocalDateOnly = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getMaxDobLocalDateOnly = (minAgeYears: number) => {
  const today = new Date();
  const date = new Date(
    today.getFullYear() - minAgeYears,
    today.getMonth(),
    today.getDate(),
  );
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
