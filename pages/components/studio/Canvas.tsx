import { Pixel } from "@/pages/studio";
import React from "react";

interface Props {
  pixelSize: number;
  gridRef: React.RefObject<HTMLDivElement>;
  gridSize: number;
  gridData: Pixel[];
  backgroundBody: string;
  hoveredPixel: { x: number; y: number } | null;
  showGrid: boolean;
  backgroundColor: string;
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handlePixelChange: (x: number, y: number, isErasing: boolean) => void;
  setHoveredPixel: (pixel: { x: number; y: number } | null) => void;
  getPixelCoordinates: (event: React.MouseEvent) => { x: number; y: number };
  handleTouchStart: (event: React.TouchEvent) => void;
  handleTouchMove: (event: React.TouchEvent) => void;
  handleTouchEnd: (event: React.TouchEvent) => void;
}

export default function Canvas({
  pixelSize,
  showGrid,
  gridRef,
  gridSize,
  gridData,
  backgroundBody,
  hoveredPixel,
  backgroundColor,
  handleMouseDown,
  handleMouseUp,
  handleMouseMove,
  handlePixelChange,
  setHoveredPixel,
  getPixelCoordinates,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
}: Props) {
  const borderSize = showGrid ? 1 : 0;
  const gridWidth = gridSize * pixelSize + (gridSize - 1) * borderSize;
  const gridHeight = gridSize * pixelSize + (gridSize - 1) * borderSize;

  return (
    <div
      className={`relative w-fit h-fit mx-auto`}
      style={{ backgroundColor: backgroundColor }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Background image */}
      <div
        className="absolute top-0 left-0"
        style={{
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
        }}
      >
        <img
          src={
            backgroundBody === "ghost.svg" ? "lightbody.svg" : backgroundBody
          }
          alt=""
          className="w-full h-full object-cover"
          style={{ opacity: backgroundBody === "ghost.svg" ? 0.6 : 1 }}
        />
      </div>

      {/* This is the drawing grid */}
      <div
        ref={gridRef}
        className="grid bg-transparent relative z-10"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${pixelSize}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${pixelSize}px)`,
          gap: `${borderSize}px`,
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={() => {
          handleMouseUp();
          setHoveredPixel(null);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {gridData.map((pixel, index) => (
          <div
            key={index}
            className={`pointer w-[${pixelSize}px] h-[${pixelSize}px] cursor-pointer transition-colors duration-300
                  ${pixel.color ? "" : "hover:bg-gray-200"}`}
            style={{
              borderTop:
                showGrid && pixel.y === 0 ? "1px solid #8e96a4" : "none",
              borderLeft:
                showGrid && pixel.x === 0 ? "1px solid #8e96a4" : "none",
              borderRight: showGrid ? "1px solid #8e96a4" : "none",
              borderBottom: showGrid ? "1px solid #8e96a4" : "none",
              backgroundColor:
                hoveredPixel &&
                hoveredPixel.x === pixel.x &&
                hoveredPixel.y === pixel.y
                  ? pixel.color || "white"
                  : pixel.color || "transparent",
              transform:
                hoveredPixel &&
                hoveredPixel.x === pixel.x &&
                hoveredPixel.y === pixel.y
                  ? "scale(1.35)"
                  : "scale(1)",
              zIndex:
                hoveredPixel &&
                hoveredPixel.x === pixel.x &&
                hoveredPixel.y === pixel.y
                  ? "1"
                  : "auto",
              transition:
                "transform 0.075s ease-in-out, background-color 0.075s ease-in-out",
            }}
            title={`x: ${pixel.x}, y: ${pixel.y}, color: ${
              pixel.color || "transparent"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
