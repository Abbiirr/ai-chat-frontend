import { ArrowDownToLine } from "lucide-react";

import type { DownloadLink as DownloadLinkType } from "../types";

type DownloadLinkProps = {
  link: DownloadLinkType;
};

export default function DownloadLink({ link }: DownloadLinkProps) {
  return (
    <li>
      <a
        href={link.url}
        download={link.name}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-sm font-medium transition hover:border-primary/60 hover:bg-primary/10"
      >
        <ArrowDownToLine className="h-4 w-4" />
        <span className="truncate">{link.name}</span>
      </a>
    </li>
  );
}
