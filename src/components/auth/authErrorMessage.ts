export type AuthMode = "login" | "register";

export function getAuthErrorMessage(error: unknown, mode: AuthMode) {
  const message = error instanceof Error ? error.message : String(error || "");
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid email or password") ||
    normalized.includes("unauthorized")
  ) {
    return "Incorrect email or password. Please check your credentials and try again.";
  }

  if (normalized.includes("email is already registered")) {
    return "This email is already registered. Try signing in instead.";
  }

  if (normalized.includes("email") || normalized.includes("password")) {
    return mode === "login"
      ? "Please enter a valid email and password."
      : "Please enter a valid email and use a password with at least 8 characters.";
  }

  return "Something went wrong. Please try again.";
}
