import React from "react";

interface Props {
  resetGrid: () => void;
  resetSavedColors: () => void;
  toggleGrid: () => void;
}

export default function Menu(props: Props) {
  const { resetGrid, resetSavedColors, toggleGrid } = props;

  return (
    <>
      <h2 className="text-xl font-bold">Menu</h2>

      <div className="px-3"></div>
    </>
  );
}
