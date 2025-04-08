import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

function ensureViewBox(svg: string): string {
  if (/viewBox=/.test(svg)) return svg;

  // Try to extract width and height
  const widthMatch = svg.match(/width=["']?(\d+)[a-zA-Z]*["']?/);
  const heightMatch = svg.match(/height=["']?(\d+)[a-zA-Z]*["']?/);

  if (widthMatch && heightMatch) {
    const width = widthMatch[1];
    const height = heightMatch[1];

    // Inject viewBox into <svg ...>
    return svg.replace(
      /<svg([^>]+)>/,
      `<svg$1 viewBox="0 0 ${width} ${height}">`
    );
  }

  // If width/height not found, fallback to default
  return svg.replace(
    /<svg([^>]+)>/,
    `<svg$1 viewBox="0 0 100 100">`
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    let svg = req.body;

    // Make sure it's a string (not buffer)
    if (typeof svg !== "string") {
      svg = svg.toString("utf-8");
    }

    // Inject viewBox if needed
    svg = ensureViewBox(svg);

    // Remove shape-rendering attribute as it might interfere with resizing
    svg = svg.replace(/shape-rendering=["']crispEdges["']/g, '');

    const pngBuffer = await sharp(Buffer.from(svg), { density: 300 })
      .resize(12000, 12000, {
        fit: "fill",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
    res.status(200).send(pngBuffer);
  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).json({ error: "Conversion failed" });
  }
}
