import React, { useState, useRef, useEffect } from "react";
import { ConnectKitButton } from "connectkit";
import Image from "next/image";
import Link from "next/link";
import { Bars4Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";

interface Props {}

export default function MenuBar(props: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownHeight, setDropdownHeight] = useState<number>(0);
  const pathname = usePathname();
  const isProfilePage = pathname === "/profile";
  const { isConnected } = useAccount();

  useEffect(() => {
    if (dropdownRef.current) {
      const height = isMenuOpen ? dropdownRef.current.scrollHeight : 0;
      setDropdownHeight(height);
    }
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav
      id="top"
      className="w-full flex justify-between px-4 sm:px-[3.45vw] py-4 bg-white relative"
    >
      <div>
        <Link href="/" className="hover:opacity-80 transition-opacity">
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

      <div className="hidden md:flex gap-8 items-center font-source-code-pro text-[15px] font-weight-600">
        <Link
          href="/market"
          className="hover:opacity-80 transition-opacity hover:underline"
        >
          Market
        </Link>

        <Link
          href="/studio"
          className="hover:opacity-80 transition-opacity hover:underline"
        >
          Studio
        </Link>

        {isConnected && !isProfilePage && (
          <>
            <div> | </div>
            <Link
              href="/profile"
              className="hover:opacity-80 transition-opacity hover:underline"
            >
              My Chonks
            </Link>
          </>
        )}
      </div>

      <div
        className="sm:hidden text-[16px] mt-[10px] cursor-pointer relative h-6 w-6"
        onClick={toggleMenu}
      >
        {isMenuOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars4Icon className="h-6 w-6" />
        )}
      </div>

      {/* Dropdown Menu for Mobile */}
      <div
        ref={dropdownRef}
        className="absolute top-full left-0 right-0 bg-white sm:hidden border-t border-gray-200 shadow-lg z-50 overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: `${dropdownHeight}px`,
          opacity: dropdownHeight > 0 ? 1 : 0,
          visibility: dropdownHeight > 0 ? "visible" : "hidden",
        }}
      >
        <div className="flex flex-col font-source-code-pro text-[15px] font-weight-600 text-right">
          <Link
            href="/market"
            className="px-4 py-3 hover:bg-gray-100 border-b border-gray-200"
          >
            Market
          </Link>

          <Link
            href="/studio"
            className="px-4 py-3 hover:bg-gray-100 border-b border-gray-200"
          >
            Studio
          </Link>

          {isConnected && !isProfilePage && (
            <Link
              href="/profile"
              className="px-4 py-3 hover:bg-gray-100 border-b border-gray-200"
            >
              My Chonks
            </Link>
          )}

          <div className="px-4 py-3 flex justify-end">
            {/* TODO: dropdown menu here for mobile */}
            <ConnectKitButton
              label="Sign In"
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
                "--ck-connectbutton-font-size": "14px",
              }}
            />
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
        <ConnectKitButton
          // theme="web"
          label="Sign In"
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
            "--ck-connectbutton-font-size": "14px",
          }}
        />
      </div>
    </nav>
  );
}
