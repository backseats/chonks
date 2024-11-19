import { Address } from "viem";
import { useReadEOAApproval, useReadTBAApproval } from "@/hooks/useApprovalRead";
import { useEOAApprovalWrite } from "@/hooks/useEOAApprovalWrite";
import { useTBAApprovalWrite } from "@/hooks/useTBAApprovalWrite";

interface Props {
  address: Address | undefined;
  tbaAddress: Address;
}

export default function Approvals(props: Props) {
  const { address, tbaAddress } = props;

  const { EOAIsApproved } = useReadEOAApproval(address);
  const { TBAIsApproved } = useReadTBAApproval(tbaAddress);
  const { approveEOAForMarketplace, disconnectEOA } = useEOAApprovalWrite();
  const { approveTBAForMarketplace, disconnectTBA } = useTBAApprovalWrite(tbaAddress);

  const _class = "hover:bg-gray-200 hover:text-black px-4 mr-2 py-2 border border-black"

  return (
    <div className="flex justify-center -mt-4 mb-6">
      <div className="flex flex-col gap-2">
        <button className={_class} onClick={EOAIsApproved ? disconnectEOA : approveEOAForMarketplace}>
          {EOAIsApproved ? "Disconnect Main Wallet Approval" : "Approve Main Wallet For Marketplace"}
        </button>

        <button className={_class} onClick={TBAIsApproved ? disconnectTBA : approveTBAForMarketplace}>
          {TBAIsApproved ? "Disconnect Your TBA's Approval" : "Approve TBA For Marketplace"}
        </button>
      </div>
    </div>
  );
}
