import { createPortal } from 'react-dom';
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessPiece, PieceType, PieceColor } from './ChessPiece';
import { BoardThemeId, PieceThemeId, BOARD_THEMES } from '../utils/themes';

export interface MoveOption {
  to: string;
  isCapture: boolean;
  san?: string;
}

export interface ChessBoardProps {
  /**
   * chess.js Game instance (preferred) OR standard FEN string
   */
  game?: Chess;
  fen?: string;

  /**
   * Perspective: 'w' (White on bottom) or 'b' (Black on bottom)
   */
  orientation?: 'w' | 'b';

  /**
   * Visual themes
   */
  boardTheme?: BoardThemeId;
  pieceTheme?: PieceThemeId;

  /**
   * Current selected square (if externally controlled)
   */
  selectedSquare?: string | null;

  /**
   * Optional externally provided legal moves; if not provided,
   * Chessboard computes them automatically using chess.js!
   */
  legalMoves?: MoveOption[];

  /**
   * Last move squares to highlight { from: "e2", to: "e4" }
   */
  lastMove?: { from: string; to: string } | null;

  /**
   * Square of King currently under check
   */
  checkSquare?: string | null;

  /**
   * Custom educational/tutorial target squares to highlight
   */
  highlightSquares?: string[];

  /**
   * Squares of player pieces under attack
   */
  threatenedSquares?: string[];

  /**
   * Recommended hint move { from, to }
   */
  suggestedMove?: { from: string; to: string } | null;

  /**
   * Whether the board allows dragging and clicking
   */
  interactive?: boolean;

  /**
   * Callback invoked when a square is clicked/tapped
   */
  onSquareClick?: (square: string) => void;

  /**
   * Callback invoked when a piece is dropped or tapped onto a valid square
   */
  onMove?: (from: string, to: string) => void;

  /**
   * Show/hide algebraic coordinates (a-h, 1-8)
   */
  showCoordinates?: boolean;

