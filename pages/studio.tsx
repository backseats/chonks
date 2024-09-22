import React, { useState, useEffect, useCallback, useRef } from "react";
import SVGPreview from "@/pages/components/studio/SVGPreview";
import SelectColor from "@/pages/components/studio/SelectColor";
import Canvas from "@/pages/components/studio/Canvas";
import MenuBar from "@/pages/components/studio/MenuBar";
import { parseSvgToBytes } from "@/utils/convertSvgToBytes";
import MetadataModal from "./components/studio/MetadataModal";
import KeyboardShortcutsModal from "./components/studio/KeyboardShortcutsModal";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

export type Pixel = {
  x: number;
  y: number;
  color: string;
};

// This always needs to be 30 since it's a 30x30 grid in Solidity
const gridSize = 30;
// This is the size of each pixel in the grid on the front-end, e.g. 24x24px
const pixelSize = 24;

const Grid: React.FC = () => {
  const generateGrid = (): Pixel[] => {
    const grid: Pixel[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        grid.push({ x, y, color: "" });
      }
    }
    return grid;
  };

  const [backgroundBody, setBackgroundBody] = useState<string>("ghost.svg");
  const [gridData, setGridData] = useState<Pixel[]>(generateGrid());
  const [selectedColor, setSelectedColor] = useState<string>("#EFB15E");
  const [additionalColors, setAdditionalColors] = useState<string[]>([]);
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
  const [miniSvgContent, setMiniSvgContent] = useState<string>("");
  const [isPickingColor, setIsPickingColor] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKeyboardShortcutsModalOpen, setIsKeyboardShortcutsModalOpen] =
    useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const field1Ref = useRef<HTMLInputElement>(null);

  const traitTypes = [
    "Hat",
    "Hair",
    "Glasses",
    "Handheld",
    "Shirt",
    "Pants",
    "Shoes",
  ];
  const [currentTraitIndex, setCurrentTraitIndex] = useState(0);

  const handleTraitTypeChange = () => {
    setCurrentTraitIndex((prevIndex) => (prevIndex + 1) % traitTypes.length);
  };

  useEffect(() => {
    updateTextArea();
  }, [gridData]);

  useEffect(() => {
    const storedColors = localStorage.getItem("chonksstudio");
    console.log("storedColors", storedColors);
    if (storedColors) {
      setAdditionalColors(JSON.parse(storedColors));
    } else {
      localStorage.setItem("chonksstudio", JSON.stringify([]));
      setAdditionalColors([]);
    }
  }, []);

  const [currentAction, setCurrentAction] = useState<Pixel[]>([]);

  const handlePixelChange = (
    x: number,
    y: number,
    isErasing: boolean = false
  ) => {
    if (lastModifiedPixel?.x === x && lastModifiedPixel?.y === y) {
      return; // Skip if this pixel was just modified
    }

    const newColor = isErasing ? "" : selectedColor;
    const oldPixel = gridData.find((pixel) => pixel.x === x && pixel.y === y);

    if (oldPixel && oldPixel.color !== newColor) {
      setCurrentAction((prevAction) => [...prevAction, { ...oldPixel }]);
    }

    setGridData((prevGrid) =>
      prevGrid.map((pixel) =>
        pixel.x === x && pixel.y === y ? { ...pixel, color: newColor } : pixel
      )
    );
    setLastModifiedPixel({ x, y });
  };

  const completeAction = useCallback(() => {
    if (currentAction.length > 0) {
      setHistory((prevHistory) => [...prevHistory, currentAction]);
      setCurrentAction([]);
    }
  }, [currentAction]);

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsMouseDown(true);
    const { x, y } = getPixelCoordinates(event);
    handlePixelChange(x, y, event.button === 2); // Right-click is button 2
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setLastModifiedPixel(null);
    completeAction();
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const { x, y } = getPixelCoordinates(event);
    setHoveredPixel({ x, y });
    if (isMouseDown) {
      handlePixelChange(x, y, event.buttons === 2); // Right-click drag is buttons 2
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    setIsDrawing(true);
    setIsMouseDown(true);
    const { x, y } = getTouchPixelCoordinates(event);
    handlePixelChange(x, y);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getTouchPixelCoordinates(event);
    setHoveredPixel({ x, y });
    if (isMouseDown) {
      handlePixelChange(x, y);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    setIsDrawing(false);
    setIsMouseDown(false);
    setLastModifiedPixel(null);
    completeAction();
  };

  const getPixelCoordinates = (
    event: React.MouseEvent
  ): { x: number; y: number } => {
    if (!gridRef.current) return { x: -1, y: -1 };

    const rect = gridRef.current.getBoundingClientRect();

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

  const getTouchPixelCoordinates = (
    event: React.TouchEvent
  ): { x: number; y: number } => {
    if (!gridRef.current) return { x: -1, y: -1 };

    const rect = gridRef.current.getBoundingClientRect();
    const touch = event.touches[0];

    const relativeX = touch.clientX - rect.left;
    const relativeY = touch.clientY - rect.top;

    const x = Math.floor(relativeX / pixelSize);
    const y = Math.floor(relativeY / pixelSize);

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
      const lastAction = history[history.length - 1];
      setGridData((prevGrid) =>
        prevGrid.map((pixel) => {
          const undoPixel = lastAction.find(
            (p) => p.x === pixel.x && p.y === pixel.y
          );
          return undoPixel ? { ...pixel, color: undoPixel.color } : pixel;
        })
      );
      setHistory((prevHistory) => prevHistory.slice(0, -1));
    }
  }, [history]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo]);

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    document.body.addEventListener("touchmove", preventDefault, {
      passive: false,
    });

    return () => {
      document.body.removeEventListener("touchmove", preventDefault);
    };
  }, [isDrawing]);

  const toggleGrid = () => setShowGrid(!showGrid);

  const copySVGText = () => navigator.clipboard.writeText(svgContent);

  const generateSVG = (
    gridColors: string[][],
    mini: boolean = false
  ): string => {
    const pixelSize = mini ? 1 : 10; // Size of each pixel in the SVG
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

      const mini = generateSVG(gridColors, true);
      setMiniSvgContent(mini);
    } catch (error) {
      console.error("Error generating SVG:", error);
    }
  };

  const downloadSVG = () => {
    const blob = new Blob([miniSvgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "heightmap.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBytes = () => {
    const bytes = parseSvgToBytes(miniSvgContent);
    console.log("bytes", bytes);
    navigator.clipboard.writeText(bytes);
  };

  useEffect(() => updateSVG(), [textAreaContent]);

  const saveColorToPalette = () => {
    // TODO: ensure it's hex and not rgb

    setAdditionalColors((prevColors) => {
      let updatedPalette: any[] = [];
      if (prevColors) {
        updatedPalette = [...prevColors];
      }

      if (!updatedPalette.includes(selectedColor)) {
        updatedPalette.push(selectedColor);
        localStorage.setItem("chonksstudio", JSON.stringify(updatedPalette));
      }
      return updatedPalette;
    });
  };

  const resetSavedColors = () => {
    localStorage.removeItem("chonksstudio");
    setAdditionalColors([]);
  };

  const startColorPicker = () => setIsPickingColor(true);

  const handleColorPick = useCallback(
    (event: MouseEvent) => {
      if (!isPickingColor) return;

      event.preventDefault();
      event.stopPropagation();

      const target = event.target as HTMLElement;
      const computedStyle = window.getComputedStyle(target);
      const backgroundColor = computedStyle.backgroundColor;

      const rgbaMatch = backgroundColor.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/
      );
      if (rgbaMatch) {
        const [, r, g, b] = rgbaMatch.map(Number);
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1)}`;
        console.log("Picked color (hex):", hex);
        setSelectedColor(hex);
      } else {
        console.log("Picked color:", backgroundColor);
      }
      setSelectedColor(backgroundColor);
      setIsPickingColor(false);

      // Remove the event listener after picking the color
      document.removeEventListener("click", handleColorPick, true);
    },
    [isPickingColor, setSelectedColor]
  );

  useEffect(() => {
    if (isPickingColor) {
      // Use capture phase to ensure this listener runs before other click handlers
      document.addEventListener("click", handleColorPick, true);
    }

    return () => document.removeEventListener("click", handleColorPick, true);
  }, [isPickingColor, handleColorPick]);

  const openModal = () => {
    setIsModalOpen(true);
    // Focus on field1 when the modal opens
    setTimeout(() => {
      if (field1Ref.current) {
        field1Ref.current.focus();
      }
    }, 0);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission logic here

    closeModal();
  };

  const handleModalBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const openKeyboardShortcutsModal = () => {
    setIsKeyboardShortcutsModalOpen(true);
  };

  const closeKeyboardShortcutsModal = () => {
    setIsKeyboardShortcutsModalOpen(false);
  };

  const handleKeyboardShortcutsModalBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (e.target === e.currentTarget) closeKeyboardShortcutsModal();
  };

  return (
    <div className="bg-white">
      <MenuBar
        toggleGrid={toggleGrid}
        resetGrid={resetGrid}
        resetSavedColors={resetSavedColors}
      />

      <div className="flex md:justify-center md:max-w-[1200px] md:mx-auto">
        <div className="flex flex-col md:flex-row gap-[75px] md:p-4 md:w-full">
          {/* Left column */}
          <Canvas
            pixelSize={pixelSize}
            gridRef={gridRef}
            gridSize={gridSize}
            gridData={gridData}
            backgroundBody={backgroundBody}
            handleMouseDown={handleMouseDown}
            handleMouseUp={handleMouseUp}
            handleMouseMove={handleMouseMove}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            setHoveredPixel={setHoveredPixel}
            hoveredPixel={hoveredPixel}
            showGrid={showGrid}
            backgroundColor={backgroundColor}
          />

          {/* Right column */}
          <div className="flex flex-col gap-2 md:max-w-[420px]">
            <SVGPreview
              svgContent={svgContent}
              handleBytes={handleBytes}
              openModal={openModal}
            />

            <SelectColor
              additionalColors={additionalColors}
              hasAdditionalColors={additionalColors?.length > 0}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              saveColorToPalette={saveColorToPalette}
              setBackgroundColor={setBackgroundColor}
              startColorPicker={startColorPicker}
              setBackgroundBody={setBackgroundBody}
              openKeyboardShortcutsModal={openKeyboardShortcutsModal}
            />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <MetadataModal
          traitType={traitTypes[currentTraitIndex]}
          traitTypes={traitTypes}
          closeModal={closeModal}
          handleSubmit={handleSubmit}
          field1Ref={field1Ref}
          handleModalBackgroundClick={handleModalBackgroundClick}
          onTraitTypeChange={handleTraitTypeChange}
        />
      )}

      {isKeyboardShortcutsModalOpen && (
        <KeyboardShortcutsModal
          closeModal={closeKeyboardShortcutsModal}
          handleModalBackgroundClick={
            handleKeyboardShortcutsModalBackgroundClick
          }
        />
      )}
    </div>
  );
};

export default Grid;
