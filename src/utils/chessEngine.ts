import { Chess, Square } from 'chess.js';

// Piece values in centipawns
export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export const ITALIAN_PIECE_NAMES: Record<string, string> = {
  p: 'pedone',
  n: 'cavallo',
  b: 'alfiere',
  r: 'torre',
  q: 'donna (regina)',
  k: 're',
};

// Simplified piece-square tables for positional understanding
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0,
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];

const KING_TABLE_MID = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20,
];

function getSquareIndex(sq: string, isWhite: boolean): number {
  const file = sq.charCodeAt(0) - 97; // 0 to 7
  const rank = 8 - parseInt(sq[1], 10); // 0 to 7 (rank 8 is 0, rank 1 is 7)
  const idx = rank * 8 + file;
  return isWhite ? idx : (7 - rank) * 8 + file;
}

export function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -30000 : 30000;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return 0;
  }

  let score = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const val = PIECE_VALUES[piece.type] || 0;
      const sq = `${String.fromCharCode(97 + c)}${8 - r}`;
      const isWhite = piece.color === 'w';
      const idx = getSquareIndex(sq, isWhite);

      let psqt = 0;
      if (piece.type === 'p') psqt = PAWN_TABLE[idx] || 0;
      else if (piece.type === 'n') psqt = KNIGHT_TABLE[idx] || 0;
      else if (piece.type === 'b') psqt = BISHOP_TABLE[idx] || 0;
      else if (piece.type === 'r') psqt = ROOK_TABLE[idx] || 0;
      else if (piece.type === 'q') psqt = QUEEN_TABLE[idx] || 0;
      else if (piece.type === 'k') psqt = KING_TABLE_MID[idx] || 0;

      const totalVal = val + psqt;
      if (isWhite) {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  return score;
}

// Alpha-Beta minimax search
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): { score: number; bestMoveSAN?: string } {
  if (depth === 0 || game.isGameOver()) {
    return { score: evaluateBoard(game) };
  }

  const moves = game.moves({ verbose: true });
  // Move sorting: captures first
  moves.sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0));

  let bestMoveSAN = moves[0]?.san;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const res = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      if (res.score > maxEval) {
        maxEval = res.score;
        bestMoveSAN = move.san;
      }
      alpha = Math.max(alpha, res.score);
      if (beta <= alpha) break; // Beta cutoff
    }
    return { score: maxEval, bestMoveSAN };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const res = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      if (res.score < minEval) {
        minEval = res.score;
        bestMoveSAN = move.san;
      }
      beta = Math.min(beta, res.score);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return { score: minEval, bestMoveSAN };
  }
}

export interface EngineMoveResult {
  from: string;
  to: string;
  san: string;
  explanation?: string;
}

/**
 * Calculates computer move tailored to 6 beginner-to-advanced levels
 */
export function getComputerMove(game: Chess, level: number): EngineMoveResult | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  const isWhite = game.turn() === 'w';

  // Level 1: Principiante assoluto (Blunder frequently, random or simple moves)
  if (level === 1) {
    // 70% random move, 30% random capture if available
    const captures = moves.filter((m) => m.captured);
    if (captures.length > 0 && Math.random() < 0.4) {
      const chosen = captures[Math.floor(Math.random() * captures.length)];
      return { from: chosen.from, to: chosen.to, san: chosen.san, explanation: 'Mossa semplice di cattura' };
    }
    const chosen = moves[Math.floor(Math.random() * moves.length)];
    return { from: chosen.from, to: chosen.to, san: chosen.san, explanation: 'Mossa esplorativa' };
  }

  // Level 2: Principiante (Basic piece development, occasionally blunders)
  if (level === 2) {
    if (Math.random() < 0.45) {
      const chosen = moves[Math.floor(Math.random() * moves.length)];
      return { from: chosen.from, to: chosen.to, san: chosen.san, explanation: 'Mossa istintiva' };
    }
    // 1-ply evaluation
    let bestMove = moves[0];
    let bestScore = isWhite ? -Infinity : Infinity;
    for (const m of moves) {
      game.move(m);
      const score = evaluateBoard(game);
      game.undo();
      if (isWhite ? score > bestScore : score < bestScore) {
        bestScore = score;
        bestMove = m;
      }
    }
    return { from: bestMove.from, to: bestMove.to, san: bestMove.san, explanation: 'Sviluppa e cerca materiale' };
  }

  // Level 3: Facile (Depth 2 minimax with light randomness)
  if (level === 3) {
    if (Math.random() < 0.25) {
      // Pick a random safe capture or advance
      const safeMoves = moves.filter((m) => m.captured || m.piece === 'n' || m.piece === 'b');
      const pool = safeMoves.length > 0 ? safeMoves : moves;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return { from: chosen.from, to: chosen.to, san: chosen.san, explanation: 'Protezione e posizionamento' };
    }
    const result = minimax(game, 2, -Infinity, Infinity, isWhite);
    const chosen = moves.find((m) => m.san === result.bestMoveSAN) || moves[0];
    return { from: chosen.from, to: chosen.to, san: chosen.san, explanation: 'Sviluppo armonico e difesa dei pezzi' };
  }

  // Level 4: Intermedio (Depth 2-3 solid minimax)
  if (level === 4) {
    const result = minimax(game, 2, -Infinity, Infinity, isWhite);
    const chosen = moves.find((m) => m.san === result.bestMoveSAN) || moves[0];
    return { from: chosen.from, to: chosen.to, san: chosen.san, explanation: 'Controllo del centro e coordinazione' };
  }

  // Level 5: Avanzato (Depth 3 search)
  if (level === 5) {
    const result = minimax(game, 3, -Infinity, Infinity, isWhite);
    const chosen = moves.find((m) => m.san === result.bestMoveSAN) || moves[0];
    return { from: chosen.from, to: chosen.to, san: chosen.san, explanation: 'Strategia attiva e pressione tattica' };
  }

  // Level 6: Esperto (Depth 4 search)
  const result = minimax(game, 4, -Infinity, Infinity, isWhite);
  const chosen = moves.find((m) => m.san === result.bestMoveSAN) || moves[0];
  return { from: chosen.from, to: chosen.to, san: chosen.san, explanation: 'Calcolo profondo e massima precisione' };
}