  /**
   * Additional Tailwind class names for container
   */
  className?: string;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// Subtle streaked wood grain, generated once as an alpha-only SVG noise tile
const WOOD_GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.32' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 0.12  0 0 0 0 0.06  0 0 0 0 0.02  0 0 0 0.55 -0.16'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export const Chessboard: React.FC<ChessBoardProps> = ({
  game,
  fen,
  orientation = 'w',
  boardTheme = 'wood',
  pieceTheme = 'staunton',
  selectedSquare: externalSelectedSquare,
  legalMoves: externalLegalMoves,
  lastMove,
  checkSquare: externalCheckSquare,
  highlightSquares = [],
  threatenedSquares = [],
  suggestedMove,
  interactive = true,
  onSquareClick,
  onMove,
  showCoordinates = true,
  className = '',
}) => {
  // Internal state for selected square when not controlled externally
  const [internalSelectedSquare, setInternalSelectedSquare] = useState<string | null>(null);
  const selectedSquare = externalSelectedSquare !== undefined ? externalSelectedSquare : internalSelectedSquare;

  // Selected board theme configuration
  const currentBoardTheme = useMemo(() => {
    return BOARD_THEMES.find((t) => t.id === boardTheme) || BOARD_THEMES[0];
  }, [boardTheme]);

  // Active FEN string
  const currentFen = useMemo(() => {
    if (game) return game.fen();
    if (fen) return fen;
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }, [game, fen]);

  // Synchronized chess.js instance for move validation and legal moves calculation
  const chessInstance = useMemo(() => {
    if (game) return game;
    try {
      return new Chess(currentFen);
    } catch {
      return null;
    }
  }, [game, currentFen]);

  // Compute legal moves with chess.js for the selected square
  const activeLegalMoves: MoveOption[] = useMemo(() => {
    if (externalLegalMoves && externalLegalMoves.length > 0) {
      return externalLegalMoves;
    }

    if (!selectedSquare || !chessInstance) return [];

    try {
      const moves = chessInstance.moves({ square: selectedSquare as Square, verbose: true });
      return moves.map((m) => ({
        to: m.to,
        isCapture: !!m.captured,
        san: m.san,
      }));
    } catch {
      return [];
    }
  }, [externalLegalMoves, selectedSquare, chessInstance]);

  // Auto-detect king under check with chess.js
  const autoCheckSquare = useMemo(() => {
    if (externalCheckSquare !== undefined) return externalCheckSquare;
    if (!chessInstance || !chessInstance.isCheck()) return null;

    const board = chessInstance.board();
    const turn = chessInstance.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          return `${String.fromCharCode(97 + c)}${8 - r}`;
        }
      }
    }
    return null;
  }, [externalCheckSquare, chessInstance]);

  // Build custom square styles dictionary for react-chessboard
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // 1. Last move from / to
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(250, 204, 21, 0.35)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(250, 204, 21, 0.35)' };
    }

    // 2. Custom educational / tutorial target highlights
    highlightSquares.forEach((sq) => {
      styles[sq] = {
        backgroundColor: 'rgba(52, 211, 153, 0.4)',
        boxShadow: 'inset 0 0 0 2px rgba(52, 211, 153, 0.9)',
      };
    });

    // 3. Threatened squares in assisted mode
    threatenedSquares.forEach((sq) => {
      styles[sq] = {
        boxShadow: 'inset 0 0 0 3px rgba(244, 63, 94, 0.8)',
        backgroundColor: 'rgba(244, 63, 94, 0.25)',
      };
    });

    // 4. Suggested move (hint)
    if (suggestedMove) {
      styles[suggestedMove.from] = {
        backgroundColor: 'rgba(34, 211, 238, 0.4)',
        boxShadow: 'inset 0 0 0 2px rgba(34, 211, 238, 0.8)',
      };
      styles[suggestedMove.to] = {
        backgroundColor: 'rgba(34, 211, 238, 0.4)',
        boxShadow: 'inset 0 0 0 2px rgba(34, 211, 238, 0.8)',
      };
    }

    // 5. Selected square highlight
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(251, 191, 36, 0.55)',
        boxShadow: 'inset 0 0 0 2px rgba(251, 191, 36, 0.9)',
      };
    }

    // 6. King under check red radial glow
    if (autoCheckSquare) {
      styles[autoCheckSquare] = {
        background: 'radial-gradient(circle, rgba(220, 38, 38, 0.85) 40%, rgba(220, 38, 38, 0.3) 70%, transparent 100%)',
        boxShadow: 'inset 0 0 0 2px rgba(239, 68, 68, 0.9)',
      };
    }

    // 7. Legal Moves Highlights (empty squares: dot, captures: red target ring)
    activeLegalMoves.forEach((move) => {
      if (move.isCapture) {
        styles[move.to] = {
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.35) 75%, transparent 80%)',
          boxShadow: 'inset 0 0 0 3px rgba(239, 68, 68, 0.85)',
          cursor: 'pointer',
        };
      } else {
        styles[move.to] = {
          background: 'radial-gradient(circle, rgba(15, 23, 42, 0.45) 24%, transparent 26%)',
          cursor: 'pointer',
        };
      }
    });

    return styles;
  }, [
    lastMove,
    highlightSquares,
    threatenedSquares,
    suggestedMove,
    selectedSquare,
    autoCheckSquare,
    activeLegalMoves,
  ]);

  // Pieces parsed straight from the FEN placement field
  const pieces = useMemo(() => {
    const map: Record<string, { type: PieceType; color: PieceColor }> = {};
    currentFen
      .split(' ')[0]
      .split('/')
      .forEach((row, r) => {
        let file = 0;
        for (const ch of row) {
          if (/\d/.test(ch)) {
            file += Number(ch);
          } else {
            map[`${FILES[file]}${8 - r}`] = {
              type: ch.toLowerCase() as PieceType,
              color: ch === ch.toLowerCase() ? 'b' : 'w',
            };
            file += 1;
          }
        }
      });
    return map;
  }, [currentFen]);

  // Squares in on-screen order (top-left first), flipped when Black is at the bottom
  const displaySquares = useMemo(() => {
    const out: { square: string; fileIdx: number; rank: number }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const fileIdx = orientation === 'w' ? c : 7 - c;
        const rank = orientation === 'w' ? 8 - r : r + 1;
        out.push({ square: `${FILES[fileIdx]}${rank}`, fileIdx, rank });
      }
    }
    return out;
  }, [orientation]);

  // Drop handler shared by drag-and-drop
  const handlePieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (!interactive || sourceSquare === targetSquare) return;

      if (chessInstance && !onMove) {
        const legal = chessInstance.moves({ square: sourceSquare as Square, verbose: true });
        if (!legal.some((m) => m.to === targetSquare)) {
          setInternalSelectedSquare(null);
          return;
        }
      }

      if (onMove) {
        onMove(sourceSquare, targetSquare);
      } else {
        onSquareClick?.(targetSquare);
      }
      setInternalSelectedSquare(null);
    },
    [interactive, chessInstance, onMove, onSquareClick]
  );

  // Click / tap-to-move
  const handleSquareClick = useCallback(
    (square: string) => {
      if (!interactive) return;

      if (selectedSquare && selectedSquare !== square) {
        const isLegalTarget = activeLegalMoves.some((m) => m.to === square);
        if (isLegalTarget) {
          if (onMove) {
            onMove(selectedSquare, square);
          } else {
            onSquareClick?.(square);
          }
          setInternalSelectedSquare(null);
          return;
        }
      }

      if (selectedSquare === square) {
        setInternalSelectedSquare(null);
      } else {
        setInternalSelectedSquare(square);
      }

      onSquareClick?.(square);
    },
    [interactive, selectedSquare, activeLegalMoves, onMove, onSquareClick]
  );

  // Pointer-driven drag: the ghost lives outside the tilted plane and the drop target is
  // resolved with elementFromPoint, which respects the 3D projection.
  const gridRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ square: string; x: number; y: number } | null>(null);
  const [drag, setDrag] = useState<{ square: string; x: number; y: number } | null>(null);

  const squareAt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    return el?.closest<HTMLElement>('[data-square]')?.dataset.square ?? null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || e.button > 0) return;
    const square = squareAt(e.clientX, e.clientY);
    if (!square) return;
    pending.current = { square, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pending.current;
    if (!start) return;
    if (drag) {
      setDrag({ ...drag, x: e.clientX, y: e.clientY });
      return;
    }
    if (pieces[start.square] && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) {
      if (selectedSquare !== start.square) {
        setInternalSelectedSquare(start.square);
        onSquareClick?.(start.square);
      }
      setDrag({ square: start.square, x: e.clientX, y: e.clientY });
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pending.current;
    pending.current = null;
    if (!start) return;
    if (drag) {
      const target = squareAt(e.clientX, e.clientY);
      setDrag(null);
      if (target) handlePieceDrop(drag.square, target);
      return;
    }
    const square = squareAt(e.clientX, e.clientY);
    if (square && square === start.square) handleSquareClick(square);
  };

  const cancelDrag = () => {
    pending.current = null;
    setDrag(null);
  };

  const dark = currentBoardTheme.darkColor;
  const light = currentBoardTheme.lightColor;
  const frame = `color-mix(in srgb, ${dark} 55%, #1c1008)`;
  const ghostSize = (gridRef.current?.offsetWidth ?? 320) / 8;
  const dragPiece = drag ? pieces[drag.square] : null;

  return (
    <div
      className={`chess-board-touch-container relative w-full max-w-[min(94vw,480px)] mx-auto select-none touch-none ${className}`}
      style={{ aspectRatio: '1 / 0.88' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={cancelDrag}
    >
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: '4%', perspective: '1700px', perspectiveOrigin: '50% 10%' }}
      >
        {/* Board plane, tilted back */}
        <div
          className="relative w-full aspect-square rounded-[1.6%]"
          style={{
            marginTop: '-8%',
            transform: 'rotateX(34deg)',
            transformOrigin: '50% 50%',
            transformStyle: 'preserve-3d',
            padding: '5.2%',
            backgroundColor: frame,
            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.14), rgba(0,0,0,0.25)), ${WOOD_GRAIN}`,
            backgroundSize: 'auto, 420px 420px',
            boxShadow: [
              'inset 0 0 0 1px rgba(255,255,255,0.14)',
              '0 2px 0 color-mix(in srgb, ' + frame + ' 80%, black)',
              '0 4px 0 color-mix(in srgb, ' + frame + ' 70%, black)',
              '0 6px 0 color-mix(in srgb, ' + frame + ' 60%, black)',
              '0 8px 0 color-mix(in srgb, ' + frame + ' 50%, black)',
              '0 10px 0 color-mix(in srgb, ' + frame + ' 40%, black)',
              '0 26px 34px rgba(0,0,0,0.55)',
            ].join(','),
          }}
        >
          {showCoordinates && (
            <>
              {Array.from({ length: 8 }, (_, i) => (
                <React.Fragment key={i}>
                  <span
                    className="absolute font-bold leading-none pointer-events-none"
                    style={{
                      left: `${5.2 + (i + 0.5) * 11.2}%`,
                      bottom: '1.3%',
                      transform: 'translateX(-50%)',
                      fontSize: 'clamp(8px, 2.4vw, 12px)',
                      color: 'rgba(255,240,215,0.75)',
                    }}
                  >
                    {FILES[orientation === 'w' ? i : 7 - i]}
                  </span>
                  <span
                    className="absolute font-bold leading-none pointer-events-none"
                    style={{
                      top: `${5.2 + (i + 0.5) * 11.2}%`,
                      left: '1.9%',
                      transform: 'translateY(-50%)',
                      fontSize: 'clamp(8px, 2.4vw, 12px)',
                      color: 'rgba(255,240,215,0.75)',
                    }}
                  >
                    {orientation === 'w' ? 8 - i : i + 1}
                  </span>
                </React.Fragment>
              ))}
            </>
          )}

          {/* Playing surface */}
          <div
            ref={gridRef}
            className="relative grid grid-cols-8 grid-rows-8 w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'translateZ(1px)',
              boxShadow: '0 0 0 2px rgba(0,0,0,0.55), 0 0 0 3px rgba(255,255,255,0.12)',
            }}
          >
            {displaySquares.map(({ square, fileIdx, rank }, idx) => {
              const isDark = (fileIdx + rank) % 2 === 1;
              const base = isDark ? dark : light;
              const piece = pieces[square];
              const isDragSource = drag?.square === square;
              const overlay = squareStyles[square];
              return (
                <div
                  key={square}
                  data-square={square}
                  className="relative"
                  style={{
                    transformStyle: 'preserve-3d',
                    cursor: interactive ? 'pointer' : 'default',
                    backgroundColor: base,
                    backgroundImage: `linear-gradient(${135 + (idx % 5) * 12}deg, rgba(255,255,255,${isDark ? 0.07 : 0.16}), rgba(0,0,0,${isDark ? 0.18 : 0.08})), ${WOOD_GRAIN}`,
                    backgroundSize: 'auto, 260px 260px',
                    backgroundPosition: `0 0, ${(idx * 53) % 260}px ${(idx * 97) % 260}px`,
                    boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.12)',
                  }}
                >
                  {overlay && <div className="absolute inset-0 pointer-events-none" style={overlay} />}

                  {piece && (
                    <>
                      {/* Contact shadow on the board surface */}
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          left: '14%',
                          right: '8%',
                          top: '52%',
                          height: '36%',
                          borderRadius: '50%',
                          background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.22) 55%, transparent 72%)',
                          opacity: isDragSource ? 0.25 : 1,
                        }}
                      />
                      {/* Upright piece, counter-rotated against the board tilt */}
                      <div
                        className="absolute pointer-events-none"
                        style={{
                          left: '-4%',
                          width: '108%',
                          bottom: '4%',
                          height: '112%',
                          transform: 'rotateX(-34deg) translateZ(1px)',
                          transformOrigin: '50% 100%',
                          opacity: isDragSource ? 0.3 : 1,
                        }}
                      >
                        <div key={`${piece.color}${piece.type}`} className="w-full h-full chess-piece-settle">
                          <ChessPiece type={piece.type} color={piece.color} pieceTheme={pieceTheme} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {drag && dragPiece && createPortal(
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: drag.x - ghostSize * 0.6,
            top: drag.y - ghostSize * 1.1,
            width: ghostSize * 1.2,
            height: ghostSize * 1.3,
            filter: 'drop-shadow(0 14px 10px rgba(0,0,0,0.45))',
          }}
        >
          <ChessPiece type={dragPiece.type} color={dragPiece.color} pieceTheme={pieceTheme} />
        </div>
      ,
        document.body
      )}
    </div>
  );
};

// Aliases for compatibility
export const ChessBoard = Chessboard;
export default Chessboard;
