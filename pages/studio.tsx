import React, { useState, useEffect, useCallback, useRef } from "react";
import SVGPreview from "@/components/studio/SVGPreview";
import TextEditor from "@/components/studio/TextEditor";
import BodyPresets from "@/components/studio/BodyPresets";
import ResetCanvas from "@/components/studio/ResetCanvas";
import SelectColor from "@/components/studio/SelectColor";
import Canvas from "@/components/studio/Canvas";

export type Pixel = {
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

  const [backgroundBody, setBackgroundBody] = useState<string>("lightbody.svg");
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
  const [svgContent, setSvgContent] = useState<string>("");

  const gridRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    const pixelSize = 30; // Size of each pixel

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
    const textarea = event.target;
    const { selectionStart, selectionEnd } = textarea;

    try {
      const newGridColors = JSON.parse(event.target.value);
      if (Array.isArray(newGridColors) && newGridColors.length === gridSize) {
        setHistory((prevHistory) => [...prevHistory, gridData]);
        const newGridData = generateGrid().map((pixel) => ({
          ...pixel,
          color: newGridColors[pixel.y][pixel.x] || "",
        }));
        setGridData(newGridData);
        setTextAreaContent(event.target.value);

        // Preserve cursor position
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = selectionStart;
            textareaRef.current.selectionEnd = selectionEnd;
          }
        }, 0);
      }
    } catch (error) {
      console.error("Invalid JSON format");
      setTextAreaContent(event.target.value);
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

  const copySVGText = () => {
    navigator.clipboard.writeText(svgContent);
  };

  const generateSVG = (gridColors: string[][]): string => {
    const pixelSize = 10; // Size of each pixel in the SVG
    const width = gridColors[0].length * pixelSize;
    const height = gridColors.length * pixelSize;

    let svgContent = `<svg width="${width}" height="${height}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">`;

    gridColors.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color) {
          svgContent += `<rect x="${x * pixelSize}" y="${
            y * pixelSize
          }" width="${pixelSize}" height="${pixelSize}" fill="${color}" />`;
        }
      });
    });

    svgContent += "</svg>";
    return svgContent;
  };

  const updateSVG = () => {
    try {
      const gridColors = JSON.parse(textAreaContent);
      const newSvgContent = generateSVG(gridColors);
      setSvgContent(newSvgContent);
    } catch (error) {
      console.error("Error generating SVG:", error);
    }
  };

  const downloadSVG = () => {
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "heightmap.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    updateSVG();
  }, [textAreaContent]);

  return (
    <div className="p-4 flex flex-col">
      {/* Menus and Grid */}
      <div>
        {/* Menu bar */}
        <div className="flex flex-row gap-8">
          <SelectColor
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
          />
          <BodyPresets setBackgroundBody={setBackgroundBody} />
          <ResetCanvas resetGrid={resetGrid} />
        </div>

        <Canvas
          gridRef={gridRef}
          gridSize={gridSize}
          gridData={gridData}
          backgroundBody={backgroundBody}
          handleMouseDown={handleMouseDown}
          handleMouseUp={handleMouseUp}
          handleMouseMove={handleMouseMove}
          handlePixelChange={handlePixelChange}
          setHoveredPixel={setHoveredPixel}
          hoveredPixel={hoveredPixel}
          getPixelCoordinates={getPixelCoordinates}
        />
      </div>

      {/* Bottom section */}
      <div className="ml-8 my-8 flex flex-row">
        <TextEditor
          textareaRef={textareaRef}
          textAreaContent={textAreaContent}
          handleTextAreaChange={handleTextAreaChange}
          copyTextAreaContent={copyTextAreaContent}
          printGrid={printGrid}
        />

        <SVGPreview
          svgContent={svgContent}
          copySVGText={copySVGText}
          downloadSVG={downloadSVG}
        />
      </div>
    </div>
  );
};

export default Grid;
