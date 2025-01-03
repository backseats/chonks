import React, { useState } from "react";
import { useRouter } from "next/router";
import ChonkRenderer from "../components/ChonkRenderer";

export default function Mini() {
  const router = useRouter();
  const [textInput, setTextInput] = useState<string>("");

  return (
    <div className="flex gap-8 p-8">
      <ChonkRenderer
        size={
          router.query.size ? parseInt(router.query.size as string) : undefined
        }
        bytes={textInput}
      />

      {/* Input Section */}
      <div className="flex flex-col gap-4">
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="w-96 h-96 p-4 border border-gray-300 rounded"
          placeholder="Paste trait bytes here"
        />
        <div className="flex gap-4">
          <button
            onClick={() => {
              // Force a re-render by setting the state
              setTextInput(textInput);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
