import React from "react";
import { ConnectKitButton } from "connectkit";
import Image from "next/image";
import Link from "next/link";
import { useAccount } from "wagmi";
import MarketplaceConnectKitButton from "./common/MarketplaceConnectKitButton";

interface Props {}

export default function MenuBar(props: Props) {
  const { address, isConnected } = useAccount();

  return (
    <nav id="top" className="w-full flex justify-between px-4 py-4 bg-white">
      <div>
        <Link href="/" className="hover:opacity-70 transition-opacity">
          <h1 className="text-5xl md:text-2xl font-bold cursor-pointer flex items-center gap-1">
            <Image
              src="/chonks-logo.svg"
              alt="Chonks"
              width={48}
              height={48}
              className="h-12 md:h-12 w-auto"
            />
          </h1>
        </Link>
      </div>

      <div className="hidden md:flex gap-8 items-center font-source-code-pro text-sm font-weight-600">
        <Link href="/" className="hover:opacity-70 transition-opacity">
          Home
        </Link>

        <Link
          href="/market"
          className="hover:opacity-70 transition-opacity underline"
        >
          Market
        </Link>

        <Link href="/studio" className="hover:opacity-70 transition-opacity">
          Studio
        </Link>

        <div> | </div>

        <Link href="/profile" className="hover:opacity-70 transition-opacity">
          Your Chonks
        </Link>
      </div>

      <div className="hidden sm:block">
        <ConnectKitButton
          // theme="web"
          customTheme={{
            "--ck-font-family": "'Source Code Pro', monospace",
            "--ck-primary-button-background": "#FFFFFF",
            "--ck-primary-button-hover-background": "#2F7BA7",
            "--ck-primary-button-hover-color": "#FFFFFF",
            "--ck-primary-button-border-radius": "0px",
            "--ck-primary-button-font-weight": "600",
            "--ck-connectbutton-background": "#FFFFFF",
            "--ck-connectbutton-hover-background": "#2F7BA7",
            "--ck-connectbutton-hover-color": "#FFFFFF",
            "--ck-connectbutton-border-radius": "0px",
            "--ck-connectbutton-color": "#000000",
            "--ck-connectbutton-font-weight": "600",
          }}
        />
      </div>
    </nav>
  );
}
