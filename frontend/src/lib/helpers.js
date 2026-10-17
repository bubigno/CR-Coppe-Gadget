export const isPlaceholder = (v) => typeof v === "string" && v.trim().startsWith("[");

export function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return String(value || "");
  }
}