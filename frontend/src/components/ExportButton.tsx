import { exportUrl } from "../api/client";
import { LinkButton } from "./ui/Button";

type Props = { jobId: string };

export default function ExportButton({ jobId }: Props) {
  return (
    <div className="flex gap-2">
      <LinkButton variant="secondary" href={exportUrl(jobId, "csv")}>
        Export CSV
      </LinkButton>
      <LinkButton variant="primary" href={exportUrl(jobId, "xlsx")}>
        Export XLSX
      </LinkButton>
    </div>
  );
}
