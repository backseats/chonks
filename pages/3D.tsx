import React from "react";
import Head from "next/head";
import MenuBar from "@/components/mint/MenuBar";
import Footer from "@/components/layout/Footer";
import { Canvas } from "@react-three/fiber";
import ThreeDExporter from "@/components/3D/3DExporter";

export default function ThreeD() {
  return (
    <>
      <Head>
        <title>Export a 3D Chonk - Chonks</title>
        <meta name="description" content="Welcome to my homepage" />
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

      <div className="min-h-screen w-full text-black font-source-code-pro font-weight-600 text-[3vw] md:text-[1.5vw]">
        <MenuBar />

        <main className="w-full border-t border-gray-300 ">
          <div
            style={{
              width: "100%",
              height: "80vh",
              position: "relative",
              marginRight: "auto",
            }}
          >
            {/* <div className="leva-container">
                        <Leva oneLineLabels collapsed={false} />
                    </div> */}
            <Canvas
              shadows
              camera={{ position: [-10, 10, 30] }}
              onPointerMissed={() => {
                console.log("You missed!");
              }}
            >
              {/* <directionalLight position={[3.3, 1.0, 4.4]} intensity={4} /> */}

              {/* <PixelBoard /> */}
              <ThreeDExporter />
            </Canvas>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
