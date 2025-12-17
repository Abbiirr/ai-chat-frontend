import type { DownloadLink as DownloadLinkType } from "../types";
import "./DownloadLink.css";

type DownloadLinkProps = {
  link: DownloadLinkType;
};

export default function DownloadLink({ link }: DownloadLinkProps) {
  const icon = link.type === "master_summary" ? 'dY"S' : 'dY",';
  return (
    <li>
      <a
        href={link.url}
        download={link.name}
        target="_blank"
        rel="noopener noreferrer"
        className="download-link"
      >
        {icon} {link.name}
      </a>
    </li>
  );
}