/**
 * Finds all squares with player's pieces currently under direct opponent attack
 */
export function getThreatenedSquares(game: Chess, playerColor: 'w' | 'b'): string[] {
  const opponentColor = playerColor === 'w' ? 'b' : 'w';
  const threatened = new Set<string>();

  // Clone game to check opponent moves
  const temp = new Chess(game.fen());
  // If it's player's turn, opponent attacks can be checked by simulating passing or checking captures
  const board = temp.board();

  // Test every player piece square: can opponent capture it?
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === playerColor) {
        const sq = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
        if (temp.isAttacked(sq, opponentColor)) {
          threatened.add(sq);
        }
      }
    }
  }

  return Array.from(threatened);
}

/**
 * Generates an educational hint with explanation in Italian for assisted play
 */
export function getTutorHint(game: Chess): { from: string; to: string; san: string; explanation: string } | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  const isWhite = game.turn() === 'w';

  // Check if player is in check
  if (game.isCheck()) {
    const kingEscape = moves.find((m) => m.piece === 'k');
    const captureAttacker = moves.find((m) => m.captured);
    if (captureAttacker) {
      return {
        from: captureAttacker.from,
        to: captureAttacker.to,
        san: captureAttacker.san,
        explanation: 'Sei sotto scacco! Puoi eliminare il pezzo che minaccia il tuo Re catturandolo.',
      };
    }
    if (kingEscape) {
      return {
        from: kingEscape.from,
        to: kingEscape.to,
        san: kingEscape.san,
        explanation: 'Sei sotto scacco! Sposta il tuo Re su una casella sicura.',
      };
    }
  }

  // Look for free capture of undefended / high value piece
  const captures = moves.filter((m) => m.captured);
  if (captures.length > 0) {
    captures.sort((a, b) => (PIECE_VALUES[b.captured || 'p'] || 0) - (PIECE_VALUES[a.captured || 'p'] || 0));
    const bestCapture = captures[0];
    const pieceName = ITALIAN_PIECE_NAMES[bestCapture.captured || 'p'];
    return {
      from: bestCapture.from,
      to: bestCapture.to,
      san: bestCapture.san,
      explanation: `Ottima opportunità: puoi catturare il ${pieceName} avversario!`,
    };
  }

  // Look for castling
  const castlingMove = moves.find((m) => m.san.includes('O-O'));
  if (castlingMove) {
    return {
      from: castlingMove.from,
      to: castlingMove.to,
      san: castlingMove.san,
      explanation: "L'arrocco mette al sicuro il tuo Re e attiva contemporaneamente la Torre. Mossa ideale!",
    };
  }

  // Center pawn advance (e4/d4/e5/d5)
  const centerPawn = moves.find((m) => m.piece === 'p' && ['e4', 'd4', 'e5', 'd5'].includes(m.to));
  if (centerPawn) {
    return {
      from: centerPawn.from,
      to: centerPawn.to,
      san: centerPawn.san,
      explanation: 'Occupare il centro con i pedoni ti garantisce spazio e libertà di manovra.',
    };
  }

  // Piece development (Knights & Bishops)
  const knightMove = moves.find((m) => m.piece === 'n' && ['f3', 'c3', 'f6', 'c6'].includes(m.to));
  if (knightMove) {
    return {
      from: knightMove.from,
      to: knightMove.to,
      san: knightMove.san,
      explanation: 'Sviluppa il cavallo verso il centro per controllare caselle chiave.',
    };
  }

  // General best minimax move
  const bestSearch = minimax(game, 2, -Infinity, Infinity, isWhite);
  const chosen = moves.find((m) => m.san === bestSearch.bestMoveSAN) || moves[0];
  return {
    from: chosen.from,
    to: chosen.to,
    san: chosen.san,
    explanation: 'Questa mossa migliora la posizione dei tuoi pezzi e mantiene solida la difesa.',
  };
}

/**
 * Checks if a proposed move is a blunder that loses material unnecessarily
 */
export function analyzeMoveQuality(
  gameBefore: Chess,
  move: { from: string; to: string }
): { isBlunder: boolean; warning?: string } {
  const temp = new Chess(gameBefore.fen());
  const piece = temp.get(move.from as Square);
  const isWhite = temp.turn() === 'w';
  const scoreBefore = evaluateBoard(temp);

  try {
    temp.move(move);
  } catch {
    return { isBlunder: false };
  }

  // Check if player walked into mate
  if (temp.isCheckmate()) {
    return { isBlunder: false }; // they won
  }

  // Search opponent's reply
  const opponentReply = minimax(temp, 1, -Infinity, Infinity, !isWhite);
  const scoreAfter = opponentReply.score;

  // If score dropped dramatically for player (e.g. > 280 centipawns)
  const loss = isWhite ? scoreBefore - scoreAfter : scoreAfter - scoreBefore;
  if (loss > 280 && piece) {
    const pName = ITALIAN_PIECE_NAMES[piece.type];
    return {
      isBlunder: true,
      warning: `Attenzione! Questa mossa lascia il tuo ${pName} vulnerabile all'attacco avversario senza protezione adeguata. Vuoi davvero muovere lì?`,
    };
  }

  return { isBlunder: false };
}
