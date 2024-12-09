import React, { useState, useEffect, useCallback, useRef } from "react";
import SVGPreview from "../components/studio/SVGPreview";
import SelectColor from "../components/studio/SelectColor";
import Canvas from "../components/studio/Canvas";
import MenuBar from "../components/studio/MenuBar";
import { parseSvgToBytes } from "@/utils/convertSvgToBytes";
import MetadataModal from "../components/studio/MetadataModal";
import KeyboardShortcutsModal from "../components/studio/KeyboardShortcutsModal";
import LoadTraitModal from "../components/studio/LoadTraitModal";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useAccount } from "wagmi";
import html2canvas from "html2canvas";
import traits from "../contracts/csv-conversion/latest.json";
import bodies from "../contracts/csv-conversion/bodies.json";

import BodyPresets from "../components/studio/BodyPresets";
import {
  EyeDropperIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

export type Pixel = {
  x: number;
  y: number;
  color: string;
};

// This always needs to be 30 since it's a 30x30 grid in Solidity
const gridSize = 30;
// This is the size of each pixel in the grid on the front-end, e.g. 24x24px
const pixelSize = 24;

// Update your types to include old and new colors
type PixelAction = {
  x: number;
  y: number;
  oldColor: string;
  newColor: string;
};

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

  const { address } = useAccount();

  const [backgroundBody, setBackgroundBody] = useState<string>("skinTone2.svg");
  const [gridData, setGridData] = useState<Pixel[]>(generateGrid());
  const [selectedColor, setSelectedColor] = useState<string>("#48A6FA"); // a nice blue
  const [additionalColors, setAdditionalColors] = useState<string[]>([]);
  const [textAreaContent, setTextAreaContent] = useState<string>("");
  const [history, setHistory] = useState<PixelAction[][]>([]);
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
  const [svgFullContent, setSvgFullContent] = useState<string>("");
  const [miniSvgContent, setMiniSvgContent] = useState<string>("");
  const [isPickingColor, setIsPickingColor] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKeyboardShortcutsModalOpen, setIsKeyboardShortcutsModalOpen] =
    useState(false);
  const [isLoadTraitModalOpen, setIsLoadTraitModalOpen] = useState(false);
  const [traitName, setTraitName] = useState("");

  const canvasRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const traitNameRef = useRef<HTMLInputElement>(null);

  const traitTypes = [
    "Head",
    "Hair",
    "Face",
    "Accessory",
    "Top",
    "Bottom",
    "Shoes",
  ];
  const [currentTraitIndex, setCurrentTraitIndex] = useState(0);

  const handleTraitTypeChange = (newTraitType: string) => {
    const newIndex = traitTypes.indexOf(newTraitType);
    if (newIndex !== -1) {
      setCurrentTraitIndex(newIndex);
    }
  };

  useEffect(() => {
    updateTextArea();
  }, [gridData]);

  useEffect(() => {
    const storedColors = localStorage.getItem("chonksstudio");

    if (storedColors) {
      setAdditionalColors(JSON.parse(storedColors));
    } else {
      localStorage.setItem("chonksstudio", JSON.stringify([]));
      setAdditionalColors([]);
    }
  }, []);

  const [currentAction, setCurrentAction] = useState<PixelAction[]>([]);

  // Add a new state for redoStack
  const [redoStack, setRedoStack] = useState<PixelAction[][]>([]);

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
      setCurrentAction((prevAction) => [
        ...prevAction,
        {
          x,
          y,
          oldColor: oldPixel.color || "",
          newColor,
        },
      ]);
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
      setRedoStack([]); // Clear redoStack
      setCurrentAction([]);
    }
  }, [currentAction]);

  // Add a ref to track the Shift key state
  const shiftKeyRef = useRef<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        shiftKeyRef.current = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        shiftKeyRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Update handleMouseDown to check if Shift key is pressed
  const handleMouseDown = (event: React.MouseEvent) => {
    setIsMouseDown(true);
    const { x, y } = getPixelCoordinates(event);
    const isErasing = shiftKeyRef.current || event.button === 2;
    handlePixelChange(x, y, isErasing);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setLastModifiedPixel(null);
    completeAction();
  };

  // Update handleMouseMove to use shiftKeyRef
  const handleMouseMove = (event: React.MouseEvent) => {
    const { x, y } = getPixelCoordinates(event);
    setHoveredPixel({ x, y });
    if (isMouseDown) {
      const isErasing = shiftKeyRef.current || event.buttons === 2;
      handlePixelChange(x, y, isErasing);
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

  const getCoordinates = (
    clientX: number,
    clientY: number,
    rect: DOMRect
  ): { x: number; y: number } => {
    const pixelWidth = rect.width / gridSize;
    const pixelHeight = rect.height / gridSize;

    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    const x = Math.floor(relativeX / pixelWidth);
    const y = Math.floor(relativeY / pixelHeight);

    return {
      x: Math.max(0, Math.min(x, gridSize - 1)),
      y: Math.max(0, Math.min(y, gridSize - 1)),
    };
  };

  const getPixelCoordinates = (
    event: React.MouseEvent
  ): { x: number; y: number } => {
    if (!gridRef.current) return { x: -1, y: -1 };
    const rect = gridRef.current.getBoundingClientRect();
    return getCoordinates(event.clientX, event.clientY, rect);
  };

  const getTouchPixelCoordinates = (
    event: React.TouchEvent
  ): { x: number; y: number } => {
    if (!gridRef.current) return { x: -1, y: -1 };
    const rect = gridRef.current.getBoundingClientRect();
    const touch = event.touches[0];
    return getCoordinates(touch.clientX, touch.clientY, rect);
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

  const resetGrid = () => {
    setHistory(() => []);
    setGridData(generateGrid());
  };

  const undo = useCallback(() => {
    if (history.length > 0) {
      const lastAction = history[history.length - 1];
      setGridData((prevGrid) =>
        prevGrid.map((pixel) => {
          const actionPixel = lastAction.find(
            (p) => p.x === pixel.x && p.y === pixel.y
          );
          return actionPixel
            ? { ...pixel, color: actionPixel.oldColor }
            : pixel;
        })
      );
      setHistory((prevHistory) => prevHistory.slice(0, -1));
      setRedoStack((prevRedoStack) => [...prevRedoStack, lastAction]);
    }
  }, [history]);

  // Implement redo functionality
  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const lastUndoneAction = redoStack[redoStack.length - 1];
      setGridData((prevGrid) =>
        prevGrid.map((pixel) => {
          const actionPixel = lastUndoneAction.find(
            (p) => p.x === pixel.x && p.y === pixel.y
          );
          return actionPixel
            ? { ...pixel, color: actionPixel.newColor }
            : pixel;
        })
      );
      setHistory((prevHistory) => [...prevHistory, lastUndoneAction]);
      setRedoStack((prevRedoStack) => prevRedoStack.slice(0, -1));
    }
  }, [redoStack]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

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

  const generateSVG = (
    gridColors: string[][],
    mini: boolean = false,
    showBackgroundAndBody: boolean = false
  ): string => {
    const pixelSize = mini ? 1 : 10;
    const width = gridColors[0].length * pixelSize;
    const height = gridColors.length * pixelSize;

    let svgContent = `<svg width="${width}" height="${height}"  shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">`;

    if (showBackgroundAndBody) {
      svgContent +=
        "<style>body,svg{background-color: " +
        backgroundColor +
        "} .bg{width: " +
        width * 30 +
        "px; height: " +
        height * 30 +
        "px; fill: " +
        backgroundColor +
        "}</style>";

      svgContent += '<rect class="bg"/>';

      const bodySVG = bodies.bodies.find(
        (body) =>
          body.path ===
          (backgroundBody === "ghost.svg" ? "skinTone1.svg" : backgroundBody)
      );

      if (bodySVG && bodySVG.colorMap) {
        if (backgroundBody === "ghost.svg") svgContent += '<g opacity="0.5">';

        const byteArray = bodySVG.colorMap.match(/.{1,2}/g) || [];
        let index = 0;

        while (index < byteArray.length) {
          const x = parseInt(byteArray[index], 16);
          const y = parseInt(byteArray[index + 1], 16);
          const color = `#${byteArray[index + 2]}${byteArray[index + 3]}${
            byteArray[index + 4]
          }`;

          if (x >= 0 && x < 30 && y >= 0 && y < 30) {
            svgContent += `<rect x="${x * pixelSize}" y="${
              y * pixelSize
            }" width="${pixelSize}" height="${pixelSize}" fill="${color}" />`;
          }

          index += 5;
        }
        if (backgroundBody === "ghost.svg") svgContent += "</g>";
      }
    }

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
    if (textAreaContent === "") return;

    try {
      const gridColors = JSON.parse(textAreaContent);
      const newSvgContent = generateSVG(gridColors, false, false);
      setSvgContent(newSvgContent);

      const mini = generateSVG(gridColors, true);
      setMiniSvgContent(mini);

      const full = generateSVG(gridColors, false, true);
      setSvgFullContent(full);
    } catch (error) {
      console.error("Error generating SVG:", error);
    }
  };

  const takeScreenshot = (): Promise<string> => {
    return new Promise((resolve) => {
      if (canvasRef.current) {
        html2canvas(canvasRef.current, { backgroundColor: null }).then(
          (canvas) => {
            const imageData = canvas.toDataURL("image/png");

            resolve(imageData);
          }
        );
      } else {
        resolve(""); // Resolve with empty string if canvas ref is not available
      }
    });
  };

  const generatePNG = (gridColors: string[][]): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve("");

      // Set canvas size to 1440x1440 (30 * 48)
      const pixelScale = 48; // 1440/30 = 48
      canvas.width = gridSize * pixelScale;
      canvas.height = gridSize * pixelScale;

      // Make background transparent
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw each pixel scaled up to 48x48
      gridColors.forEach((row, y) => {
        row.forEach((color, x) => {
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(
              x * pixelScale,
              y * pixelScale,
              pixelScale,
              pixelScale
            );
          }
        });
      });

      // Convert to PNG data URL with transparency
      resolve(canvas.toDataURL("image/png"));
    });
  };

  const downloadSVG = async () => {
    const zip = new JSZip();
    const folder = zip.folder("My Chonk");

    if (showGrid) setShowGrid(false);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (folder) {
      folder.file("chonk-traits-transparent.svg", svgContent);

      folder.file("chonk.svg", svgFullContent);

      const dummyData = {
        traitName,
        traitType: traitTypes[currentTraitIndex],
        creator: address ?? "0x",
        bytes: parseSvgToBytes(miniSvgContent),
        createdOn: new Date().toISOString(),
      };

      folder.file("metadata.json", JSON.stringify(dummyData, null, 2));

      // Generate both PNG versions
      const screenshotData = await takeScreenshot();
      if (screenshotData) {
        folder.file("chonk.png", screenshotData.split(",")[1], {
          base64: true,
        });
      }

      // Add the transparent PNG
      const gridColors = JSON.parse(textAreaContent);
      const transparentPNG = await generatePNG(gridColors);
      folder.file(
        "chonk-traits-transparent.png",
        transparentPNG.split(",")[1],
        { base64: true }
      );

      const readmeContent = `# My Chonk

This folder contains:
1. chonk.png - The Chonk you created in Chonks Studio. Share it on social, use it as your PFP, remix, play, have fun!
2. chonk.svg - These are just the pixels you drew.
3. metadata.json - Metadata for your Chonk. Save this for later. Just in case.

Thanks for playing! We look forward to seeing what you create.

Follow @chonksxyz on X to stay up to date, as we get closer to mint in late October.

– Backseats and Marka`;
      folder.file("README.md", readmeContent);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Chonk_${traitName}.zip`);
    }
  };

  const handleBytes = () => {
    const bytes = parseSvgToBytes(miniSvgContent);
    // console.log("bytes", bytes);
    navigator.clipboard.writeText(bytes);
  };

  useEffect(
    () => updateSVG(),
    [backgroundBody, textAreaContent, backgroundColor]
  );

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
      if (traitNameRef.current) {
        traitNameRef.current.focus();
      }
    }, 0);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Handle form submission logic here

    downloadSVG(); // use this for now
    closeModal();
  };

  const handleModalBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const openKeyboardShortcutsModal = () =>
    setIsKeyboardShortcutsModalOpen(true);

  const closeKeyboardShortcutsModal = () => {
    setIsKeyboardShortcutsModalOpen(false);
    localStorage.setItem("hasSeenKeyboardShortcuts", "true");
  };

  const handleKeyboardShortcutsModalBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (e.target === e.currentTarget) closeKeyboardShortcutsModal();
  };

  const openLoadTraitModal = () => setIsLoadTraitModalOpen(true);
  const closeLoadTraitModal = () => setIsLoadTraitModalOpen(false);

  const loadRandomChonk = () => {
    console.log("=== loadRandomChonk ===");
    const mainCategories = ["Shoes", "Bottom", "Top", "Hair"];
    const rngCategories = ["Face", "Head", "Accessory"];
    // const rngCategories = ["Head"]; // looking at just head traits for now....
    const backgroundColors = [
      "#EAD9D9",
      "#E2CACA",
      "#FF80CA",
      "#28b143",
      "#69B8FF",
      "#F36464",
    ];
    const backgroundBodies = [
      "skinTone1.svg",
      "skinTone2.svg",
      "skinTone3.svg",
      "skinTone4.svg",
      "skinTone5.svg",
    ];

    if (Math.random() < 0.5)
      setBackgroundColor(
        backgroundColors[Math.floor(Math.random() * backgroundColors.length)]
      );
    else setBackgroundColor("#0D6E9D"); // default background color
    console.log("backgroundColor", backgroundColor);

    let randomBackgroundBody =
      backgroundBodies[Math.floor(Math.random() * backgroundBodies.length)];
    setBackgroundBody(randomBackgroundBody);
    console.log("backgroundBody", backgroundBody);

    // Load main categories first
    mainCategories.forEach((category, i) => {
      const categoryTraits = traits.traits.filter(
        (trait) => trait.category === category
      );
      if (categoryTraits.length > 0) {
        const randomTrait =
          categoryTraits[Math.floor(Math.random() * categoryTraits.length)];
        console.log(
          "main category trait: ",
          randomTrait.name + "(" + randomTrait.category + ")"
        );
        loadTrait(randomTrait.colorMap, 0, 0, i !== 0);
      }
    });

    rngCategories.forEach((category) => {
      if (Math.random() < 0.5) {
        const categoryTraits = traits.traits.filter(
          (trait) => trait.category === category
        );
        if (categoryTraits.length > 0) {
          const randomTrait =
            categoryTraits[Math.floor(Math.random() * categoryTraits.length)];
          console.log(
            "rng category trait: ",
            randomTrait.name + "(" + randomTrait.category + ")"
          );
          loadTrait(randomTrait.colorMap, 0, 0, true);
        }
      }
    });
  };

  const handleLoadTraitModalBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (e.target === e.currentTarget) closeLoadTraitModal();
  };

  // Translate bytes into a 30x30 grid of colors
  const loadTrait = (
    bytes: string,
    xOffset: number,
    yOffset: number,
    affix: boolean = false
  ) => {
    // console.log('affix: ', affix);
    // affix = true;
    // Initialize a 30x30 array filled with empty strings
    const colorGrid: string[][] = Array(30)
      .fill(null)
      .map(() => Array(30).fill(""));

    // Split the bytes string into individual byte strings
    const byteArray = bytes.match(/.{1,2}/g) || [];

    let index = 0;
    while (index < byteArray.length) {
      const x = parseInt(byteArray[index], 16);
      const y = parseInt(byteArray[index + 1], 16);
      const color = `#${byteArray[index + 2]}${byteArray[index + 3]}${
        byteArray[index + 4]
      }`;

      // Check if x and y are within bounds (0-29)
      if (x >= 0 && x < 30 && y >= 0 && y < 30) {
        colorGrid[y + yOffset][x + xOffset] = color;
      }

      index += 5; // Move to the next set of 5 bytes
    }

    // Update the gridData state with the new colors
    if (affix) {
      setGridData((prevGrid) =>
        generateGrid().map((pixel) => ({
          ...pixel,
          // Keep existing color if new color is empty, otherwise use new color
          color:
            colorGrid[pixel.y][pixel.x] ||
            prevGrid[pixel.y * gridSize + pixel.x].color,
        }))
      );
    } else {
      setGridData(
        generateGrid().map((pixel) => ({
          ...pixel,
          color: colorGrid[pixel.y][pixel.x],
        }))
      );
    }

    // Update the text area content
    setTextAreaContent(JSON.stringify(colorGrid, null, 2));
  };

  useEffect(() => {
    const hasSeenKeyboardShortcuts = localStorage.getItem(
      "hasSeenKeyboardShortcuts"
    );
    if (!hasSeenKeyboardShortcuts) {
      setIsKeyboardShortcutsModalOpen(true);
    }
  }, []);

  const updateGridColors = (oldColor: string, newColor: string) => {
    setGridData((prevGrid) =>
      prevGrid.map((pixel) =>
        pixel.color === oldColor ? { ...pixel, color: newColor } : pixel
      )
    );
  };

  return (
    <div className="bg-white">
      <MenuBar
        showGrid={showGrid}
        toggleGrid={toggleGrid}
        resetGrid={resetGrid}
        resetSavedColors={resetSavedColors}
        showLoadTraitModal={openLoadTraitModal}
        loadRandomChonk={loadRandomChonk}
      />

      {/* md:max-w-[1200px] gap-[75px] */}
      <div className="flex md:justify-center  md:mx-auto">
        <div className="flex flex-col md:flex-row  md:p-4 md:w-full">
          {/* left column */}
          <div className="flex flex-col gap-2 md:max-w-[420px] px-4">
            {/* <SVGPreview
              address={address}
              svgContent={svgContent}
              handleBytes={handleBytes}
              openModal={openModal}
            /> */}

            <SelectColor
              additionalColors={additionalColors}
              hasAdditionalColors={additionalColors?.length > 0}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              saveColorToPalette={saveColorToPalette}
              setBackgroundColor={setBackgroundColor}
              setBackgroundBody={setBackgroundBody}
              openKeyboardShortcutsModal={openKeyboardShortcutsModal}
              gridData={gridData}
              updateGridColors={updateGridColors}
            />
          </div>

          {/* Middle column */}
          <Canvas
            ref={canvasRef} // Pass the ref to the Canvas component
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
            selectedColor={selectedColor}
          />

          <div>
            <div>
              <SVGPreview
                address={address}
                svgContent={svgContent}
                handleBytes={handleBytes}
                openModal={openModal}
              />
            </div>

            <div className="border-t border-gray-200 pt-6  mt-6">
              <BodyPresets setBackgroundBody={setBackgroundBody} />

              <button
                className="mt-6 text-gray-500 text-sm text-right hover:underline hidden md:block"
                onClick={openKeyboardShortcutsModal}
              >
                <QuestionMarkCircleIcon className="w-4 h-4 -mt-1 mr-1 inline-block" />
                Keyboard Shortcuts, Tips & Tricks
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <MetadataModal
          traitName={traitName}
          setTraitName={setTraitName}
          traitType={traitTypes[currentTraitIndex]}
          traitTypes={traitTypes}
          closeModal={closeModal}
          handleSubmit={handleSubmit}
          traitNameRef={traitNameRef}
          handleModalBackgroundClick={handleModalBackgroundClick}
          onTraitTypeChange={handleTraitTypeChange}
          address={address}
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

      {isLoadTraitModalOpen && (
        <LoadTraitModal
          closeModal={closeLoadTraitModal}
          handleModalBackgroundClick={handleLoadTraitModalBackgroundClick}
          // loadTrait={(bytes: string) => loadTrait(bytes, 0, 0, true)}
          loadTrait={loadTrait}
        />
      )}
    </div>
  );
};

export default Grid;
