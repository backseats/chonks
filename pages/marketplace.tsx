import { ConnectKitButton } from "connectkit";
import { TokenboundClient } from "@tokenbound/sdk";
import { useWalletClient, useReadContract, useAccount } from "wagmi";
import { mainContract, mainABI } from "../contract_data";
import { baseSepolia } from "wagmi/chains";
import { encodeFunctionData } from "viem";

export default function Marketplace() {
  // const { address } = useAccount();

  // const { data: walletClient } = useWalletClient();
  // const tokenboundClient = new TokenboundClient({
  //   walletClient,
  //   chainId: baseSepolia.id,
  // });

  // const { data: allTraitTokenIds } = useReadContract({
  //   address: mainContract,
  //   abi: mainABI,
  //   functionName: "walletOfOwner",
  //   args: [address],
  //   chainId: baseSepolia.id,
  // }) as { data: BigInt[] };

  // const getTokenboundAccount = (id: string) => {
  //   return tokenboundClient.getAccount({
  //     tokenContract: mainContract,
  //     tokenId: id,
  //   });
  // };

  // const encodedData = () => {
  //   return encodeFunctionData({
  //     abi: mainABI,
  //     functionName: "setApprovalForAll",
  //     args: [address, true], // this should be the marketplace contract address
  //   });
  // };

  // return (
  //   <>
  //     <div className="w-full py-4 h-[80px] flex justify-end border-b border-gray-300">
  //       <div className="w-[1200px] flex justify-end mx-auto">
  //         <ConnectKitButton />
  //       </div>
  //     </div>

  //     <div className="w-[1200px] mx-auto">
  //       <p className="font-bold">Body IDs owned</p>
  //       {allTraitTokenIds?.map((tokenId) => (
  //         <div key={tokenId.toString()}>{tokenId.toString()}</div>
  //       ))}

  //       <p className="mt-8 font-bold">TBAs</p>
  //       {allTraitTokenIds?.map((tokenId) => (
  //         <div key={tokenId.toString()}>
  //           {tokenId.toString()}: {getTokenboundAccount(tokenId.toString())}
  //         </div>
  //       ))}

  //       {allTraitTokenIds.length > 0 && (
  //         <button
  //           className="bg-blue-500 text-white px-4 py-2 rounded-md"
  //           onClick={() => {
  //             tokenboundClient.execute({
  //               account: getTokenboundAccount(allTraitTokenIds[0].toString()),
  //               to: mainContract,
  //               value: 0n,
  //               data: encodedData(),
  //               chainId: baseSepolia.id,
  //             });
  //           }}
  //         >
  //           setApprovalForAll as first TBA
  //         </button>
  //       )}
  //     </div>
  //   </>
  // );
}
// then try to log in and connect as one of the tbas
