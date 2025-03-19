export enum Category {
  None = "None", // 0
  Head = "Head", // 1
  Hair = "Hair", // 2
  Face = "Face", // 3
  Accessory = "Accessory", // 4
  Top = "Top", // 5
  Bottom = "Bottom", // 6
  Shoes = "Shoes", // 7
}

export function getCategoryString(categoryNumber: number): string {
  const categoryMap: Record<number, string> = {
    0: "None",
    1: "Head",
    2: "Hair",
    3: "Face",
    4: "Accessory",
    5: "Top",
    6: "Bottom",
    7: "Shoes"
  };

  return categoryMap[categoryNumber] || "None";
}
