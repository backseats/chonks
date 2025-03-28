import React from "react";
import bodies from "../contracts/csv-conversion/bodies.json";

type Pixel = {
  x: number;
  y: number;
  color: string;
};

interface ChonkRendererProps {
  bytes?: string;
  backgroundColor?: string;
  backgroundBody?: string;
  bodyIndex?: number;
  opacity?: number;
}

const gridSize = 30;

export default function ChonkRenderer(props: ChonkRendererProps) {
  const {
    bytes = "",
    backgroundColor = "#0F6E9D",
    backgroundBody = "ghost.svg",
    bodyIndex = 0,
    opacity = 1,
  } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);
  // Don't render until we have a proper size
  const [pixelSize, setPixelSize] = React.useState<number | null>(null);

  // Use ResizeObserver to detect container size changes
  React.useEffect(() => {
    if (!containerRef.current) return;

    const calculateSize = (element: HTMLElement) => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      const minDimension = Math.min(width, height);
      setPixelSize(Math.floor(minDimension / gridSize));
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Get the smallest dimension (width or height) to maintain square aspect ratio
        const boundingRect = entry.contentRect;
        const minDimension = Math.min(boundingRect.width, boundingRect.height);
        setPixelSize(Math.floor(minDimension / gridSize));
      }
    });

    resizeObserver.observe(containerRef.current);

    // Initial size calculation
    calculateSize(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Memoize grid generation to avoid recreating on every render
  const generateGrid = React.useCallback((): Pixel[] => {
    const grid: Pixel[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        grid.push({ x, y, color: "" });
      }
    }
    return grid;
  }, []);

  // Memoize byte parsing to only recalculate when bytes change
  const parseBytes = React.useCallback(
    (byteString: string): Pixel[] => {
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
    },
    [generateGrid]
  );

  // Memoize gridData to only recalculate when bytes change
  const gridData = React.useMemo(() => parseBytes(bytes), [bytes, parseBytes]);

  // Memoize background body rendering to only recalculate when bodyIndex or backgroundBody changes
  const renderBackgroundBody = React.useCallback(() => {
    const bodySVG = bodyIndex
      ? bodies.bodies.find((body) => body.id === bodyIndex)
      : bodies.bodies.find(
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
  }, [bodyIndex, backgroundBody]);

  // Memoize backgroundPixels to only recalculate when renderBackgroundBody changes
  const backgroundPixels = React.useMemo(
    () => renderBackgroundBody(),
    [renderBackgroundBody]
  );

  // Memoize the empty grid for the background layer
  const emptyGrid = React.useMemo(() => generateGrid(), [generateGrid]);

  const gridWidth = gridSize * pixelSize;
  const gridHeight = gridSize * pixelSize;

  // If we don't have a pixel size yet, render just the container
  if (pixelSize === null) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full"
        style={{ aspectRatio: "1 / 1" }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="grid relative w-full h-full"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${gridSize}, ${pixelSize}px)`,
        gap: 0,
        backgroundColor: backgroundColor,
        aspectRatio: "1 / 1", // Maintain square aspect ratio
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
          opacity: opacity
            ? opacity
            : !bodyIndex && backgroundBody === "ghost.svg"
            ? 0.5
            : 1,
        }}
      >
        {emptyGrid.map((pixel, index) => {
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
