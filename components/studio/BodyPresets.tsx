import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface Props {
  setBackgroundBody: (body: string) => void;
}

export default function BodyPresets({ setBackgroundBody }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <h2
        className="text-lg font-medium cursor-pointer flex justify-between bg-gray-100 p-2"
        onClick={toggleCollapse}
      >
        Body Presets
        <span className="ml-2 pt-1">
          {isCollapsed ? (
            <ChevronDownIcon className="w-6 h-6" />
          ) : (
            <ChevronUpIcon className="w-6 h-6" />
          )}
        </span>
      </h2>

      {!isCollapsed && (
        
         

          <div className="grid grid-cols-2 gap-2">

          <button
            onClick={() => setBackgroundBody("ghost.svg")}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:brightness-[70%] transition-colors"
          >
            Transparent Skin
          </button>
           
            <button
              onClick={() => setBackgroundBody("skinTone1.svg")}
              className="px-4 py-2 bg-[#EFB15D] text-black rounded hover:brightness-[105%] transition-colors"
            >
              Skin Tone 1
            </button>
            <button
              onClick={() => setBackgroundBody("skinTone2.svg")}
              className="px-4 py-2 bg-[#BB8136] text-white rounded hover:brightness-[105%] transition-colors"
            >
              Skin Tone 2
            </button>
            <button
              onClick={() => setBackgroundBody("skinTone3.svg")}
              className="px-4 py-2 bg-[#8B5E24] text-white rounded hover:brightness-[105%] transition-colors"
            >
              Skin Tone 3
            </button>
            <button
              onClick={() => setBackgroundBody("skinTone4.svg")}
              className="px-4 py-2 bg-[#EAD9D9] text-black rounded hover:brightness-[105%] transition-colors"
            >
              Skin Tone 4
            </button>
            <button
              onClick={() => setBackgroundBody("skinTone5.svg")}
              className="px-4 py-2 bg-[#3C290F] text-white rounded hover:brightness-[105%] transition-colors"
            >
              Skin Tone 5
            </button>
          </div>
       
      )}
    </>
  );
}
