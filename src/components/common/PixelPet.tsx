import React from 'react';

interface PixelPetProps {
  size?: number; // size in px
  className?: string;
}

export const PixelPet: React.FC<PixelPetProps> = ({ size = 96, className = '' }) => {
  // 16x16 Pixel Grid of "โมจิ จิ้งจอกใบไม้"
  // 0: transparent, 1: outline dark green (#19381f), 2: leaf green (#74c476), 3: light lime green (#a1d99b), 4: dark eye (#081d0c), 5: white eye shine (#ffffff)
  const grid = [
    [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
    [0,0,1,2,2,1,0,0,0,0,1,2,2,1,0,0],
    [0,1,2,3,2,2,1,0,0,1,2,2,3,2,1,0],
    [0,1,2,3,2,2,2,1,1,2,2,2,3,2,1,0],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,2,4,4,2,2,2,2,2,2,4,4,2,2,1],
    [1,2,4,5,4,2,2,2,2,2,2,4,5,4,2,1],
    [1,2,4,4,4,2,2,4,4,2,2,4,4,4,2,1],
    [1,2,2,2,2,2,2,4,4,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,1,1,1,1,2,2,2,2,2,1],
    [0,1,2,2,2,1,3,3,3,3,1,2,2,2,1,0],
    [0,1,2,2,2,2,1,1,1,1,2,2,2,2,1,0],
    [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
    [0,0,0,1,1,2,2,2,2,2,2,1,1,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  ];

  const colorMap: Record<number, string> = {
    0: 'transparent',
    1: '#14361b', // Dark green outline
    2: '#52a447', // Main body green
    3: '#9ae28b', // Light green ear inside / cheeks
    4: '#0d1f11', // Eyes & snout
    5: '#ffffff', // Eye sparkle
  };

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-block select-none image-pixelated ${className}`}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        style={{ shapeRendering: 'crispEdges' }}
      >
        {grid.map((row, y) =>
          row.map((val, x) => {
            if (val === 0) return null;
            return (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={colorMap[val]}
              />
            );
          })
        )}
      </svg>
    </div>
  );
};
