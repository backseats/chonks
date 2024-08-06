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
  return (
    <div className="relative w-fit mx-auto border border-[#6b7280]">
      {/* Background image */}
      <div
        className="absolute top-0 left-0"
        style={{
          width: `${gridSize * 30 + (gridSize - 1)}px`,
          height: `${gridSize * 30 + (gridSize - 1)}px`,
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
          gridTemplateColumns: `repeat(${gridSize}, 30px)`,
          gridTemplateRows: `repeat(${gridSize}, 30px)`,
          width: `${gridSize * 30 + (gridSize - 1)}px`,
          height: `${gridSize * 30 + (gridSize - 1)}px`,
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
            className={`pointer w-[30px] h-[30px] cursor-pointer transition-colors duration-300
                  ${pixel.color ? "" : "hover:bg-gray-200"}`}
            style={{
              borderTop: pixel.y === 0 ? "1px solid #6b7280" : "none",
              borderLeft: pixel.x === 0 ? "1px solid #6b7280" : "none",
              borderRight: "1px solid #6b7280",
              borderBottom: "1px solid #6b7280",
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
