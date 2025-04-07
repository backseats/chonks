import React, { useEffect, useState } from "react";
import Head from "next/head";
import { GET_CHONK_BY_ID } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";

interface ChonkOGMetaProps {
  chonkId: string | number;
  title?: string;
  description?: string;
  image?: string | null;
}

/**
 * A component that adds OpenGraph and Twitter meta tags for a Chonk
 * This can be included in any page where you want to enable social sharing previews
 */
export default function ChonkOGMeta({
  chonkId,
  title = "",
  description = "View this Chonk on Backseats",
  image = null,
}: ChonkOGMetaProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(image);
  const [chonkName, setChonkName] = useState<string | null>(null);

  // Get the site URL for absolute URLs
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://chonks.xyz");

  // Ensure URL is absolute
  const makeAbsoluteUrl = (url: string): string => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // Ensure the URL starts with a slash for proper joining
    const urlWithSlash = url.startsWith("/") ? url : `/${url}`;

    // In production, always use the actual production domain
    if (process.env.NODE_ENV === "production") {
      return `https://chonks.xyz${urlWithSlash}`;
    }

    return `${siteUrl}${urlWithSlash}`;
  };

  useEffect(() => {
    // If a direct image URL was provided via props, use it
    if (image) {
      console.log("Using provided image URL:", image);
      setImageUrl(image);
      return;
    }

    // Always set a fallback for robustness
    const fallbackUrl = `/api/og-fallback?id=${chonkId}`;
    const absoluteFallbackUrl = makeAbsoluteUrl(fallbackUrl);
    console.log("Setting fallback URL:", absoluteFallbackUrl);
    setImageUrl(absoluteFallbackUrl);
  }, [chonkId, siteUrl, image]);

  // Generate the image URL - use the state if we've verified it, otherwise use a safe fallback
  let ogImageUrl = imageUrl || `/api/og-fallback?id=${chonkId}`;

  // Ensure the URL is absolute
  if (!ogImageUrl.startsWith("http")) {
    ogImageUrl = makeAbsoluteUrl(ogImageUrl);
  }

  // Use custom title or default to the name from metadata or "Chonk #[id]"
  const ogTitle = title || chonkName || `Chonk #${chonkId}`;

  console.log("Final OG image URL:", ogImageUrl);

  return (
    <Head>
      {/* OpenGraph tags */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" />

      {/* Twitter tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />
    </Head>
  );
}
