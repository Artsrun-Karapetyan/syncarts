export function isUpdaterConfigError(error: unknown) {
  return (
    String(error).includes("Updater") && String(error).includes("configured")
  );
}
