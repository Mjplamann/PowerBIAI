export const colorPalettes = {
  corporate: {
    name: 'Corporate Blue',
    colors: ['#0078D4', '#106EBE', '#005A9E', '#004578', '#003152']
  },
  vibrant: {
    name: 'Vibrant Mix',
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
  },
  earthy: {
    name: 'Earthy Tones',
    colors: ['#8B7355', '#A0826D', '#B8927D', '#C9A88B', '#D8BF99']
  },
  modern: {
    name: 'Modern Purple',
    colors: ['#6C5CE7', '#A29BFE', '#5F27CD', '#341F97', '#8395A7']
  },
  sunset: {
    name: 'Sunset',
    colors: ['#FD7272', '#F9CA24', '#F0932B', '#EB4D4B', '#6C5CE7']
  },
  ocean: {
    name: 'Ocean Blue',
    colors: ['#0984E3', '#74B9FF', '#0652DD', '#1E3799', '#3C6382']
  },
  forest: {
    name: 'Forest Green',
    colors: ['#00B894', '#55EFC4', '#00856F', '#05C46B', '#0BE881']
  },
  berry: {
    name: 'Berry',
    colors: ['#E056FD', '#C44569', '#F8B500', '#E17055', '#FDA7DF']
  },
  monochrome: {
    name: 'Monochrome',
    colors: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7']
  },
  pastel: {
    name: 'Pastel Dreams',
    colors: ['#A8E6CF', '#FFD3B6', '#FFAAA5', '#FF8B94', '#C7CEEA']
  }
};

export const generateColorPalette = (brandColor) => {
  // Simple color palette generation from a single brand color
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };
  
  const rgb = hexToRgb(brandColor);
  if (!rgb) return colorPalettes.corporate.colors;
  
  const palette = [
    brandColor,
    rgbToHex(Math.min(255, rgb.r + 30), Math.min(255, rgb.g + 30), Math.min(255, rgb.b + 30)),
    rgbToHex(Math.max(0, rgb.r - 30), Math.max(0, rgb.g - 30), Math.max(0, rgb.b - 30)),
    rgbToHex(Math.max(0, rgb.r - 60), Math.max(0, rgb.g - 60), Math.max(0, rgb.b - 60)),
    rgbToHex(Math.max(0, rgb.r - 90), Math.max(0, rgb.g - 90), Math.max(0, rgb.b - 90))
  ];
  
  return palette;
};

export const getColorPalette = (paletteName) => {
  return colorPalettes[paletteName] || colorPalettes.corporate;
};
