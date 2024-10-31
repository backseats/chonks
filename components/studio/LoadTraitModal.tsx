import React, { useState, useRef, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import traits from '../../contracts/csv-conversion/latest.json';

interface Props {
  closeModal: () => void;
  handleModalBackgroundClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  loadTrait: (bytes: string, xOffset: number, yOffset: number, affix?: boolean) => void;
}

export default function LoadTraitModal({
  closeModal,
  handleModalBackgroundClick,
  loadTrait,
}: Props) {
  const [bytesInput, setBytesInput] = useState("");
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedTrait, setSelectedTrait] = useState("");

  const [showRandomButton, setShowRandomButton] = React.useState(false);

  const [clearCanvas, setClearCanvas] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowRandomButton(params.get('loadRandomChonk') === 'true');
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    loadTrait(bytesInput, xOffset, yOffset, !clearCanvas);
    closeModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleTraitSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBytes = e.target.value;
    if (selectedBytes) {
      loadTrait(selectedBytes, 0, 0, !clearCanvas);
      closeModal();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleModalBackgroundClick}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-medium">Load Trait</h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="clear-canvas"
                checked={clearCanvas}
                onChange={(e) => setClearCanvas(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="clear-canvas" className="text-sm text-gray-700">
                Clear Canvas When Adding
              </label>
            </div>
            <textarea
              id="bytes-input"
              ref={textareaRef}
              value={bytesInput}
              onChange={(e) => setBytesInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 min-h-[200px] text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Paste trait bytes here"
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="w-1/2">
              <label htmlFor="x-offset" className="block text-sm font-medium text-gray-700 mb-1">
                X Offset
              </label>
              <input
                type="number"
                id="x-offset" 
                className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="0"
                onChange={(e) => setXOffset(parseInt(e.target.value))}
              />
            </div>
            <div className="w-1/2">
              <label htmlFor="y-offset" className="block text-sm font-medium text-gray-700 mb-1">
                Y Offset
              </label>
              <input
                type="number"
                id="y-offset"
                className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="0"
                onChange={(e) => setYOffset(parseInt(e.target.value))}
              />
            </div>
          </div>

          

          <button
            type="submit"
            className="w-full bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Load Trait
          </button>

          {(process.env.NODE_ENV === 'development' || showRandomButton) && (
          <div className="my-6 border-t border-gray-300 pt-4">
            <label htmlFor="trait-select" className="block text-sm font-medium text-gray-700 mb-1">
              Load Pre-existing Trait
            </label>
            <select
              id="trait-select"
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
              value={selectedTrait}
              onChange={handleTraitSelect}
            >
              <option value="">Select...</option>
              {traits.traits.map((trait, index) => (
                <option key={index} value={trait.colorMap}>
                  {trait.name} :: {trait.category}
                </option>
              ))}
            </select>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
