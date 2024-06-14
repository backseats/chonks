import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";

export default function Footer() {
  const { address, isConnected } = useAccount();

  return (
    <div
      className={`absolute bottom-0 p-4 border-t-1 w-full border-black-400 border-solid border flex ${
        isConnected ? "justify-end" : ""
      }`}
    >
      <ConnectKitButton />
    </div>
  );
}
