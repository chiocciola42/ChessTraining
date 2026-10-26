import React, { useId } from 'react';
import { PieceThemeId, PIECE_THEMES } from '../utils/themes';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

interface ChessPieceProps {
  type: PieceType;
  color: PieceColor;
  pieceTheme?: PieceThemeId;
  className?: string;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({
  type,
  color,
  pieceTheme = 'staunton',
  className = 'w-full h-full',
}) => {
  const isWhite = color === 'w';
  const themeObj = PIECE_THEMES.find((t) => t.id === pieceTheme) || PIECE_THEMES[0];

  const gradId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const baseFill = isWhite ? themeObj.whiteFill : themeObj.blackFill;
  const highlight = isWhite ? themeObj.whiteHighlight : themeObj.blackHighlight;
  const fill = `url(#${gradId})`;
  const stroke = isWhite ? themeObj.whiteStroke : themeObj.blackStroke;
  const innerLine = isWhite ? themeObj.whiteStroke : themeObj.blackHighlight;

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${className} transition-transform duration-150 select-none pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)]`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Cylindrical lathe-turned shading: light from upper left, soft core shadow on the right */}
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0.15">
          <stop offset="0%" style={{ stopColor: `color-mix(in srgb, ${baseFill} 55%, black)` }} />
          <stop offset="22%" style={{ stopColor: highlight }} />
          <stop offset="45%" style={{ stopColor: baseFill }} />
          <stop offset="78%" style={{ stopColor: `color-mix(in srgb, ${baseFill} 72%, black)` }} />
          <stop offset="100%" style={{ stopColor: `color-mix(in srgb, ${baseFill} 45%, black)` }} />
        </linearGradient>
      </defs>
      {type === 'p' && (
        <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round' }}>
          <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 L 34,39.5 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" />
          <path d="m 18,21 a 4.5,4.5 0 0 1 9,0" style={{ fill: 'none', stroke: innerLine }} />
        </g>
      )}

      {type === 'r' && (
        <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
          <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
          <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
          <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
          <path d="M 14,29.5 L 11,32 L 34,32 L 31,29.5" />
          <path d="M 14,17 L 31,17" style={{ fill: 'none', stroke: innerLine }} />
          <path d="M 14,29.5 L 31,29.5" style={{ fill: 'none', stroke: innerLine }} />
        </g>
      )}

      {type === 'n' && (
        <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
          <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 20.5,5 22,10 z" />
          <circle cx="15.5" cy="15" r="1.5" style={{ fill: isWhite ? '#0f172a' : '#f8fafc', stroke: 'none' }} />
          <path d="M 24,18 C 21,21 16,21 14,18" style={{ fill: 'none', stroke: innerLine }} />
        </g>
      )}

      {type === 'b' && (
        <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
          <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
          <circle cx="22.5" cy="8.5" r="1.5" />
          <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style={{ fill: 'none', stroke: innerLine }} />
        </g>
      )}

      {type === 'q' && (
        <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.5 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.5 L 14,25 L 6.5,13.5 z" />
          <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="14" cy="9" r="2" />
          <circle cx="22.5" cy="8" r="2" />
          <circle cx="31" cy="9" r="2" />
          <circle cx="39" cy="12" r="2" />
          <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" style={{ fill: 'none', stroke: innerLine }} />
          <path d="M 11,29 A 35,35 1 0 1 34,29" style={{ fill: 'none', stroke: innerLine }} />
        </g>
      )}

      {type === 'k' && (
        <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M 22.5,11.63 L 22.5,6" style={{ fill: 'none' }} />
          <path d="M 20,8 L 25,8" style={{ fill: 'none' }} />
          <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z" />
          <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,34 38.5,26.5 36.5,22 C 34.5,17.5 29,15.5 26.5,18 C 24,20.5 25.5,25 22.5,25 C 19.5,25 21,20.5 18.5,18 C 16,15.5 10.5,17.5 8.5,22 C 6.5,26.5 8.5,34 11.5,37 z" />
          <path d="M 11.5,30 C 17,27 28,27 33.5,30" style={{ fill: 'none', stroke: innerLine }} />
          <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" style={{ fill: 'none', stroke: innerLine }} />
          <path d="M 11.5,37 C 17,34 28,34 33.5,37" style={{ fill: 'none', stroke: innerLine }} />
        </g>
      )}
    </svg>
  );
};
