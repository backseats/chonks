import React from "react";
import bodies from "../contracts/csv-conversion/bodies.json";

type Pixel = {
  x: number;
  y: number;
  color: string;
};

interface ChonkRendererProps {
  size?: number;
  bytes?: string;
  backgroundColor?: string;
  backgroundBody?: string;
}

const gridSize = 30;

export default function ChonkRenderer(props: ChonkRendererProps) {
  const {
    size = 400,
    bytes = "",
    backgroundColor = "#0F6E9D",
    backgroundBody = "ghost.svg",
  } = props;

  const pixelSize = Math.floor(size / gridSize);

  const generateGrid = (): Pixel[] => {
    const grid: Pixel[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        grid.push({ x, y, color: "" });
      }
    }
    return grid;
  };

  // Parse bytes into grid data
  const parseBytes = (byteString: string): Pixel[] => {
    const grid = generateGrid();
    const byteGroups = byteString.match(/.{1,10}/g) || [];

    byteGroups.forEach((group) => {
      const x = parseInt(group.slice(0, 2), 16);
      const y = parseInt(group.slice(2, 4), 16);
      const color = `#${group.slice(4, 10)}`;

      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        const index = y * gridSize + x;
        grid[index] = { x, y, color };
      }
    });

    return grid;
  };

  const gridData = parseBytes(bytes);

  // Function to render background body pixels
  const renderBackgroundBody = () => {
    const bodySVG = bodies.bodies.find(
      (body) =>
        body.path ===
        (backgroundBody === "ghost.svg" ? "skinTone1.svg" : backgroundBody)
    );

    if (bodySVG && bodySVG.colorMap) {
      const byteArray = bodySVG.colorMap.match(/.{1,2}/g) || [];
      let backgroundPixels: Pixel[] = [];
      let index = 0;

      while (index < byteArray.length) {
        const x = parseInt(byteArray[index], 16);
        const y = parseInt(byteArray[index + 1], 16);
        const color = `#${byteArray[index + 2]}${byteArray[index + 3]}${
          byteArray[index + 4]
        }`;

        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
          backgroundPixels.push({ x, y, color });
        }

        index += 5;
      }

      return backgroundPixels;
    }

    return [];
  };

  const backgroundPixels = renderBackgroundBody();
  const gridWidth = gridSize * pixelSize;
  const gridHeight = gridSize * pixelSize;

  return (
    <div
      className="grid relative"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${gridSize}, ${pixelSize}px)`,
        gap: 0,
        backgroundColor: backgroundColor,
        width: `${gridWidth}px`,
        height: `${gridHeight}px`,
      }}
    >
      {/* Background Body Layer */}
      <div
        className="absolute inset-0 grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, ${pixelSize}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${pixelSize}px)`,
          gap: 0,
          opacity: backgroundBody === "ghost.svg" ? 0.5 : 1,
        }}
      >
        {generateGrid().map((pixel, index) => {
          const backgroundPixel = backgroundPixels.find(
            (bp) => bp.x === pixel.x && bp.y === pixel.y
          );
          return (
            <div
              key={`bg-${index}`}
              style={{
                width: `${pixelSize}px`,
                height: `${pixelSize}px`,
                backgroundColor: backgroundPixel?.color || "transparent",
              }}
            />
          );
        })}
      </div>

      {/* Main Grid Layer */}
      {gridData.map((pixel, index) => (
        <div
          key={index}
          style={{
            width: `${pixelSize}px`,
            height: `${pixelSize}px`,
            backgroundColor: pixel.color || "transparent",
            position: "relative",
            zIndex: 1,
          }}
        />
      ))}
    </div>
  );
}
