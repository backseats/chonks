import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { mainContract, mainABI } from "@/edge-config";
import { GET_CHONK_BY_ID } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import fs from "fs";
import path from "path";
import ChonkRenderer from "@/components/ChonkRenderer";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  try {
    // Get Chonk ID
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return new Response("No ID provided", { status: 400 });
    }

    // Create public client
    // const client = createPublicClient({
    //   chain: base,
    //   transport: http(`${process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL}`),
    // });

    // Convert ID to string to avoid BigInt serialization issues
    const chonkId = idParam;

    // Fetch data from chain
    // const dataString = (await client.readContract({
    //   address: mainContract,
    //   abi: mainABI,
    //   functionName: "renderAsDataUri2D",
    //   args: [chonkId],
    // })) as string;

    // console.log("Received data string:", dataString.substring(0, 100) + "...");

    const { data } = await client.query({
      query: GET_CHONK_BY_ID,
      variables: { id: chonkId },
    });

    console.log("chonk data:", data.chonk.chonkMetaData);
    if (!data) {
      return new Response("No data found", { status: 400 });
    }

    const dataString = data.chonk.chonkMetaData;

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
    }
    // else if (dataString.startsWith("{")) {
    //   // Plain JSON
    //   const data = JSON.parse(dataString);
    //   if (data && data.image) {
    //     imageUrl = data.image;
    //   }
    // }

    // console.log("Image URL extracted:", imageUrl.substring(0, 100) + "...");

    // Since we need to return an image directly, we'll use the imageUrl if we have it
    if (imageUrl) {
      // If the image URL is a data URI, we can extract and return its content
      // if (imageUrl.startsWith("data:image/")) {
      //   const [, format, base64Data] =
      //     imageUrl.match(/^data:image\/(\w+);base64,(.*)$/) || [];

      //   if (format && base64Data) {
      //     const binaryData = Buffer.from(base64Data, "base64");
      //     console.log("a");
      //     return new Response(binaryData, {
      //       headers: {
      //         "Content-Type": `image/${format}`,
      //         "Cache-Control": "public, max-age=60, s-maxage=60",
      //       },
      //     });
      //   }
      // }

      // If it's an external URL, fetch and return it
      try {
        const response = await fetch(imageUrl);
        const imageData = await response.arrayBuffer();
        const contentType = response.headers.get("Content-Type") || "image/png";

        console.log("b");
        return new Response(imageData, {
          headers: {
            "Content-Type": contentType,
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

    // // Return a fallback image
    // return new ImageResponse(
    //   (
    //     <div
    //       style={{
    //         width: "100%",
    //         height: "100%",
    //         display: "flex",
    //         alignItems: "center",
    //         justifyContent: "center",
    //       }}
    //     >
    //       <div
    //         style={{
    //           color: "white",
    //           fontSize: "32px",
    //           textAlign: "center",
    //         }}
    //       >
    //         Chonk Image Unavailable
    //       </div>
    //     </div>
    //   ),
    //   {
    //     width: 1200,
    //     height: 630,
    //     headers: {
    //       "cache-control": "public, max-age=10, s-maxage=10",
    //       "content-type": "image/png",
    //     },
    //   }
    // );
  }
}
