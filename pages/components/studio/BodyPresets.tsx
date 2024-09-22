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
        <div className="flex flex-col gap-2 px-3">
          <button
            onClick={() => setBackgroundBody("ghost.svg")}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:brightness-[70%] transition-colors"
          >
            Body With Opacity
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setBackgroundBody("superlightbody.svg")}
              className="px-4 py-2 bg-[#EAD9D9] text-black rounded hover:brightness-[105%] transition-colors"
            >
              Super Light Body
            </button>
            <button
              onClick={() => setBackgroundBody("lightbody.svg")}
              className="px-4 py-2 bg-[#EFB15D] text-black rounded hover:brightness-[105%] transition-colors"
            >
              Light Body
            </button>
            <button
              onClick={() => setBackgroundBody("midbody.svg")}
              className="px-4 py-2 bg-[#BB8136] text-white rounded hover:brightness-[105%] transition-colors"
            >
              Mid Body
            </button>
            <button
              onClick={() => setBackgroundBody("darkbody.svg")}
              className="px-4 py-2 bg-[#8B5E24] text-white rounded hover:brightness-[105%] transition-colors"
            >
              Dark Body
            </button>
          </div>
        </div>
      )}
    </>
  );
}
