export type PdfPasswordErrorKind = "required" | "incorrect";

type PdfPasswordLikeError = {
  code?: unknown;
  name?: unknown;
  message?: unknown;
};

export function getPdfPasswordErrorKind(
  error: unknown,
): PdfPasswordErrorKind | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as PdfPasswordLikeError;
  const name = typeof candidate.name === "string" ? candidate.name : "";
  const message =
    typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";

  if (name !== "PasswordException" && !message.includes("password")) {
    return null;
  }
  return candidate.code === 2 || message.includes("incorrect")
    ? "incorrect"
    : "required";
}
