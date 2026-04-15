export function getCandidateStageFromPipeline(linkRow) {
  const stage = linkRow?.stage || "tagged";

  switch (stage) {
    case "tagged":
      return "associated";
    case "submitted":
      return "submitted";
    case "interview":
      return "interviewing";
    case "offered":
      return "offered";
    case "placed":
      return "placed";
    case "rejected":
      return "rejected";
    default:
      return "associated";
  }
}

export function getJobStageFromPipeline(rows = []) {
  if (rows.some((r) => r.stage === "placed")) return "filled";
  if (rows.some((r) => r.stage === "offered")) return "offered";
  if (rows.some((r) => r.stage === "interview")) return "interviewing";
  if (rows.some((r) => r.stage === "submitted")) return "submitted";
  if (rows.some((r) => r.stage === "tagged")) return "sourcing";
  return "open";
}
