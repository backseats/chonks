import React, { useState } from "react";

interface Props {
  hexColor?: string;
  setSelectedColor: (color: string) => void;
}

const GradientDegrees = (props: Props) => {
  const { hexColor, setSelectedColor } = props;
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Function to validate hex color
  const isValidHex = (hex: string): boolean => {
    return (
      typeof hex === "string" &&
      hex.length === 7 &&
      hex.startsWith("#") &&
      !isNaN(Number("0x" + hex.slice(1)))
    );
  };

  // Function to adjust color brightness
  const adjustBrightness = (hex: string, percent: number): string => {
    if (!isValidHex(hex)) {
      console.error("Invalid hex color provided:", hex);
      return hex;
    }

    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r = Math.min(255, Math.max(0, r + (r * percent) / 100));
    g = Math.min(255, Math.max(0, g + (g * percent) / 100));
    b = Math.min(255, Math.max(0, b + (b * percent) / 100));

    return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g)
      .toString(16)
      .padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
  };

  // Use a default color if the provided hexColor is invalid or undefined
  const safeHexColor = isValidHex(hexColor ?? "")
    ? hexColor ?? "#4CAF50"
    : "#4CAF50";

  // Generate color variants
  const colorVariants = [
    ...[-50, -10].map((percent) => adjustBrightness(safeHexColor, percent)),
    safeHexColor,
    ...[10, 50].map((percent) => adjustBrightness(safeHexColor, percent)),
  ];

  const handleColorClick = (color: string, index: number) => {
    setSelectedColor(color);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col items-center py-2">
      <h2 className="text-xl font-semibold mb-4">Shading</h2>
      <div className="flex">
        {colorVariants.map((color, index) => (
          <div
            key={index}
            className="flex flex-col items-center mx-1"
            onClick={() => handleColorClick(color, index)}
          >
            <div
              className="w-12 h-12 mb-2 border border-gray-300 cursor-pointer"
              style={{ backgroundColor: color }}
            ></div>
            <div className="w-16 h-5 flex items-center justify-center">
              <span className="text-xs truncate">
                {copiedIndex === index ? "Copied!" : color}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradientDegrees;
