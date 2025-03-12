import { useAccount } from "wagmi";
import WithdrawBidButton from "./WithdrawBidButton";

interface Props {
  chonkId: number;
  hasOffer: boolean;
  onMakeOffer: () => void;
  onSuccess: () => void;
}

export default function MakeCancelOfferButton({
  chonkId,
  hasOffer,
  onMakeOffer,
  onSuccess,
}: Props) {
  const { address } = useAccount();

  // Only used for the "Make an Offer" button
  const baseStyle = "w-full py-2 px-4 transition-colors text-white";
  const makeOfferStyle = `${baseStyle} bg-chonk-blue hover:bg-chonk-orange hover:text-black`;

  if (hasOffer) {
    return (
      <WithdrawBidButton
        chonkId={chonkId}
        address={address}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <button className={makeOfferStyle} onClick={onMakeOffer}>
      Make an Offer
    </button>
  );
}
