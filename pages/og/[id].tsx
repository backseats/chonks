import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { GET_CHONK_BY_ID } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import { GetServerSidePropsContext } from "next";

// Enhanced console logging
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] OG Page: ${message}`, data);
  } else {
    console.log(`[${timestamp}] OG Page: ${message}`);
  }
};

export default function OgImagePage({ initialId }: { initialId?: string }) {
  const router = useRouter();
  const { id = initialId } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const maxRetries = 3;

  // Add state for Chonk metadata
  const [chonkName, setChonkName] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return; // Wait for ID to be available from router

    const fetchImage = async () => {
      setLoading(true);
      setError(null);

      // Try to get the image directly from metadata first (most efficient)
      try {
        log(`Fetching Chonk #${id} metadata from GraphQL`);

        const { data } = await client.query({
          query: GET_CHONK_BY_ID,
          variables: { id },
        });

        if (!data || !data.chonk) {
          log(`No data found for Chonk #${id}`);
          throw new Error("Chonk not found in database");
        }

        if (
          data.chonk.chonkMetaData &&
          data.chonk.chonkMetaData.startsWith("data:application/json;base64,")
        ) {
          const base64 = data.chonk.chonkMetaData.split(",")[1];
          const jsonStr = Buffer.from(base64, "base64").toString();
          const parsedData = JSON.parse(jsonStr);

          log(
            `Parsed Chonk metadata keys: ${Object.keys(parsedData).join(", ")}`
          );

          // Save name for display purposes
          if (parsedData.name) {
            setChonkName(parsedData.name);
          }

          // Check if we have a direct image URL
          if (parsedData.image) {
            const directImageUrl = parsedData.image;
            log(
              `Found image URL in metadata: ${directImageUrl.substring(
                0,
                50
              )}...`
            );

            // Verify the image URL works
            const imageResponse = await fetch(directImageUrl, {
              method: "HEAD",
            });

            if (
              imageResponse.ok &&
              imageResponse.headers.get("Content-Type")?.startsWith("image/")
            ) {
              log(`Direct image URL is valid, using it`);
              setImageUrl(directImageUrl);
              setLoading(false);

              // Set debug info for transparency
              setDebugInfo({
                source: "direct_metadata",
                imageUrl: directImageUrl,
                contentType: imageResponse.headers.get("Content-Type"),
                status: imageResponse.status,
              });

              return; // Success - exit early
            } else {
              log(
                `Direct image URL validation failed: ${imageResponse.status} ${
                  imageResponse.headers.get("Content-Type") || "unknown type"
                }`
              );
            }
          }
        }

        // If we get here, we couldn't use the direct image and need to fall back to API endpoints
        log(`No usable direct image found, falling back to API endpoints`);
      } catch (err) {
        log(
          `Error getting direct image from metadata: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        // Continue to API fallbacks
      }

      // Functions for using the API endpoints as fallbacks
      const tryFetchImage = async (
        endpoint: string,
        isRetry = false,
        isFallback = false
      ) => {
        try {
          // Create a unique URL to avoid caching
          const cacheBustParam = isRetry ? `&cache=${Date.now()}` : "";
          const apiUrl = `${endpoint}?id=${id}${cacheBustParam}`;

          log(`${isFallback ? "Fallback: " : ""}Fetching from ${apiUrl}`);

          const response = await fetch(apiUrl, {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          });

          log(`Response status: ${response.status}`);

          // Get content type for debugging
          const contentType = response.headers.get("Content-Type");
          log(`Content type: ${contentType || "unknown"}`);

          const responseDebugInfo = {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            contentType,
            isFallback,
            headers: Object.fromEntries(response.headers.entries()),
          };

          // Set debug info for UI
          setDebugInfo(responseDebugInfo);

          if (!response.ok) {
            throw new Error(
              `Failed to fetch image: ${response.statusText} (${response.status})`
            );
          }

          // Check content type to ensure it's an image
          if (!contentType || !contentType.startsWith("image/")) {
            log(`API returned wrong content type: ${contentType}`);

            // Try to parse response to get more information
            try {
              const text = await response.text();
              log(`Response body (first 500 chars): ${text.substring(0, 500)}`);

              // Update debug info with response text
              setDebugInfo({
                ...responseDebugInfo,
                responseBody: text.substring(0, 1000), // First 1000 chars
              });
            } catch (e) {
              log(`Could not read response body: ${e}`);
            }

            throw new Error(`API returned wrong content type: ${contentType}`);
          }

          // If we get here, we have a valid image response
          setImageUrl(apiUrl);
          setLoading(false);

          return true; // Success
        } catch (err) {
          log(
            `${isFallback ? "Fallback: " : ""}Error: ${
              err instanceof Error ? err.message : String(err)
            }`
          );

          if (isFallback) {
            // If we're already using a fallback and it failed, propagate the error
            throw err;
          }

          return false; // Didn't succeed
        }
      };

      try {
        // First, try the puppeteer endpoint
        log(
          `Attempting primary endpoint for Chonk #${id}, retry ${retryCount}`
        );
        const puppeteerSuccess = await tryFetchImage(
          `/api/og-puppeteer`,
          retryCount > 0
        );

        if (puppeteerSuccess) {
          return; // We're done if it worked
        }

        // If the puppeteer endpoint fails, try the fallback
        log(`Primary endpoint failed, trying fallback for Chonk #${id}`);
        const fallbackSuccess = await tryFetchImage(
          `/api/og-fallback`,
          false,
          true
        );

        if (fallbackSuccess) {
          return; // We're done if the fallback worked
        }

        // If we get here, both methods failed
        throw new Error("Both primary and fallback image generation failed");
      } catch (err) {
        log("All image fetching methods failed:", err);

        // If we've already exceeded max retries, show the error
        if (retryCount >= maxRetries) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to fetch image";
          setError(errorMessage);
          setLoading(false);
        } else {
          // Otherwise, increment retry count to trigger another attempt
          setRetryCount((prevCount) => prevCount + 1);
        }
      }
    };

    fetchImage();
  }, [id, retryCount]); // Add retryCount as a dependency to trigger retries

  const handleRetry = () => {
    log("Manual retry initiated");
    setRetryCount(0); // Reset the retry count
    setLoading(true); // Start loading again
    setDebugInfo(null); // Clear debug info
  };

  const handleUseDirectImageUrl = () => {
    log("Using fallback image URL");
    // Try the fallback endpoint instead
    const directImageUrl = `/api/og-fallback?id=${id}`;
    setImageUrl(directImageUrl);
    setLoading(false);
    setError(null);
  };

  if (!id) {
    return <div className="p-8">Loading...</div>;
  }

  // Generate the absolute URL for the OG image
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  // If the image URL is already absolute (starts with http), use it directly
  const fullImageUrl = imageUrl?.startsWith("http")
    ? imageUrl
    : `${siteUrl}${imageUrl?.startsWith("/") ? "" : "/"}${imageUrl || ""}`;

  // Use Chonk name if available, otherwise use ID
  const displayName = chonkName || `Chonk #${id}`;

  return (
    <div className="p-8">
      <Head>
        <title>{displayName} - OG Image</title>
        <meta property="og:title" content={displayName} />
        <meta
          property="og:description"
          content="View this Chonk on Backseats"
        />
        <meta property="og:image" content={fullImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={displayName} />
        <meta
          name="twitter:description"
          content="View this Chonk on Backseats"
        />
        <meta name="twitter:image" content={fullImageUrl} />
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">OG Image for {displayName}</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back to Home
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="p-12 border border-gray-300 rounded text-center">
            <div className="mb-4">
              Loading image
              {Array(retryCount + 1)
                .fill(".")
                .join("")}
            </div>
            {retryCount > 0 && (
              <div className="text-sm text-gray-500">
                Retry attempt {retryCount}/{maxRetries}
              </div>
            )}
          </div>
        ) : error ? (
          <div className="p-12 border border-red-300 bg-red-50 rounded text-center">
            <div className="text-red-600 mb-4">Error: {error}</div>

            <div className="flex flex-row gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Again
              </button>

              <button
                onClick={handleUseDirectImageUrl}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Use Fallback Image
              </button>
            </div>

            {/* Debug information section */}
            {debugInfo && (
              <div className="mt-6 text-left">
                <details>
                  <summary className="cursor-pointer text-sm text-gray-600">
                    Debug Information
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-gray-300 rounded p-4">
            <h2 className="text-xl mb-4">Preview:</h2>
            <div className="flex flex-col items-center">
              {/* Display the image from our OG API */}
              <div style={{ width: "100%", maxWidth: "1200px" }}>
                <img
                  src={imageUrl || ""}
                  alt={`${displayName} OG Image`}
                  className="w-full h-auto"
                  onError={(e) => {
                    log("Image failed to load in <img> element");
                    setError("Failed to load image (render error)");
                    // Reset the error handler to prevent infinite loops
                    const img = e.currentTarget;
                    img.onerror = null;
                  }}
                  style={{ maxWidth: "100%" }}
                />
              </div>

              <div className="mt-6 w-full">
                <h3 className="text-lg font-semibold mb-2">Image URL:</h3>
                <div className="bg-gray-100 p-3 rounded overflow-auto whitespace-nowrap">
                  {fullImageUrl}
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">
                    HTML Code to Use:
                  </h3>
                  <pre className="bg-gray-100 p-3 rounded overflow-auto">
                    {`<!-- Meta tags for social media -->
<meta property="og:title" content="${displayName}" />
<meta property="og:description" content="View this Chonk on Backseats" />
<meta property="og:image" content="${fullImageUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${displayName}" />
<meta name="twitter:description" content="View this Chonk on Backseats" />
<meta name="twitter:image" content="${fullImageUrl}" />`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add a getServerSideProps function to ensure the page renders server-side
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params || {};

  if (!id || typeof id !== "string") {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      initialId: id,
      // Pass any other initial props you need
    },
  };
}
