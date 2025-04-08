// pages/api/convert.ts
import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb", // allow larger SVGs
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const svg = req.body;

    // Convert SVG to PNG using sharp
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
    res.status(200).send(pngBuffer);
  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).json({ error: "Conversion failed" });
  }
}
