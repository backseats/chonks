import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { GET_CHONK_BY_ID } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";

export const config = {
  runtime: "edge",
};

// Simple logging function
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] OG-Fallback: ${message}`, data || "");
};

// Helper function to decode Base64
function decodeBase64(base64String: string): string {
  // The Edge runtime supports atob natively
  const base64 = base64String.split(",")[1] || base64String;
  return atob(base64);
}

export default async function handler(req: NextRequest) {
  // Get Chonk ID from query parameters
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  log(`Generating fallback OG image for Chonk #${id}`);

  if (!id) {
    log(`No ID provided`);
    // Create error image
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
            backgroundColor: "#FF4444",
            color: "white",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              textAlign: "center",
              margin: "30px",
            }}
          >
            Error
          </div>
          <div
            style={{
              fontSize: "32px",
              textAlign: "center",
              margin: "20px",
            }}
          >
            Invalid or missing ID parameter
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=60",
        },
      }
    );
  }

  try {
    // Fetch Chonk data from GraphQL
    log(`Fetching GraphQL data for Chonk #${id}`);
    const { data } = await client.query({
      query: GET_CHONK_BY_ID,
      variables: { id },
    });

    if (!data || !data.chonk) {
      log(`No data found for Chonk #${id}`);
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
              backgroundColor: "#0F6E9D",
              color: "white",
              fontFamily: "sans-serif",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                fontWeight: "bold",
                textAlign: "center",
                margin: "30px",
              }}
            >
              Chonk Not Found
            </div>
            <div
              style={{
                fontSize: "32px",
                textAlign: "center",
                margin: "20px",
              }}
            >
              #{id}
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=60",
          },
        }
      );
    }

    log(`Data retrieved for Chonk #${id}`);

    // Extract metadata
    let name = `Chonk #${id}`;
    let imageUrl = null;

    if (
      data.chonk.chonkMetaData &&
      data.chonk.chonkMetaData.startsWith("data:application/json;base64,")
    ) {
      try {
        // Use the helper function instead of Buffer
        const jsonStr = decodeBase64(data.chonk.chonkMetaData);
        const parsedData = JSON.parse(jsonStr);

        if (parsedData.name) {
          name = parsedData.name;
        }

        // Check if we have a direct image URL
        if (parsedData.image) {
          imageUrl = parsedData.image;
          log(`Found image URL in metadata: ${imageUrl.substring(0, 50)}...`);
        }
      } catch (error) {
        log(`Error parsing metadata: ${error}`);
      }
    }

    // If we have an image URL, try to fetch and use it
    if (imageUrl) {
      try {
        log(`Attempting to fetch image from metadata URL`);
        const imageResponse = await fetch(imageUrl);

        if (imageResponse.ok) {
          const contentType = imageResponse.headers.get("Content-Type");
          log(`Received response with content type: ${contentType}`);

          if (contentType && contentType.startsWith("image/")) {
            // Skip SVG images and always generate PNG instead for better compatibility
            if (contentType !== "image/svg+xml") {
              // We got a valid raster image, return it directly
              log(`Returning the image directly from metadata URL`);
              return new Response(imageResponse.body, {
                headers: {
                  "Content-Type": contentType,
                  "Cache-Control": "public, max-age=86400, s-maxage=86400",
                },
              });
            }
            log(`Found SVG image, converting to PNG for better compatibility`);
            // Continue to fallback image generation
          }
        }
      } catch (error) {
        log(`Error fetching image: ${error}`);
        // Continue to fallback image generation
      }
    }

    // Create a basic OG image using the name
    log(`Generating fallback image with name: ${name}`);
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
            backgroundColor: "#0F6E9D",
            color: "white",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              textAlign: "center",
              margin: "30px",
              padding: "0 50px",
              wordBreak: "break-word",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: "32px",
              textAlign: "center",
              margin: "20px",
              opacity: 0.8,
            }}
          >
            Generated on Backseats
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
          "Content-Type": "image/png",
        },
      }
    );
  } catch (error) {
    log(`Error generating OG image: ${error}`);

    // If all else fails, return a very basic error image
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
            backgroundColor: "#0F6E9D",
            color: "white",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              textAlign: "center",
              margin: "20px",
            }}
          >
            Chonk #{id}
          </div>
          <div
            style={{
              fontSize: "24px",
              textAlign: "center",
              marginTop: "10px",
            }}
          >
            (Image Unavailable)
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=60",
        },
      }
    );
  }
}
