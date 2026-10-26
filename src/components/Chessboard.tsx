import React, { useState, useMemo, useCallback } from 'react';
import { Chessboard as ReactChessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';

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

export const Chessboard: React.FC<ChessBoardProps> = ({
  game,
  fen,
  orientation = 'w',
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

  // Handle Drag-and-Drop Piece Drop
  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }): boolean => {
      if (!interactive || !targetSquare) return false;

      // Validate move with chess.js if game/chessInstance is available
      if (chessInstance) {
        const legal = chessInstance.moves({ square: sourceSquare as Square, verbose: true });
        const isLegal = legal.some((m) => m.to === targetSquare);

        if (!isLegal) {
          // If custom move or tutorial expectedMove matches, permit it
          if (!onMove) {
            return false;
          }
        }
      }

      // Execute move
      if (onMove) {
        onMove(sourceSquare, targetSquare);
      } else {
        onSquareClick?.(targetSquare);
      }

      setInternalSelectedSquare(null);
      return true;
    },
    [interactive, chessInstance, onMove, onSquareClick]
  );

  // Handle Drag Begin: select piece and compute legal moves immediately
  const handlePieceDragBegin = useCallback(
    ({ square }: { isSparePiece?: boolean; piece: any; square: string | null }) => {
      if (!interactive || !square) return;
      setInternalSelectedSquare(square);
      onSquareClick?.(square);
    },
    [interactive, onSquareClick]
  );

  // Handle Click / Tap-to-Move
  const handleSquareClick = useCallback(
    ({ square }: { piece: any; square: string }) => {
      if (!interactive) return;

      // If a piece is already selected and user clicks a legal destination
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

      // Toggle / change selection
      if (selectedSquare === square) {
        setInternalSelectedSquare(null);
      } else {
        setInternalSelectedSquare(square);
      }

      onSquareClick?.(square);
    },
    [interactive, selectedSquare, activeLegalMoves, onMove, onSquareClick]
  );

  return (
    <div
      className={`chess-board-touch-container relative aspect-square w-full max-w-[min(94vw,480px)] mx-auto select-none rounded-2xl p-1.5 sm:p-3 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-2xl border border-slate-700/60 touch-none ${className}`}
    >
      <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-slate-700/80 shadow-inner">
        <ReactChessboard
          options={{
            position: currentFen,
            boardOrientation: orientation === 'b' ? 'black' : 'white',
            allowDragging: interactive,
            dragActivationDistance: 3,
            allowDragOffBoard: false,
            squareStyles,
            onPieceDrop: handlePieceDrop,
            onPieceDrag: handlePieceDragBegin,
            onSquareClick: handleSquareClick,
            showNotation: showCoordinates,
            boardStyle: {
              borderRadius: '0.65rem',
            },
            darkSquareStyle: {
              backgroundColor: '#936c4b',
            },
            lightSquareStyle: {
              backgroundColor: '#ebd7b2',
            },
            darkSquareNotationStyle: {
              color: '#ebd7b2',
              fontWeight: 700,
              fontSize: '10px',
            },
            lightSquareNotationStyle: {
              color: '#936c4b',
              fontWeight: 700,
              fontSize: '10px',
            },
          }}
        />
      </div>
    </div>
  );
};

// Aliases for compatibility
export const ChessBoard = Chessboard;
export default Chessboard;
