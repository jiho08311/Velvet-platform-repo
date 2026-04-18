type AdminBadgeTone =
  | "pending"
  | "approved"
  | "rejected"
  | "processing"
  | "paid"
  | "failed"
  | "active"
  | "disabled";

type AdminBadgeProps = {
  label: string;
  tone: AdminBadgeTone;
};

function getClassName(tone: AdminBadgeTone) {
  if (tone === "approved" || tone === "active" || tone === "paid") {
    return "border-green-500/30 bg-green-500/15 text-green-400";
  }

  if (tone === "rejected" || tone === "disabled" || tone === "failed") {
    return "border-red-500/30 bg-red-500/15 text-red-400";
  }

  if (tone === "processing") {
    return "border-blue-500/30 bg-blue-500/15 text-blue-400";
  }

  return "border-yellow-500/30 bg-yellow-500/15 text-yellow-400";
}

export function AdminBadge({ label, tone }: AdminBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getClassName(
        tone
      )}`}
    >
      {label}
    </span>
  );
}