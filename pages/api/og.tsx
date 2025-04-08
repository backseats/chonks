import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { edgeConfig, mainContract, mainABI } from "@/edge-config";

export const config = {
  runtime: "edge",
};

const convertSvgToPng = async (svgDataUri: string) => {
  const svgText = Buffer.from(svgDataUri.split(",")[1], "base64").toString("utf-8");

  const baseUrl = process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://www.chonks.xyz";

  const res = await fetch(`${baseUrl}/api/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "image/svg+xml",
    },
    body: svgText,
  });

  if (!res.ok) throw new Error("SVG to PNG conversion failed");

  return await res.arrayBuffer(); // PNG buffer
};

export default async function handler(req: NextRequest) {
  const chains = edgeConfig.chains;
  const transports = edgeConfig.transports;

  try {
    // Get Chonk ID
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return new Response("No ID provided", { status: 400 });
    }

    // Create public client
    const client = createPublicClient({
      chain: base,
      transport: http(`${process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL}`),
    });

    // Convert ID to BigInt
    const chonkId = BigInt(idParam);

    // Fetch data from chain
    const dataString = (await client.readContract({
      address: mainContract,
      abi: mainABI,
      functionName: "renderAsDataUri2D",
      args: [chonkId],
    })) as string;

    // console.log("Received data string:", dataString.substring(0, 100) + "...");

    // Process response data
    let imageUrl = "";

    if (dataString.startsWith("data:application/json;base64,")) {
      // Parse base64 encoded JSON
      const base64 = dataString.split(",")[1];
      const jsonStr = atob(base64);
      const data = JSON.parse(jsonStr);

      if (data && data.image) {
        imageUrl = data.image;
      }
    } else if (dataString.startsWith("{")) {
      // Plain JSON
      const data = JSON.parse(dataString);
      if (data && data.image) {
        imageUrl = data.image;
      }
    }

    console.log("Image URL extracted:", imageUrl.substring(0, 100) + "...");

    // Since we need to return an image directly, we'll use the imageUrl if we have it
    if (imageUrl) {
      // If the image URL is a data URI, we can extract and return its content
      // if (imageUrl.startsWith("data:image/")) {
      //   const [, format, base64Data] =
      //     imageUrl.match(/^data:image\/(\w+);base64,(.*)$/) || [];

      //   if (format && base64Data) {
      //     // Decode base64 string using atob and convert to Uint8Array for edge compatibility
      //     const decodedString = atob(base64Data);
      //     const binaryData = new Uint8Array(decodedString.length);
      //     for (let i = 0; i < decodedString.length; i++) {
      //       binaryData[i] = decodedString.charCodeAt(i);
      //     }

      //     return new Response(binaryData.buffer, { // Return ArrayBuffer
      //       headers: {
      //         "Content-Type": `image/${format}`,
      //         "Cache-Control": "public, max-age=60, s-maxage=60",
      //       },
      //     });
      //   }
      // }

      // If it's an external URL, fetch and return it
      try {

        // svg output....
        // const response = await fetch(imageUrl);
        // const imageData = await response.arrayBuffer();
        // const contentType = response.headers.get("Content-Type") || "image/png";

        // return new Response(imageData, {
        //   headers: {
        //     "Content-Type": contentType,
        //     "Cache-Control": "public, max-age=60, s-maxage=60",
        //   },
        // });


        // png output....
        const pngBuffer = await convertSvgToPng(imageUrl);

        return new Response(pngBuffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=60, s-maxage=60",
          },
        });



      } catch (error) {
        console.error("Error fetching image from URL:", error);
      }
    }

    // Fallback to generating an image if we couldn't get or process the image URL
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: "48px",
              textAlign: "center",
              margin: "20px",
            }}
          >
            Chonk #{idParam}
          </div>
          <div
            style={{
              color: "#888",
              fontSize: "24px",
              textAlign: "center",
            }}
          >
            {imageUrl ? "Image processing failed" : "No image data found"}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "cache-control": "public, max-age=60, s-maxage=60",
          "content-type": "image/png",
        },
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);

    // Return a fallback image
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: "32px",
              textAlign: "center",
            }}
          >
            Chonk Image Unavailable
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "cache-control": "public, max-age=10, s-maxage=10",
          "content-type": "image/png",
        },
      }
    );
  }
}
