import type { NextApiRequest, NextApiResponse } from "next";
import { GET_CHONK_BY_ID } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import { ImageResponse } from "@vercel/og";
import { Buffer } from "buffer";

// Set a long timeout for this function since Puppeteer operations can take time
export const config = {
  api: {
    bodyParser: true,
    responseLimit: "10mb",
  },
};

// Enhanced logging function
const log = (message: string, obj?: any) => {
  const timestamp = new Date().toISOString();
  if (obj) {
    console.log(`[${timestamp}] OG-Puppeteer: ${message}`, obj);
  } else {
    console.log(`[${timestamp}] OG-Puppeteer: ${message}`);
  }
};

// Get the site URL for absolute URLs
const getSiteUrl = (req: NextApiRequest): string => {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}`;
};

// Create a fallback image using ImageResponse which returns PNG
const createOGImage = async (id: string, name?: string) => {
  log(`Creating OG image for Chonk #${id}`);

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
          {name || `Chonk #${id}`}
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
    }
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get Chonk ID from query parameters
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    log("Invalid or missing ID parameter");
    // Return a PNG error image
    const errorResponse = await createOGImage("0", "Error: Invalid ID");
    const errorBuffer = await errorResponse.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    return res.status(400).send(Buffer.from(errorBuffer));
  }

  const chonkId = id;
  log(`Starting OG image generation for Chonk #${chonkId}`);

  try {
    // Fetch Chonk data from GraphQL
    log(`Fetching GraphQL data for Chonk #${chonkId}`);

    const { data } = await client.query({
      query: GET_CHONK_BY_ID,
      variables: { id: chonkId },
    });

    if (!data || !data.chonk || !data.chonk.chonkMetaData) {
      log(`No data found for Chonk #${chonkId}`);
      const notFoundResponse = await createOGImage(
        chonkId.toString(),
        "Chonk Not Found"
      );
      const notFoundBuffer = await notFoundResponse.arrayBuffer();
      res.setHeader("Content-Type", "image/png");
      return res.status(404).send(Buffer.from(notFoundBuffer));
    }

    log(`Chonk data retrieved for ID ${chonkId}:`, data.chonk.id);

    // Extract metadata
    let chonkName = `Chonk #${chonkId}`;
    let directImageUrl = null;

    // Parse the chonk metadata
    if (data.chonk.chonkMetaData.startsWith("data:application/json;base64,")) {
      const base64 = data.chonk.chonkMetaData.split(",")[1];
      const jsonStr = Buffer.from(base64, "base64").toString();
      const parsedData = JSON.parse(jsonStr);

      log(`Parsed data keys: ${Object.keys(parsedData)}`);

      // Get the name if available
      if (parsedData.name) {
        chonkName = parsedData.name;
      }

      // Extract the direct image URL if available
      if (parsedData.image) {
        directImageUrl = parsedData.image;
        log(
          `Found direct image URL in metadata: ${directImageUrl.substring(
            0,
            50
          )}...`
        );
      }
    }

    // If we have a direct image URL, try to fetch and return it
    if (directImageUrl) {
      try {
        log(`Attempting to fetch image from direct URL`);
        const imageResponse = await fetch(directImageUrl);

        if (!imageResponse.ok) {
          log(
            `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`
          );
          // Continue to fallback
        } else {
          const contentType = imageResponse.headers.get("Content-Type");
          log(`Received image with content type: ${contentType}`);

          // Check if it's an image
          if (contentType && contentType.startsWith("image/")) {
            // For SVG images, convert to PNG for better compatibility
            if (contentType === "image/svg+xml") {
              log(`Converting SVG to PNG for better compatibility`);
              // Generate a PNG instead using the name
              const pngResponse = await createOGImage(
                chonkId.toString(),
                chonkName
              );
              const pngBuffer = await pngResponse.arrayBuffer();

              // Return PNG with proper headers
              res.setHeader("Content-Type", "image/png");
              res.setHeader(
                "Cache-Control",
                "public, max-age=86400, s-maxage=86400"
              );
              return res.status(200).send(Buffer.from(pngBuffer));
            }

            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

            // Return the image directly
            log(
              `Returning image directly from URL, size: ${imageBuffer.length} bytes with content type: ${contentType}`
            );
            res.setHeader("Content-Type", contentType);
            res.setHeader(
              "Cache-Control",
              "public, max-age=86400, s-maxage=86400"
            );
            return res.status(200).send(imageBuffer);
          } else {
            log(`Content type is not an image: ${contentType}`);
            // Continue to fallback
          }
        }
      } catch (imageError: any) {
        log(`Error fetching direct image: ${imageError.message}`);
        // Continue to fallback
      }
    }

    // Try to use Puppeteer if available (in production)
    try {
      // Dynamic import of puppeteer - will only load if available
      const puppeteer = await import("puppeteer");
      log("Puppeteer successfully imported, using it to generate the image");

      // Launch browser
      const browser = await puppeteer.default.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      try {
        const page = await browser.newPage();

        // Set viewport to OG image dimensions
        await page.setViewport({
          width: 1200,
          height: 630,
          deviceScaleFactor: 1,
        });

        // Generate the HTML content for the OG image
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${chonkName}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  width: 1200px;
                  height: 630px;
                  background-color: #0F6E9D;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                h1 {
                  font-size: 64px;
                  font-weight: bold;
                  text-align: center;
                  margin: 0 0 30px 0;
                  padding: 0 50px;
                  word-break: break-word;
                }
                p {
                  font-size: 32px;
                  text-align: center;
                  margin: 0;
                  opacity: 0.8;
                }
              </style>
            </head>
            <body>
              <h1>${chonkName}</h1>
              <p>Generated on Backseats</p>
            </body>
          </html>
        `;

        await page.setContent(html, { waitUntil: "networkidle0" });

        // Take a screenshot
        const screenshot = await page.screenshot({
          type: "png",
          fullPage: true,
        });

        // Send the image
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
        return res.status(200).send(screenshot);
      } finally {
        await browser.close();
        log("Browser closed");
      }
    } catch (puppeteerError) {
      log(`Puppeteer not available or error: ${puppeteerError}`);
      // Continue to fallback if Puppeteer fails
    }

    // Create a PNG fallback image
    log(`Creating fallback PNG image for ${chonkName}`);
    const fallbackResponse = await createOGImage(chonkId.toString(), chonkName);
    const fallbackBuffer = await fallbackResponse.arrayBuffer();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.status(200).send(Buffer.from(fallbackBuffer));
  } catch (error) {
    log("Error generating OG image:", error);

    // Final fallback
    try {
      const errorResponse = await createOGImage(chonkId.toString(), "Error");
      const errorBuffer = await errorResponse.arrayBuffer();

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=60");
      return res.status(500).send(Buffer.from(errorBuffer));
    } catch (finalError) {
      log("All fallbacks failed:", finalError);
      return res
        .status(500)
        .json({ error: "All image generation methods failed" });
    }
  }
}
