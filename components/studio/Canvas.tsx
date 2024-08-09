import { Pixel } from "@/pages/studio";

interface Props {
  gridRef: React.RefObject<HTMLDivElement>;
  gridSize: number;
  gridData: Pixel[];
  backgroundBody: string;
  hoveredPixel: { x: number; y: number } | null;
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handlePixelChange: (x: number, y: number, shiftKey: boolean) => void;
  setHoveredPixel: (pixel: { x: number; y: number } | null) => void;
  getPixelCoordinates: (event: React.MouseEvent) => { x: number; y: number };
}

export default function Canvas({
  gridRef,
  gridSize,
  gridData,
  backgroundBody,
  hoveredPixel,
  handleMouseDown,
  handleMouseUp,
  handleMouseMove,
  handlePixelChange,
  setHoveredPixel,
  getPixelCoordinates,
}: Props) {
  const size = 30;
  const gridWidth = gridSize * size + (gridSize - 1);
  const gridHeight = gridSize * size + (gridSize - 1);

  return (
    <div className="relative w-fit mx-auto border border-[#6b7280]">
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
          style={{ opacity: backgroundBody === "ghost.svg" ? 0.5 : 1 }}
        />
      </div>

      {/* This is the drawing grid */}
      <div
        ref={gridRef}
        className="grid gap-px bg-transparent relative z-10"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${size}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${size}px)`,
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          handleMouseUp();
          setHoveredPixel(null);
        }}
        onClick={(event: React.MouseEvent) => {
          const { x, y } = getPixelCoordinates(event);
          handlePixelChange(x, y, event.shiftKey);
        }}
      >
        {gridData.map((pixel, index) => (
          <div
            key={index}
            className={`pointer w-[${size}px] h-[${size}px] cursor-pointer transition-colors duration-300
                  ${pixel.color ? "" : "hover:bg-gray-200"}`}
            style={{
              borderTop: pixel.y === 0 ? "1px solid #8e96a4" : "none",
              borderLeft: pixel.x === 0 ? "1px solid #8e96a4" : "none",
              borderRight: "1px solid #8e96a4",
              borderBottom: "1px solid #8e96a4",
              backgroundColor: pixel.color || "transparent",
              filter: pixel.color ? "hover:brightness(80%)" : undefined,
              outline:
                hoveredPixel &&
                hoveredPixel.x === pixel.x &&
                hoveredPixel.y === pixel.y
                  ? "2px solid black"
                  : "none",
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
