import React, { useState, useEffect, useCallback, useRef } from "react";
import superlightbody from "../bodies/superlightbody.json";
import lightbody from "../bodies/lightbody.json";
import midbody from "../bodies/midbody.json";
import darkbody from "../bodies/darkbody.json";
import Block from "@uiw/react-color-block";

type Pixel = {
  x: number;
  y: number;
  color: string;
};

const Grid: React.FC = () => {
  const gridSize = 30;

  const generateGrid = (): Pixel[] => {
    const grid: Pixel[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        grid.push({ x, y, color: "" });
      }
    }
    return grid;
  };

  const [gridData, setGridData] = useState<Pixel[]>(generateGrid());
  const [selectedColor, setSelectedColor] = useState<string>("#EFB15E");
  const [textAreaContent, setTextAreaContent] = useState<string>("");
  const [history, setHistory] = useState<Pixel[][]>([]);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [lastModifiedPixel, setLastModifiedPixel] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredPixel, setHoveredPixel] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  console.log(history);

  useEffect(() => {
    updateTextArea();
  }, [gridData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePixelChange = (
    x: number,
    y: number,
    isShiftClick: boolean = false
  ) => {
    if (lastModifiedPixel?.x === x && lastModifiedPixel?.y === y) {
      return; // Skip if this pixel was just modified
    }

    setHistory((prevHistory) => [...prevHistory, [...gridData]]);
    setGridData((prevGrid) =>
      prevGrid.map((pixel) =>
        pixel.x === x && pixel.y === y
          ? { ...pixel, color: isShiftClick ? "" : selectedColor }
          : pixel
      )
    );
    setLastModifiedPixel({ x, y });
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsMouseDown(true);
    const { x, y } = getPixelCoordinates(event);
    handlePixelChange(x, y, event.shiftKey);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setLastModifiedPixel(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const { x, y } = getPixelCoordinates(event);
    setHoveredPixel({ x, y });
    if (isMouseDown) {
      handlePixelChange(x, y, event.shiftKey);
    }
  };

  const getPixelCoordinates = (
    event: React.MouseEvent
  ): { x: number; y: number } => {
    if (!gridRef.current) return { x: -1, y: -1 };

    const rect = gridRef.current.getBoundingClientRect();
    const pixelSize = 40; // Size of each pixel

    // Calculate x and y using the mouse position relative to the grid
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;

    // Use Math.floor to ensure we're always selecting the pixel the cursor is within
    const x = Math.floor(relativeX / pixelSize);
    const y = Math.floor(relativeY / pixelSize);

    // Ensure x and y are within the grid bounds
    return {
      x: Math.max(0, Math.min(x, gridSize - 1)),
      y: Math.max(0, Math.min(y, gridSize - 1)),
    };
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(event.target.value);
  };

  const updateTextArea = () => {
    const gridColors = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(""));
    gridData.forEach((pixel) => {
      gridColors[pixel.y][pixel.x] = pixel.color || "";
    });
    setTextAreaContent(JSON.stringify(gridColors, null, 2));
  };

  const handleTextAreaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    try {
      const newGridColors = JSON.parse(event.target.value);
      if (Array.isArray(newGridColors) && newGridColors.length === gridSize) {
        setHistory((prevHistory) => [...prevHistory, gridData]);
        const newGridData = generateGrid().map((pixel) => ({
          ...pixel,
          color: newGridColors[pixel.y][pixel.x] || "",
        }));
        setGridData(newGridData);
      }
    } catch (error) {
      console.error("Invalid JSON format");
    }
  };

  const resetGrid = () => {
    setHistory(() => []);
    setGridData(generateGrid());
  };

  const undo = useCallback(() => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setGridData(previousState);
      setHistory((prevHistory) => prevHistory.slice(0, -1));
    }
  }, [history]);

  const setBodyData = (bodyData: any) => {
    setHistory((prevHistory) => [...prevHistory, [...gridData]]);
    const newGridData = generateGrid().map((pixel) => ({
      ...pixel,
      color: bodyData[pixel.y][pixel.x] || "",
    }));
    setGridData(newGridData);
    setTextAreaContent(JSON.stringify(bodyData, null, 2));
  };

  const setGhostData = () => {
    try {
      const currentBodyData = JSON.parse(textAreaContent);
      const ghostBodyData = currentBodyData.map((row: string[]) =>
        row.map((color: string) => {
          if (color) {
            const rgba = hexToRGBA(color, 0.5);
            return rgba;
          }
          return color;
        })
      );
      setHistory((prevHistory) => [...prevHistory, gridData]);
      const newGridData = generateGrid().map((pixel) => ({
        ...pixel,
        color: ghostBodyData[pixel.y][pixel.x] || "",
      }));
      setGridData(newGridData);
      setTextAreaContent(JSON.stringify(ghostBodyData, null, 2));
    } catch (error) {
      console.error("Invalid JSON format in textarea");
    }
  };

  const hexToRGBA = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const printGrid = () => {
    console.log(textAreaContent);
  };

  const copyTextAreaContent = () => {
    navigator.clipboard
      .writeText(textAreaContent)
      .then(() => {
        console.log("Text area content copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <div className="p-4 flex">
      <div>
        <Block
          color={selectedColor}
          colors={[
            "#000",
            "#fff",
            "#EAD9D9", // lightest body
            "#E2CACA",
            "#EFB15E", // light body
            "#D69743",
            "#BA8136", // mid body
            "#9A6D2E",
            "#8A5E24", // dark body
            "#77511E",
          ]}
          onChange={(color) => setSelectedColor(color.hex)}
        />
        <div className="mb-4 flex items-center">
          <button
            onClick={resetGrid}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Reset
          </button>

          <button
            onClick={() => setBodyData(superlightbody)}
            className="px-4 py-2 ml-8 bg-[#EAD9D9] text-black rounded hover:brightness-[70%] transition-colors mr-2"
          >
            Super Light Body
          </button>
          <button
            onClick={() => setBodyData(lightbody)}
            className="px-4 py-2 bg-[#EFB15D] text-black rounded hover:brightness-[70%] transition-colors mr-2"
          >
            Light Body
          </button>
          <button
            onClick={() => setBodyData(midbody)}
            className="px-4 py-2 bg-[#BB8136] text-white rounded hover:brightness-[70%] transition-colors mr-2"
          >
            Mid Body
          </button>
          <button
            onClick={() => setBodyData(darkbody)}
            className="px-4 py-2 bg-[#8B5E24] text-white rounded hover:brightness-[70%] transition-colors"
          >
            Dark Body
          </button>
          <button
            onClick={setGhostData}
            className="px-4 py-2 ml-2 bg-gray-700 text-white rounded hover:brightness-[70%] transition-colors"
          >
            Ghost
          </button>
          <button
            onClick={printGrid}
            className="px-4 py-2 ml-2 bg-blue-500 text-white rounded hover:brightness-[70%] transition-colors"
          >
            Console.log Heightmap
          </button>
          <button
            onClick={copyTextAreaContent}
            className="px-4 py-2 ml-2 bg-green-500 text-white rounded hover:brightness-[70%] transition-colors"
          >
            Copy Heightmap
          </button>
        </div>
        <div
          ref={gridRef}
          className="grid gap-px bg-gray-300 p-px w-fit"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 40px)`,
            gridTemplateRows: `repeat(${gridSize}, 40px)`,
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
              className={`pointer w-[40px] h-[40px] cursor-pointer transition-colors duration-300
                ${pixel.color ? "" : "hover:bg-gray-200"}`}
              style={{
                backgroundColor: pixel.color || "white",
                filter: pixel.color ? "hover:brightness(80%)" : undefined,
                outline:
                  hoveredPixel &&
                  hoveredPixel.x === pixel.x &&
                  hoveredPixel.y === pixel.y
                    ? "2px solid black"
                    : "none",
              }}
              title={`x: ${pixel.x}, y: ${pixel.y}, color: ${
                pixel.color || "white"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="ml-8">
        <textarea
          value={textAreaContent}
          onChange={handleTextAreaChange}
          className="w-64 h-[600px] p-2 border border-gray-300 rounded"
          placeholder="Grid data in JSON format"
        />
      </div>
    </div>
  );
};

export default Grid;
