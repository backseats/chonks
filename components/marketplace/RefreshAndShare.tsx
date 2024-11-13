import { VscRefresh, VscShare } from "react-icons/vsc";
import { Tooltip } from 'react-tooltip';

export default function RefreshAndShare() {
  return (
    <div className="flex gap-4">
      <button data-tooltip-id="tooltip-refresh" className="border border-black p-2 hover:opacity-30 transition-opacity">
        <VscRefresh />
      </button>
      <button data-tooltip-id="tooltip-share" className="border border-black p-2 hover:opacity-30 transition-opacity">
        <VscShare />
      </button>

      <Tooltip
        id="tooltip-refresh"
        style={{ backgroundColor: "#f2f2f2", color: "#000000", fontSize: "1vw" }}
        content="Refresh metadata"
        place="top"
      />
      <Tooltip
        id="tooltip-share"
        style={{ backgroundColor: "#f2f2f2", color: "#000000", fontSize: "1vw" }}
        content="Share"
        place="top"
      />
    </div>
  );
} 