import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
  closeModal: () => void;
  handleModalBackgroundClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const shortcuts = [
  { key: "Ctrl/Cmd + Z", description: "Undo last action" },
  { key: "Left Click", description: "Draw pixel" },
  { key: "Right Click", description: "Erase pixel" },
  // Add more shortcuts as needed
];

export default function KeyboardShortcutsModal({
  closeModal,
  handleModalBackgroundClick,
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleModalBackgroundClick}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-medium">Keyboard Shortcuts</h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Shortcuts List */}
        <ul className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <li key={index} className="flex justify-between items-center">
              <span className="font-medium">{shortcut.key}</span>
              <span className="text-gray-600">{shortcut.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
