
import { Ban, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

type Status = "neutral" | "success" | "warning" | "error" | "info";
type Style = "full" | "stroked" | "light";
type Size = "sm" | "lg";

const STATUS_CONFIG: {
  key: Status;
  label: string;
  verified: boolean;
  Icon: typeof Ban;
}[] = [
  { key: "neutral", label: "Neutral", verified: true, Icon: Ban },
  { key: "success", label: "Success", verified: false, Icon: CheckCircle2 },
  { key: "warning", label: "Warning", verified: false, Icon: AlertTriangle },
  { key: "error", label: "Error", verified: false, Icon: XCircle },
  { key: "info", label: "Info", verified: false, Icon: Info },
];

const STYLES: { key: Style; label: string }[] = [
  { key: "full", label: "Full" },
  { key: "stroked", label: "Stroked" },
  { key: "light", label: "Light" },
];

const SIZES: { key: Size; label: string; verified: boolean }[] = [
  { key: "sm", label: "Small", verified: true },
  { key: "lg", label: "Large", verified: false },
];

function StatusMatrix({
  status,
  label,
  verified,
  Icon,
}: {
  status: Status;
  label: string;
  verified: boolean;
  Icon: typeof Ban;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-neutral-800">{label}</h2>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            verified
              ? "bg-success-50 text-success-700"
              : "bg-warning-50 text-warning-700"
          )}
        >
          {verified ? "Verified against Figma" : "Unverified — placeholder"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-neutral-100">
              <th className="w-24 p-3 text-left font-medium text-neutral-600">
                Style
              </th>
              {SIZES.map((size) => (
                <th
                  key={size.key}
                  className="p-3 text-left font-medium text-neutral-600"
                >
                  {size.label}
                  {!size.verified && (
                    <span className="ml-1 text-warning-600">*</span>
                  )}
                  {" — with icon"}
                </th>
              ))}
              {SIZES.map((size) => (
                <th
                  key={`${size.key}-no-icon`}
                  className="p-3 text-left font-medium text-neutral-600"
                >
                  {size.label}
                  {!size.verified && (
                    <span className="ml-1 text-warning-600">*</span>
                  )}
                  {" — no icon"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STYLES.map((style) => (
              <tr key={style.key} className="border-b border-border last:border-0">
                <td className="p-3 font-medium text-neutral-700">
                  {style.label}
                </td>
                {SIZES.map((size) => (
                  <td key={`${size.key}-icon`} className="p-3">
                    <Badge status={status} variant={style.key} size={size.key}>
                      <Icon data-icon="inline-start" aria-hidden="true" />
                      Badge
                    </Badge>
                  </td>
                ))}
                {SIZES.map((size) => (
                  <td key={`${size.key}-noicon`} className="p-3">
                    <Badge status={status} variant={style.key} size={size.key}>
                      Badge
                    </Badge>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function BadgeShowcasePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-12 px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-neutral-900">
          Badge — Design System Reference
        </h1>
        <p className="text-sm text-neutral-500">
          Status × Style × Size × icon presence. * = size not yet confirmed
          against Figma.
        </p>
      </header>

      {STATUS_CONFIG.map(({ key, label, verified, Icon }) => (
        <StatusMatrix
          key={key}
          status={key}
          label={label}
          verified={verified}
          Icon={Icon}
        />
      ))}
    </main>
  );
}