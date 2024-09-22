export function isLightColor(color: string): boolean {
  // Convert hex to RGB
  let r, g, b;
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    r = parseInt(hex.substr(0, 2), 16);
    g = parseInt(hex.substr(2, 2), 16);
    b = parseInt(hex.substr(4, 2), 16);
  } else {
    // Assume it's an rgb/rgba color
    const match = color.match(/\d+/g);
    if (match) {
      [r, g, b] = match.map(Number);
    } else {
      return false; // Invalid color format
    }
  }

  // Calculate perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return true if the color is light (brightness > 128)
  return brightness > 128;
}
