import { http, createConfig } from "wagmi";
import { baseSepolia, base } from "wagmi/chains";

export const config = createConfig({
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
});
