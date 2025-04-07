import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

export default function OgImagePage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return; // Wait for ID to be available from router

    const fetchImage = async () => {
      setLoading(true);
      setError(null);

      try {
        // Create the API URL for this ID
        const apiUrl = `/api/og?id=${id}`;

        // Verify the API endpoint returns valid data
        const response = await fetch(apiUrl);
        console.log("response status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // Check content type to ensure it's an image
        const contentType = response.headers.get("Content-Type");
        if (contentType && !contentType.startsWith("image/")) {
          console.warn("Unexpected content type:", contentType);
        }

        // Set the URL only after confirming it works
        setImageUrl(apiUrl);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching OG image:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch image");
        setLoading(false);
      }
    };

    fetchImage();
  }, [id]);

  if (!id) {
    return <div className="p-8">Loading...</div>;
  }

  // Generate the absolute URL for the OG image
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const fullImageUrl = `${siteUrl}${imageUrl?.startsWith("/") ? "" : "/"}${
    imageUrl || ""
  }`;

  return (
    <div className="p-8">
      <Head>
        <title>Chonk #{id} OG Image</title>
        <meta property="og:image" content={fullImageUrl} />
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">OG Image for Chonk #{id}</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back to Home
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="p-12 border border-gray-300 rounded text-center">
            Loading image...
          </div>
        ) : error ? (
          <div className="p-12 border border-red-300 bg-red-50 rounded text-center text-red-600">
            Error: {error}
          </div>
        ) : (
          <div className="border border-gray-300 rounded p-4">
            <h2 className="text-xl mb-4">Preview:</h2>
            <div className="flex flex-col items-center">
              {/* Display the image from our OG API */}
              <div style={{ width: "100%", maxWidth: "1200px" }}>
                <img
                  src={imageUrl || ""}
                  alt={`Chonk #${id} OG Image`}
                  className="w-full h-auto"
                  onError={(e) => {
                    console.error("Image failed to load");
                    setError("Failed to load image");
                    // Optionally add a retry mechanism
                    const img = e.currentTarget;
                    img.onerror = null; // Prevent infinite loops
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
                    {`<meta property="og:image" content="${fullImageUrl}" />`}
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
