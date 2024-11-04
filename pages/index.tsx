import Head from 'next/head'
import Image from 'next/image';
import Lenis from '@studio-freight/lenis';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import SplitType from 'split-type';
import Chonk3d from '../components/home/Chonk3d';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function Home() {
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
      const horizontalContent = horizontalSection.querySelector('.horizontal-content');

      if (horizontalContent) {
        gsap.to(horizontalContent, {
          x: () => -(horizontalContent.scrollWidth - window.innerWidth / 2),
          ease: "none",
          scrollTrigger: {
            trigger: horizontalSection,
            start: "top top",
            end: () => `+=${horizontalContent.scrollWidth - window.innerWidth / 2}`,
            scrub: true,
            pin: true,
            anticipatePin: 1,
          }
        });
      }
    }

    // Marquee animation
    const marqueeWrapper = document.querySelector('.marquee-wrapper');
    if (marqueeWrapper) {
      const marqueeText = document.querySelector('.marquee-text');
      if (marqueeText) {
        // Clone the text and append it
        const clone = marqueeText.cloneNode(true);
        marqueeWrapper.appendChild(clone);
      }

      gsap.to('.marquee-text', {
        x: '-100%',
        repeat: -1,
        duration: 25,
        ease: "none",
        modifiers: {
          x: gsap.utils.unitize(x => parseFloat(x) % 100)
        }
      });
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

      const splitText = new SplitType(heroRef.current, { types: 'words' });

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

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
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
        <meta name="description" content="Welcome to my homepage" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
        <link rel="icon" href="/favicon.ico" />
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

        <nav id="top" className="w-full flex justify-between px-4 py-4 bg-white">
          <div >

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
            <a href="#intro" onClick={(e) => scrollToSection(e, '#intro')} className="hover:opacity-70 transition-opacity">
              Intro
            </a>
            <a href="#tbas" onClick={(e) => scrollToSection(e, '#tbas')} className="hover:opacity-70 transition-opacity">
              TBAs
            </a>
            
            <a href="#studio" onClick={(e) => scrollToSection(e, '#tbas')} className="hover:opacity-70 transition-opacity">
              Studio
            </a>
            <a href="#marketplace" onClick={(e) => scrollToSection(e, '#marketplace')} className="hover:opacity-70 transition-opacity">
              Marketplace
            </a>
            <a href="#team" onClick={(e) => scrollToSection(e, '#team')} className="hover:opacity-70 transition-opacity">
              Team
            </a>
          </div>
          
         
            <button
              disabled
              className="px-4 py-2 bg-gray-300 text-gray-600  font-source-code-pro text-sm cursor-not-allowed"
            >
              Mint Soon
            </button>
         
          
        </nav>


        <main className="w-full overflow-x-hidden">

          {/* guide lines, deploy: remove */}
          {/* <div className="fixed inset-0 pointer-events-none z-50">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black"></div>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-black"></div>
          </div> */}

          <div className="mx-[20px] sm:mx-[6.9vw]"> {/* EDGES */}

            {/* 
            ***************************************************
            ************************ HERO *********************
            ***************************************************
            */}

            <section id="hero" className={`hero borderTopFull border-l border-r h-[50vh] md:h-[100vh] flex items-center bg-white`}>
              <h1 ref={heroRef} className="font-source-code-pro text-[12vw] font-weight-600 mx-[3.45vw] font-bold">
                CHONKIE CHARACTERS ONCHAIN
              </h1>
            </section>

            {/* 
            ***************************************************
            ************* BLANK FULL DEPTH SECTION ************
            ***************************************************
            */}

            <section ref={chonkAppearRef} className={`chonkAppear borderTopFull border-l border-r h-[100vh] md:h-[200vh] `}>
              {/* Content of the section */}
              
            
            </section>


            {/* 
            ***************************************************
            **************** FULL WIDTH SECTION ***************
            ***************************************************
            */}



            <section id="intro" className={`border-t border-l border-r py-[6.9vw] bg-[#0D6E9D] text-white `}>
              <h2 className="font-source-code-pro text-[5.175vw] md:text-[3.4vw] leading-[1.4] font-weight-600 mx-[3.3vw] py-[3.3vw]">
                Chonks is a fully onchain customizable PFP collection on Base. <br /><br />Launching in November.
              </h2>

            </section>


            
            {/* 
            ***************************************************
            **************** 50/50 SECTION ******************
            ***************************************************
            */}

            <section  className={`flex flex-col sm:flex-row border-t border-l border-r backdrop-blur-[5px] `}>
              <div className={`sm:w-1/2 px-[3.45vw] py-[6.9vw] sm:border-r `}>
                <p>Using the ERC-661 standard - Token Bound Accounts - your Chonk holds all of its traits which you can put on and take off to customize your Chonk!</p>
              </div>
              <div className={`sm:w-1/2 px-[3.45vw] pb-[3.45vw] md:py-[6.9vw] p-4  `}>
                <p>Mint, collect, and trade Traits whenever you like on the Chonks Marketplace, our custom marketplace built specifically for Chonks & TBAs.</p>
              </div>
            </section>

            <section className={`chonkMouse borderTopFull border-l border-r h-[50vh] md:h-[100vh]`}>
              <div className="absolute bottom-0 right-0 text-[0.8vw] opacity-20 p-[3.45vw]">
                hello there sexy - move your mouse ;)
              </div>
            </section>


            <section id="tbas" className="border-t border-l border-r py-[13.8vw] bg-white">
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
                  <div className="w-[50] md:w-[18vw] flex flex-col items-center text-center justify-center mt-[0.55vw]">
                    <h3 className="text-[3vw] md:text-[1vw] mb-4 mx-[3.45vw] md:mx-0">Token Bound Account</h3>
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
                  <div className="w-[50] md:w-[28vw] flex flex-col items-center text-center justify-center relative mt-[0.5vw]">
                    <h3 className="text-[3vw] md:text-[1vw] mb-4 mx-[3.45vw]  md:mx-0">A Fully Dressed Chonk</h3>
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
                <div className="flex-1 grid grid-cols-1 md:grid-cols-1 gap-[3.45vw] px-[3.45vw] md:px-0 relative">

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
                    <span className="text-[3vw] md:text-[1vw]">Each collectible trait is a separate ERC-721</span>
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
                    <span className="text-[3vw] md:text-[1vw]">Held by the Body NFT Token</span>
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
                    <span className="text-[3vw] md:text-[1vw]">Tradable together with the Body or individually on the Chonks Marketplace</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 
            ***************************************************
            ****************** Scroll Gallery *****************
            ***************************************************
            */}

            <section id="gallery" ref={horizontalScrollRef} className="border-t border-l border-r overflow-hidden bg-gray-100 text-white h-[100vh] md:h-[100vh] ">
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
            <section id="studio" className="border-t border-l border-r pt-[13.8vw] bg-white">
              <h2 className="font-source-code-pro text-[6vw] md:text-[4vw] font-weight-600 mx-[3.45vw] mb-[3.45vw]">
                Chonks Studio
              </h2>
              <p className="font-source-code-pro  font-weight-600 mx-[3.45vw] mb-[3.45vw]">
                We&apos;ve built an online Studio so anyone can create a Chonk.
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
              <div  className={`flex flex-col sm:flex-row border-t border-r  bg-white/50`}>
                <div className={`sm:w-1/2 px-[3.45vw] py-[6.9vw] sm:border-r `}>
                  <p>The Studio will be open to everyone so they can have fun unleashing their Chonk creativity. We can&apos;t wait to see what you will create!</p>
                </div>
                <div className={`sm:w-1/2 px-[3.45vw] pb-[3.45vw] md:py-[6.9vw] p-4  `}>
                  <p><i><strong>Approved Creators</strong></i> will be able to use the Studio to deploy their Traits to the official collection for future Season releases. Simples.</p>
                </div>
              </div>
            </section>


            <section ref={chonkRotateRef} className={`chonkRotate borderTopFull border-l border-r h-[100vh]`}>
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
                <p>Every Chonk also comes in 3D at launch.</p>
                <p>Pixel and voxel data is stored onchain.</p>
                <p>Switch between rendering your Chonk in 2D or 3D whenever you like.</p>
                <p>Newly released Traits will come in 3D as well.</p>

                {/* <p>Every Chonk is also 3D.</p>
                <p>Yes, Chonks are both 2D & 3D, oooohhh.</p>
                <p>Not &quot;soon&quot;, not in a year... when you mint a Chonk, it will be both.</p>
                <p>Just like you can change your skin tone and background colour, you can also set your Chonk to render in 3D.</p>
                <p>But under the hood (pun intended), we store both the pixel data AND the voxel data onchain:</p>
                <p>X, Y and colour values for the 2D version....</p>
                <p>X, Y & Z and colour values for the 3D version.</p>
                <p>You can then output your Chonk as 3D if you wish - and we can do fun stuff down the track with games, 3d printing and so much more.</p> */}
                <p className=""> 
                  <i><strong>Coming Soon: Chonks Ztudio</strong> (it&apos;s a voxel studio, get it?)</i>
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
            <section id="marketplace" className="border-t border-l border-r pt-[13.8vw] bg-white">
              <div className="mb-[3.45vw] md:mb-[1vw]">
                <h2 className="font-source-code-pro text-[4vw] font-weight-600 mx-[3.45vw] mb-[3.45vw]">
                  Chonks Marketplace
                </h2>
                {/* <p className="font-source-code-pro  font-weight-600 mx-[3.45vw]">
                  Inspired by our beloved Cryptopunks, we&apos;ve built a fully onchain marketplace where you can buy & sell Chonks and individual Traits.
                </p> */}
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
                     <p>Buy and sell Chonks and individual Traits. Due to the technical architecture of Chonks, leading marketplaces don’t support the functionality we needed, so we built our own.</p>

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
                    <p>Buy a Chonk and all of its Traits or collect your favorite Traits to dress your Chonk. It&apos;s all up to you.</p>
                  
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
                    <p>More info coming soon.</p>
                  </div>
                </div>

                

              </div>

              <div className="w-full mt-[3.45vw] bg-[#181818] py-[3.45vw]">
                  <Image
                    src="/chonks-market.webp"
                    alt="Chonks Marketplace"
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

            <section id="team" className={`ourTeam border-l border-r flex flex-col justify-center items-center bg-[#0D6E9D] text-white py-[13.8vw]`}>

              <h2 className="font-source-code-pro text-[6vw] font-weight-600 mx-[6.9vw] mb-[3.45vw]  ">
                Our Team
              </h2>
              {/* <p className="font-source-code-pro font-weight-600 mx-[3.45vw] ">
                2 passionate builders, no bullsh*t.
              </p> */}

              <div className='flex flex-col sm:flex-row w-full  justify-center items-center'>
                <div className={`sm:w-1/2 px-[3.45vw] py-[3.45vw] flex flex-col items-center`}>
                  <a href="https://twitter.com/backseats_eth" target="_blank" rel="noopener noreferrer" className="block">
                    <div className="w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] bg-gray-200 border border-white-300 hover:bg-gray-600 transition-colors duration-300 flex items-center justify-center overflow-hidden">
                      <Image
                        src="/backseats/backseats-transparent-chonk.svg"
                        alt="backseats"
                        width={3000}
                        height={3000}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </a>
                  <p className="mt-4"><a className="hover:underline" href="https://twitter.com/backseats_eth" target="_blank" rel="noopener noreferrer">backseats</a></p>
                </div>
                <div className={`sm:w-1/2 px-[3.45vw] py-[6.9vw] flex flex-col items-center`}>
                  <a href="https://twitter.com/marka_eth" target="_blank" rel="noopener noreferrer" className="block">
                    <div className="w-[50vw] h-[50vw] sm:w-[30vw] sm:h-[30vw] bg-gray-200 border border-white-300 hover:bg-gray-600  transition-colors duration-300 flex items-center justify-center overflow-hidden">
                      <Image
                        src="/marka/marka-transparent-chonk.svg"
                        alt="marka"
                        width={3000}
                        height={3000}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </a>
                  <p className="mt-4"><a className="hover:underline" href="https://twitter.com/marka_eth" target="_blank" rel="noopener noreferrer">marka</a></p>
                </div>
              </div>

              <p className="font-source-code-pro text-[2.5vw] md:text-[1.5vw] font-weight-600 mx-[3.45vw] ">
                A special thank you <a href="https://twitter.com/theharveydean" target="_blank" rel="noopener noreferrer" className="underline">Dean Harvey</a>, who designed the original Chonk and many of the Season 1 Traits. Thank you to <a href="https://x.com/NaimePakniyat" target="_blank" rel="noopener noreferrer" className="underline">Naime</a> and <a href="https://x.com/nahidpakniyat" target="_blank" rel="noopener noreferrer" className="underline">Nahid</a>, who helped with additional Season 1 Traits.
              </p>
            </section>

            



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

            <section  className={`chonkRotate borderTopFull border-l border-r h-[33vh] bg-white`}>
              {/* Content of the section */}
            </section>


            </div> 
          {/* end of edges */}


          <section className="bg-black text-white overflow-hidden">
            <div className="marquee-wrapper relative flex whitespace-nowrap my-[3.45vw]">
              <div className="marquee-text inline-flex">
                <span className="font-source-code-pro text-[12vw] font-weight-600 mx-[1.725vw]">
                  LET&apos;S F*CKING CHONK! &nbsp;
                </span>
                <span className="font-source-code-pro text-[12vw] font-weight-600 mx-[1.725vw]">
                  LET&apos;S F*CKING CHONK! &nbsp;
                </span>
              </div>
            </div>
          </section>
        </main>


         {/* <div className="marquee-text flex whitespace-nowrap my-[3.45vw]">
                <span className="font-source-code-pro text-[12vw] font-weight-600 mx-[1.725vw] block">
                LET&apos;S F*CKING CHONK!
                </span>
                
              </div> */}

        {/* 
          ***************************************************
          ********************** FOOTER *********************
          ***************************************************
        */}

        <footer className={`w-full flex flex-col sm:flex-row justify-between px-[3.45vw] py-[3.45vw] border-t text-[2vw] md:text-[1vw] bg-white`}>
          <div className="text-left mb-2 sm:mb-0 flex items-start">
            <a href="#home" onClick={(e) => scrollToSection(e, '#top')} className="hover:opacity-70 transition-opacity">
              <Image
                src="/chonks-head-outline.svg"
                alt="Chonks Head"
                width={48}
                height={48}
                className="h-12 md:h-12 w-auto"
              />
            </a>
            <span className="ml-[3.45vw] md:ml-[1.725vw]">
              Chonks are cc0. <br />
              We&apos;ll have some terms in here... eventually.
            </span>
          </div>
          <div className="text-center sm:text-right my-[3.45vw] md:my-0">
          <a href="https://x.com/chonksxyz" target="_blank" rel="noopener noreferrer" className="hover:underline">Follow us on X - do it!</a>
          </div>
        </footer>

      </div>

      <div className="fixed inset-0 z-[-1]">
        {/* not actually using any of these props in the child anymore */}
        <Chonk3d chonkOpacity={1} chonkPosY={chonkPosY} chonkRotate={chonkRotate} />
      </div>

      {/* transition-opacity duration-500 */}
      {showOverlay && (
        <div
          className="fixed inset-0 bg-white z-50"
          style={{ opacity: overlayOpacity }}
        />
      )}
    </>
  )
}
