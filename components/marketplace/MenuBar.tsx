import React from "react";
import { ConnectKitButton } from "connectkit";
import Image from 'next/image';

interface Props {

}

export default function MenuBar(props: Props) {

  return (
    <nav id="top" className="w-full flex justify-between px-4 py-4 bg-white">
      <div >

        <a href="/" className="hover:opacity-70 transition-opacity " >
          <h1 className=" text-5xl md:text-2xl font-bold cursor-pointer flex items-center gap-1">
            <Image
              src="/chonks-logo.svg"
              alt="Chonks"
              width={48}
              height={48}
              className="h-12 md:h-12 w-auto"
            />

          </h1>
        </a>
      </div>

      <div className="hidden md:flex gap-8 items-center font-source-code-pro text-sm font-weight-600">

        <a href="/" className="hover:opacity-70 transition-opacity">
          Home
        </a>

       
        <a href="/marketplace" className="hover:opacity-70 transition-opacity underline">
          Marketplace
        </a>

        <a href="/studio" className="hover:opacity-70 transition-opacity">
          Studio
        </a>

      </div>

      <ConnectKitButton />

      {/* <button
          disabled
          className="px-4 py-2 bg-gray-300 text-gray-600  font-source-code-pro text-sm cursor-not-allowed"
      >
          Mint Soon
      </button> */}


    </nav>
  );
}
