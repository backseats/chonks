import Head from "next/head";
import Image from "next/image";
import Lenis from "@studio-freight/lenis";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import SplitType from "split-type";
import Chonk3d from "../components/home/Chonk3d";
import Footer from "../components/layout/Footer";
import LFC from "../components/layout/LFC";
import Team from "../components/home/Team";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import MenuBar from "@/components/MenuBar";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const { isConnected } = useAccount();
  const heroRef = useRef<HTMLHeadingElement>(null);
  const gridSectionRef = useRef<HTMLElement>(null);
  const chonkAppearRef = useRef<HTMLElement>(null);
  const chonkRotateRef = useRef<HTMLElement>(null);
  const [chonkOpacity, setChonkOpacity] = useState(0);
  const [chonkPosY, setChonkPosY] = useState(0);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [chonkRotate, setChonkRotate] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const tba1Ref = useRef<HTMLDivElement>(null);
  const tba2Ref = useRef<HTMLDivElement>(null);
  const tba3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // document.body.classList.add( 'overflow-x-hidden');

    const lenis = new Lenis({
      duration: 2, // Default is 1.2 - higher number = slower scroll
      smoothWheel: true,
      wheelMultiplier: 0.8, // Default is 1 - lower number = slower scroll
      lerp: 0.1, // Default is 0.1 - lower number = smoother/slower scroll
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Call init function after the page has loaded
    init();

    // Add this new effect for the overlay
    const timer = setTimeout(() => {
      setOverlayOpacity(0);
      // Set another timeout to remove the overlay completely
      setTimeout(() => setShowOverlay(false), 1000);
    }, 1000);

    // Horizontal scroll effect
    if (horizontalScrollRef.current) {
      const horizontalSection = horizontalScrollRef.current;
      const horizontalContent = horizontalSection.querySelector(
        ".horizontal-content"
      );

      if (horizontalContent) {
        gsap.to(horizontalContent, {
          x: () => -(horizontalContent.scrollWidth - window.innerWidth / 2),
          ease: "none",
          scrollTrigger: {
            trigger: horizontalSection,
            start: "top top",
            end: () =>
              `+=${horizontalContent.scrollWidth - window.innerWidth / 2}`,
            scrub: true,
            pin: true,
            anticipatePin: 1,
          },
        });
      }
    }

    // Marquee animation
    const marqueeWrapper = document.querySelector(".marquee-wrapper");
    if (marqueeWrapper) {
      const marqueeText = document.querySelector(".marquee-text");
      if (marqueeText) {
        // Clone the text and append it
        const clone = marqueeText.cloneNode(true);
        marqueeWrapper.appendChild(clone);
      }

      gsap.to(".marquee-text", {
        x: "-100%",
        repeat: -1,
        duration: 25,
        ease: "none",
        modifiers: {
          x: gsap.utils.unitize((x) => parseFloat(x) % 100),
        },
      });
    }

    // Add new scroll trigger animation for TBA section
    if (tba1Ref.current && tba2Ref.current && tba3Ref.current) {
      const tlTBA = gsap.timeline({
        scrollTrigger: {
          trigger: "#tbas",
          start: "top 30%",
          end: "top 0%",
          scrub: 1,

          // markers: true,
          onLeaveBack: () => {
            // console.log("tlTBAs on LeaveBack");
          },
        },
      });

      tlTBA
        .to(
          tba1Ref.current,
          {
            x: +20,
            opacity: 1,
          },
          0
        )
        .to(
          tba2Ref.current,
          {
            x: +20,
            opacity: 1,
            delay: 0.5,
          },
          0
        )
        .to(
          tba3Ref.current,
          {
            // y: +20,
            opacity: 1,
            delay: 1,
          },
          0
        );
    }

    return () => {
      lenis.destroy();
      clearTimeout(timer);
      // document.body.classList.remove('overflow-x-hidden');
    };
  }, []);

  const init = () => {
    if (heroRef.current) {
      gsap.set(heroRef.current, { opacity: 1 }); // Set the h1 to visible

      const splitText = new SplitType(heroRef.current, { types: "words" });

      gsap.from(splitText.words, {
        opacity: 0,
        scale: 2,
        z: 500, // Add depth perspective
        transformOrigin: "center center",
        perspective: 1000,
        duration: 0.25,
        stagger: 0.5,
        ease: "elastic.inOut",
        delay: 1.5,
      });
    }
  };

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    e.preventDefault();
    const element = document.querySelector(sectionId);
    if (element && lenisRef.current) {
      (lenisRef.current as any).scrollTo(element, { offset: 0 });
    }
  };

  return (
    <>
      <Head>
        <title>CHONKS - Chonkie Characters Onchain</title>
        <meta
          name="description"
          content="Chonks is a PFP project, customizable with swappable traits, fully onchain on Base"
        />
        <meta
          property="og:image"
          content="https://www.chonks.xyz/marka/marka-chonk.png"
        />
        <meta content="720" property="og:image:width" />
        <meta content="720" property="og:image:height" />
        <meta
          property="og:title"
          content="CHONKS - Chonkie Characters Onchain"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.chonks.xyz`} />
        <meta
          property="og:description"
          content="Chonks is a PFP project, customizable with swappable traits, fully onchain on Base"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Chonksxyz" />
        <meta
          name="twitter:title"
          content="CHONKS - Chonkie Characters Onchain"
        />
        <meta
          name="twitter:description"
          content="Chonks is a PFP project, customizable with swappable traits, fully onchain on Base"
        />
        <meta
          name="twitter:image"
          content="https://www.chonks.xyz/marka/marka-chonk.png"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <div className="min-h-screen w-full text-black font-source-code-pro font-weight-600 text-[3vw] sm:text-[1.5vw]">
        {/*
         ***************************************************
         ************************ HEAD *********************
         ***************************************************
         */}

        {/*
         ***************************************************
         ************************ NAV **********************
         ***************************************************
         */}

        <nav
          id="top"
          className="w-full flex justify-between px-4 py-4 bg-white"
        >
          <div>
            <h1 className=" text-5xl md:text-2xl font-bold cursor-pointer flex items-center gap-1">
              <Image
                src="/chonks-logo.svg"
                alt="Chonks"
                width={48}
                height={48}
                className="h-12 md:h-12 w-auto"
              />
            </h1>
          </div>
          <div className="hidden md:flex gap-8 items-center font-source-code-pro text-sm font-weight-600">
            <a
              href="#intro"
              onClick={(e) => scrollToSection(e, "#intro")}
              className="hover:opacity-70 transition-opacity"
            >
              Intro
            </a>
            <a
              href="#tbas"
              onClick={(e) => scrollToSection(e, "#tbas")}
              className="hover:opacity-70 transition-opacity"
            >
              Token Bound Accounts
            </a>

            <a
              href="#studio"
              onClick={(e) => scrollToSection(e, "#studio")}
              className="hover:opacity-70 transition-opacity"
            >
              Studio
            </a>
            <a
              href="#marketplace"
              onClick={(e) => scrollToSection(e, "#marketplace")}
              className="hover:opacity-70 transition-opacity"
            >
              Market
            </a>
            <a
              href="#team"
              onClick={(e) => scrollToSection(e, "#team")}
              className="hover:opacity-70 transition-opacity"
            >
              Team
            </a>
          </div>

          <div className="flex gap-2 mt-[4px] sm:mt-1">
            <Link
              href="/market"
              className="hover:opacity-70 transition-opacity"
            >
              <button className="px-4 py-[11px] mt-[1px] sm:mt-[1px] bg-[#007DAB] text-white font-source-code-pro text-xs">
                Market
              </button>
            </Link>

            {isConnected ? (
              <Link
                href="/profile"
                className="hover:opacity-70 transition-opacity"
              >
                <button className="px-4 py-[11px] mt-[1px] sm:mt-[1px] bg-black text-white font-source-code-pro text-xs">
                  My Chonks
                </button>
              </Link>
            ) : (
              <ConnectKitButton
                label="Sign In"
                customTheme={{
                  "--ck-font-family": "'Source Code Pro', monospace",
                  "--ck-primary-button-background": "#2F7BA7",
                  "--ck-primary-button-hover-background": "#FFFFFF",
                  "--ck-primary-button-hover-color": "#2F7BA7",
                  "--ck-primary-button-border-radius": "0px",
                  "--ck-primary-button-font-weight": "400",
                  "--ck-connectbutton-background": "#2F7BA7",
                  "--ck-connectbutton-hover-background": "#63A4C4",
                  "--ck-connectbutton-hover-color": "#FFFFFF",
                  "--ck-connectbutton-border-radius": "0px",
                  "--ck-connectbutton-color": "#FFFFFF",
                  "--ck-connectbutton-font-weight": "400",
                  "--ck-connectbutton-font-size": "12px",
                }}
              />
            )}
          </div>
        </nav>

        <main className="w-full overflow-x-hidden">
          {/* guide lines, deploy: remove */}
          {/* <div className="fixed inset-0 pointer-events-none z-50">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black"></div>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-black"></div>
          </div> */}

          <div className="mx-[20px] sm:mx-[6.9vw]">
            {" "}
            {/* EDGES */}
            {/*
             ***************************************************
             ************************ HERO *********************
             ***************************************************
             */}
            <section
              id="hero"
              className={`hero borderTopFull border-l border-r h-[50vh] md:h-[100vh] flex items-center bg-white`}
            >
              <h1
                ref={heroRef}
                className="font-source-code-pro text-[12vw] font-weight-600 mx-[3.45vw] font-bold"
              >
                CHONKIE CHARACTERS ONCHAIN
              </h1>
            </section>
            {/*
             ***************************************************
             ************* BLANK FULL DEPTH SECTION ************
             ***************************************************
             */}
            <section
              ref={chonkAppearRef}
              className={`chonkAppear borderTopFull border-l border-r h-[100vh] md:h-[200vh] `}
            >
              {/* Content of the section */}
            </section>
            {/*
             ***************************************************
             **************** FULL WIDTH SECTION ***************
             ***************************************************
             */}
            <section
              id="intro"
              className={`border-t border-l border-r py-[6.9vw] bg-[#0D6E9D] text-white `}
            >
              <h2 className="font-source-code-pro text-[5.175vw] md:text-[3.4vw] leading-[1.4] font-weight-600 mx-[3.3vw] py-[3.3vw]">
                Chonks is a PFP project, customizable with swappable traits,
                fully onchain on Base.
              </h2>
            </section>
            {/*
             ***************************************************
             **************** 50/50 SECTION ******************
             ***************************************************
             */}
            <section
              className={`flex flex-col sm:flex-row border-t border-l border-r backdrop-blur-[5px] `}
            >
              <div className={`sm:w-1/2 px-[3.45vw] py-[6.9vw] sm:border-r `}>
                <p>
                  Using the ERC-6551 standard - Token Bound Accounts - your
                  Chonk holds all of its Traits which you can put on and take
                  off at any time to customize your Chonk!
                </p>
              </div>
              <div
                className={`sm:w-1/2 px-[3.45vw] pb-[3.45vw] md:py-[6.9vw] p-4  `}
              >
                <p>
                  Mint, collect, and trade Traits whenever you like on the{" "}
                  <a
                    href="https://chonkx.xyz/market"
                    target="_blank"
                    className="underline text-[#0D6E9D] hover:no-underline"
                  >
                    Chonks Market
                  </a>
                  , our custom marketplace built specifically for Chonks and
                  TBAs.
                </p>
              </div>
            </section>
            <section
              className={`chonkMouse borderTopFull border-l border-r h-[50vh] md:h-[100vh]`}
            >
              <div className="absolute bottom-0 right-0 text-[0.8vw] opacity-20 p-[3.45vw]">
                hello there sexy - move your mouse ;)
              </div>
            </section>
            <section
              id="tbas"
              className="border-t border-l border-r py-[13.8vw] bg-white"
            >
              <div className="mb-[3.45vw] md:mb-[1vw]">
                <h2 className="font-source-code-pro text-[4vw] font-weight-600 mx-[3.45vw] mb-[3.45vw]">
                  Token Bound Accounts
                </h2>
              </div>

              {/* Main container with flex column on mobile, row on desktop */}
              <div className="flex flex-col md:flex-row">
                {/* Top row / Left section */}
                <div className="flex-1 flex justify-center mb-[6.9vw] md:mb-0">
                  {/* Column 1 */}
                  <div
                    ref={tba1Ref}
                    className="opacity-0 translate-x-[-100]  w-[50] md:w-[18vw] flex flex-col items-center text-center justify-center mt-[0.55vw]"
                  >
                    <h3 className="text-[3vw] md:text-[1vw] mb-4 mx-[3.45vw] md:mx-0">
                      Token Bound Account
                    </h3>
                    <Image
                      src="/skinTone1.svg"
                      alt="Token Bound Account"
                      width={200}
                      height={200}
                      className="w-[20vw] h-[20vw] md:w-[10vw] md:h-[10vw] bg-[#0d6e9d]"
                    />
                    <div className="flex mt-4">
                      <div className="w-[2vw] h-[2vw] bg-[#EFB15E]"></div>
                      <div className="w-[2vw] h-[2vw] bg-[#BA8136]"></div>
                      <div className="w-[2vw] h-[2vw] bg-[#8A5E24]"></div>
                      <div className="w-[2vw] h-[2vw] bg-[#EAD9D9]"></div>
                      <div className="w-[2vw] h-[2vw] bg-[#493213]"></div>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div
                    ref={tba2Ref}
                    className="opacity-0 w-[50] md:w-[28vw] flex flex-col items-center text-center justify-center relative mt-[0.5vw]"
                  >
                    <h3 className="text-[3vw] md:text-[1vw] mb-4 mx-[3.45vw]  md:mx-0">
                      A Fully Dressed Chonk
                    </h3>
                    <Image
                      src="/marka/marka-transparent-chonk.svg"
                      alt="Fully Dressed Chonk"
                      width={200}
                      height={200}
                      className="w-[20vw] h-[20vw] md:w-[10vw] md:h-[10vw] bg-[#0d6e9d]"
                    />
                    <div className="flex mt-4">
                      <div className="w-[2vw] h-[2vw] bg-[#FFFFFF]"></div>
                    </div>
                    {/* Horizontal line only visible on desktop */}
                    <div className="hidden md:block absolute right-0 top-1/2 w-[calc(50%-5vw)] h-px bg-gray-300"></div>
                  </div>
                </div>

                {/* Bottom row / Right section */}
                <div
                  ref={tba3Ref}
                  className="opacity-0 flex-1 grid grid-cols-1 md:grid-cols-1 gap-[3.45vw] px-[3.45vw] md:px-0 relative"
                >
                  <div className="absolute hidden md:block left-[5vw] top-[5vw] bottom-[5vw] w-px bg-gray-300 z-[1]"></div>

                  {/* Item 1 */}
                  <div className="flex items-center gap-4  relative z-[1] mr-[1.725vw]">
                    <Image
                      src="/marka/marka-hoodie-ghost-chonk.svg"
                      alt="Trait 1"
                      width={200}
                      height={200}
                      className="w-[20vw] h-[20vw] md:w-[10vw] md:h-[10vw] bg-[#0d6e9d]"
                    />
                    <span className="text-[3vw] md:text-[1vw]">
                      Each collectible trait is a separate ERC-721
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center gap-4 relative z-[1] mr-[1.725vw]">
                    <Image
                      src="/marka/marka-pants-ghost-chonk.svg"
                      alt="Trait 2"
                      width={200}
                      height={200}
                      className="w-[20vw] h-[20vw] md:w-[10vw] md:h-[10vw] bg-[#0d6e9d]"
                    />
                    <span className="text-[3vw] md:text-[1vw]">
                      Held by the Body NFT Token
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center gap-4 relative z-[1] mr-[1.725vw]">
                    <Image
                      src="/marka/marka-shoes-ghost-chonk.svg"
                      alt="Trait 3"
                      width={200}
                      height={200}
                      className="w-[20vw] h-[20vw] md:w-[10vw] md:h-[10vw] bg-[#0d6e9d]"
                    />
                    <span className="text-[3vw] md:text-[1vw]">
                      Tradable together with the Body or individually on the
                      Chonks Market
                    </span>
                  </div>
                </div>
              </div>
            </section>
            {/*
             ***************************************************
             ****************** Scroll Gallery *****************
             ***************************************************
             */}
            <section
              id="gallery"
              ref={horizontalScrollRef}
              className="border-t border-l border-r overflow-hidden bg-gray-100 text-white h-[100vh] md:h-[100vh] "
            >
              <div className="horizontal-content flex items-center h-full">
                <div className="flex-shrink-0 mx-[3.45vw] first:ml-[6.9vw] last:mr-[6.9vw]">
                  <div className="w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] bg-gray-200 border border-white hover:bg-gray-300 transition-colors duration-300 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/chonks/chonk1.png"
                      alt={`Chonk 1}`}
                      width={3000}
                      height={3000}
                      loading="eager"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* <p className="mt-4 text-center">Image {index + 1}</p> */}
                </div>

                <div className="flex-shrink-0 mx-[3.45vw] first:ml-[6.9vw] last:mr-[6.9vw]">
                  <div className="w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] bg-gray-200 border border-white hover:bg-gray-300 transition-colors duration-300 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/chonks/chonk2.png"
                      alt={`Chonk 2}`}
                      width={3000}
                      height={3000}
                      loading="eager"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* <p className="mt-4 text-center">Image {index + 1}</p> */}
                </div>

                <div className="flex-shrink-0 mx-[3.45vw] first:ml-[6.9vw] last:mr-[6.9vw]">
                  <div className="w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] bg-gray-200 border border-white hover:bg-gray-300 transition-colors duration-300 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/chonks/chonk3.png"
                      alt={`Chonk 3}`}
                      width={3000}
                      height={3000}
                      loading="eager"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* <p className="mt-4 text-center">Image {index + 1}</p> */}
                </div>

                <div className="flex-shrink-0 mx-[3.45vw] first:ml-[6.9vw] last:mr-[6.9vw]">
                  <div className="w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] bg-gray-200 border border-white hover:bg-gray-300 transition-colors duration-300 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/chonks/chonk4.png"
                      alt={`Chonk 4}`}
                      width={3000}
                      height={3000}
                      loading="eager"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* <p className="mt-4 text-center">Image {index + 1}</p> */}
                </div>

                <div className="flex-shrink-0 mx-[3.45vw] first:ml-[6.9vw] last:mr-[6.9vw]">
                  <div className="w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] bg-gray-200 border border-white hover:bg-gray-300 transition-colors duration-300 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/chonks/chonk5.png"
                      alt={`Chonk 5}`}
                      width={3000}
                      height={3000}
                      loading="eager"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* <p className="mt-4 text-center">Image {index + 1}</p> */}
                </div>

                <div className="flex-shrink-0 mx-[3.45vw] first:ml-[6.9vw] last:mr-[6.9vw]">
                  <div className="w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] bg-gray-200 border border-white hover:bg-gray-300 transition-colors duration-300 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/chonks/chonk6.png"
                      alt={`Chonk 6}`}
                      width={3000}
                      height={3000}
                      loading="eager"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* <p className="mt-4 text-center">Image {index + 1}</p> */}
                </div>

                <div className="flex-shrink-0 mx-[3.45vw] first:ml-[6.9vw] last:mr-[6.9vw]">
                  <div className="w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] bg-gray-200 border border-white hover:bg-gray-300 transition-colors duration-300 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/chonks/chonk7.png"
                      alt={`Chonk 7}`}
                      width={3000}
                      height={3000}
                      loading="eager"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* <p className="mt-4 text-center">Image {index + 1}</p> */}
                </div>
              </div>
            </section>
            {/* New Video Section */}
            <section
              id="studio"
              className="border-t border-l border-r pt-[13.8vw] bg-white"
            >
              <h2 className="font-source-code-pro text-[6vw] md:text-[4vw] font-weight-600 mx-[3.45vw] mb-[3.45vw]">
                Chonks Studio
              </h2>
              <p className="font-source-code-pro  font-weight-600 mx-[3.45vw] mb-[3.45vw]">
                We&apos;ve built an online Studio so anyone can create a Chonk -{" "}
                <Link
                  href="/studio"
                  target="_blank"
                  className="underline text-[#0D6E9D] hover:no-underline"
                >
                  Give it a spin
                </Link>
                !
              </p>
              <div className="w-full px-[3.45vw]">
                <video
                  className="w-full h-auto"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                >
                  <source src="/chonks-studio.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div
                className={`flex flex-col sm:flex-row border-t border-r  bg-white/50`}
              >
                <div className={`sm:w-1/2 px-[3.45vw] py-[6.9vw] sm:border-r `}>
                  <p>
                    The Studio is open to everyone. Have fun unleashing your
                    Chonks creativity! We can&apos;t wait to see what
                    you&apos;ll make!
                  </p>
                </div>
                <div
                  className={`sm:w-1/2 px-[3.45vw] pb-[3.45vw] md:py-[6.9vw] p-4  `}
                >
                  <p>
                    <i>
                      <strong>Approved Creators</strong>
                    </i>{" "}
                    can use the Studio to deploy their Traits and sell them as
                    part of the official collection in future seasons.
                  </p>
                </div>
              </div>
            </section>
            <section
              ref={chonkRotateRef}
              className={`chonkRotate borderTopFull border-l border-r h-[100vh]`}
            >
              {/* Content of the section */}
            </section>
            <section className=" border-l border-r flex flex-col sm:flex-row h-[100vh] md:h-[200vh]">
              <div className="sm:w-1/2">
                {/* Left column intentionally left empty */}
              </div>
              <div className="sm:w-1/2 px-[3.45vw] py-[6.9vw] bg-white bg-opacity-50 backdrop-blur-[5px] ">
                <h2 className="font-source-code-pro text-[4vw] font-weight-600 mb-[3.3vw]">
                  {/* Both 2d &amp; 3d */}
                  {/* But wait... there&apos;s more! */}
                  Chonks in 3D
                </h2>
                <p>Every Chonk and every Trait comes in 2D and 3D.</p>
                <p>
                  All pixel and voxel data is stored onchain for anyone to use,
                  permissionlessly.
                </p>

                {/* <p>Every Chonk is also 3D.</p>
                <p>Yes, Chonks are both 2D & 3D, oooohhh.</p>
                <p>Not &quot;soon&quot;, not in a year... when you mint a Chonk, it will be both.</p>
                <p>Just like you can change your skin tone and background colour, you can also set your Chonk to render in 3D.</p>
                <p>But under the hood (pun intended), we store both the pixel data AND the voxel data onchain:</p>
                <p>X, Y and colour values for the 2D version....</p>
                <p>X, Y & Z and colour values for the 3D version.</p>
                <p>You can then output your Chonk as 3D if you wish - and we can do fun stuff down the track with games, 3d printing and so much more.</p> */}
                <p className="">
                  Design your Chonk in 3D using the{" "}
                  <a
                    href="https://chonks-voxelator.netlify.app"
                    target="_blank"
                    className="underline text-[#0D6E9D] hover:no-underline"
                  >
                    Chonks Voxelator
                  </a>
                  .
                </p>
                {/* <p className="">
                  Chonks are initially designed as 2d pixel characters in the <i>Chonk Studio</i>. The pixel data is added to the contract as a bytes array: for each pixel, we store the x, y and rgb values.
                </p>
                <p className="">
                  But every Chonk is also stored in the contract as a 3d model. In our 3d studio, or <i>Chonk Ztudio</i> as we like to call it, we take the 2d pixel data and convert it into a 3d model.
                  We again store the bytes but this time we have an extra 'z' value.
                </p>
                <p className="">
                  But every Chonk is also stored in the contract as a 3d model. In our 3d studio, or <i>Chonk Ztudio</i> as we like to call it, we take the 2d pixel data and convert it into a 3d model.
                  We again store the bytes but this time we have an extra 'z' value.
                </p>
                 */}
              </div>
            </section>
            {/* Marketplace Section */}
            <section
              id="marketplace"
              className="border-t border-l border-r pt-[13.8vw] bg-white"
            >
              <div className="mb-[3.45vw] md:mb-[1vw]">
                <h2 className="font-source-code-pro text-[4vw] font-weight-600 mx-[3.45vw] mb-[3.45vw]">
                  Chonks Market
                </h2>
              </div>

              <div className="mx-[3.45vw] font-source-code-pro font-weight-600 ">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <Image
                      src="/bullet.svg"
                      alt="bullet point"
                      width={12}
                      height={12}
                      className="mt-[0.69vw] w-[3vw] h-[3vw] md:w-[0.69vw] md:h-[0.69vw]"
                    />
                    {/* <p>Buy and sell individual Traits to customize your Chonk exactly how you want.</p>
                     */}
                    <p>
                      Buy and sell Chonks and individual Traits. Due to the
                      technical architecture of Chonks and ERC-6551s, leading
                      marketplaces don&apos;t support the functionality we
                      needed, so we built our own.
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <Image
                      src="/bullet.svg"
                      alt="bullet point"
                      width={12}
                      height={12}
                      className="mt-[0.69vw] w-[3vw] h-[3vw] md:w-[0.69vw] md:h-[0.69vw]"
                    />
                    {/* <p>All offers and bids are stored onchain using Base&apos;s low gas fees.</p> */}
                    <p>
                      Buy a Chonk and all of its Traits or collect your favorite
                      Traits to dress your Chonk. It&apos;s all up to you.
                    </p>
                  </div>

                  {/* <div className="flex items-start gap-4">
                    <Image
                      src="/bullet.svg"
                      alt="bullet point"
                      width={12}
                      height={12}
                      className="mt-[0.69vw] w-[3vw] h-[3vw] md:w-[0.69vw] md:h-[0.69vw]"
                    />
                    <p>By using our marketplace, you can be confident in knowing your Chonk will come with the Traits you bidded for.</p>
                  </div> */}

                  <div className="flex items-start gap-4">
                    <Image
                      src="/bullet.svg"
                      alt="bullet point"
                      width={12}
                      height={12}
                      className="mt-[0.69vw] w-[3vw] h-[3vw] md:w-[0.69vw] md:h-[0.69vw]"
                    />
                    <p>
                      Visit{" "}
                      <a
                        href="https://chonks.xyz/market"
                        target="_blank"
                        className="underline text-[#0D6E9D] hover:no-underline"
                      >
                        the Chonks Market
                      </a>{" "}
                      to get started.
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full mt-[3.45vw] py-[3.45vw]">
                <Image
                  src="/chonksmarket.png"
                  alt="Chonks Market"
                  width={3000}
                  height={1688}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </section>
            {/*
             ***************************************************
             ******************* GRID Section ******************
             ***************************************************
             */}
            {/* <section ref={gridSectionRef} className={`gridSection border-t border-l bg-white`}>
              <div className="grid grid-cols-12 h-[50vw]">
                {Array(96).fill(null).map((_, index) => (
                  <div key={index} className="border-b border-r"></div>
                ))}
              </div>
            </section> */}
            {/*
             ***************************************************
             ********************* OUR TEAM ********************
             ***************************************************
             */}
            <Team />
            {/*
             ***************************************************
             **************** LARGE TEXT SECTION ***************
             ***************************************************
             */}
            {/* <section className={`border-t border-l border-r py-[6.9vw] bg-white`}>
              <h2 className="font-source-code-pro text-[4vw] font-weight-600 mx-[3.3vw] py-[3.3vw]">
                This is the end of the website. Write something funny here! Can't think of anything - so have frog chonk peering over the edge.

              </h2>

            </section> */}
            <section
              className={`chonkRotate borderTopFull border-l border-r h-[33vh] bg-white`}
            >
              {/* Content of the section */}
            </section>
          </div>
          {/* end of edges */}

          <LFC />
        </main>

        <Footer scrollToSection={scrollToSection} />
      </div>

      <div className="fixed inset-0 z-[-1]">
        {/* not actually using any of these props in the child anymore */}
        <Chonk3d
          chonkOpacity={1}
          chonkPosY={chonkPosY}
          chonkRotate={chonkRotate}
        />
      </div>

      {/* transition-opacity duration-500 */}
      {showOverlay && (
        <div
          className="fixed inset-0 bg-white z-50"
          style={{ opacity: overlayOpacity }}
        />
      )}
    </>
  );
}
