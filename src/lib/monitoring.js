export function captureError(error, context = {}) {
  console.error("Captured error", { error, context });
}
