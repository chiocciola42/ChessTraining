import { Chess, Move, Square } from 'chess.js';

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

export interface LegalMoveOption {
  to: string;
  isCapture: boolean;
  san: string;
}

const BOARD_SIZE = 8;
const MAX_SEARCH_DEPTH = 6;

/** Algebraic name of the square at board row `r` (0 = rank 8) and column `c` (0 = file a). */
export function squareName(r: number, c: number): Square {
  return `${String.fromCharCode(97 + c)}${BOARD_SIZE - r}` as Square;
}

/** Square of the king of the given colour, or null if absent (e.g. incomplete tutorial boards). */
export function findKingSquare(game: Chess, color: 'w' | 'b'): Square | null {
  const board = game.board();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'k' && piece.color === color) return squareName(r, c);
    }
  }
  return null;
}

/** Legal moves of the piece on `square` in the position `fen`; empty for invalid input. */
export function getLegalMoveOptions(fen: string, square: string | null): LegalMoveOption[] {
  if (!fen || !square) return [];
  try {
    const moves = new Chess(fen).moves({ square: square as Square, verbose: true });
    return moves.map((m) => ({ to: m.to, isCapture: !!m.captured, san: m.san }));
  } catch {
    // Tutorial boards may use incomplete FENs (e.g. a single king): no moves to show.
    return [];
  }
}

/** Material points (pawn = 1) for each side, kings excluded. */
export function getMaterialDifference(game: Chess): number {
  let diff = 0;
  for (const row of game.board()) {
    for (const p of row) {
      if (!p || p.type === 'k') continue;
      const value = PIECE_VALUES[p.type] ?? 0;
      diff += p.color === 'w' ? value : -value;
    }
  }
  return diff / 100;
}

/** Pieces each side has lost compared to the starting setup (kings excluded). */
export function getLostPieces(game: Chess): { whiteLost: string[]; blackLost: string[] } {
  const initial: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const present: Record<string, number> = {};
  for (const row of game.board()) {
    for (const p of row) {
      if (p && p.type !== 'k') {
        const key = `${p.color}${p.type}`;
        present[key] = (present[key] ?? 0) + 1;
      }
    }
  }

  const whiteLost: string[] = [];
  const blackLost: string[] = [];
  for (const type of Object.keys(initial)) {
    const wDeficit = initial[type] - (present[`w${type}`] ?? 0);
    const bDeficit = initial[type] - (present[`b${type}`] ?? 0);
    for (let i = 0; i < wDeficit; i++) whiteLost.push(type);
    for (let i = 0; i < bDeficit; i++) blackLost.push(type);
  }
  return { whiteLost, blackLost };
}

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

const PIECE_SQUARE_TABLES: Record<string, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_TABLE_MID,
};

/** Index into a white-oriented piece-square table (mirrored vertically for black). */
function getSquareIndex(r: number, c: number, isWhite: boolean): number {
  return (isWhite ? r : BOARD_SIZE - 1 - r) * BOARD_SIZE + c;
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

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const isWhite = piece.color === 'w';
      const table = PIECE_SQUARE_TABLES[piece.type];
      const positional = table?.[getSquareIndex(r, c, isWhite)] ?? 0;
      const totalVal = (PIECE_VALUES[piece.type] ?? 0) + positional;
      score += isWhite ? totalVal : -totalVal;
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
  if (depth <= 0 || game.isGameOver()) {
    return { score: evaluateBoard(game) };
  }
  if (depth > MAX_SEARCH_DEPTH) {
    throw new RangeError(`Search depth ${depth} exceeds the maximum of ${MAX_SEARCH_DEPTH}`);
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

type VerboseMove = Move;

function listMoves(game: Chess): VerboseMove[] {
  return game.moves({ verbose: true });
}

function toResult(move: VerboseMove, explanation: string): EngineMoveResult {
  return { from: move.from, to: move.to, san: move.san, explanation };
}

function pickRandom<T>(items: ReadonlyArray<T>): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Best move found by a fixed-depth search (falls back to the first legal move). */
function searchBestMove(game: Chess, moves: VerboseMove[], depth: number): VerboseMove {
  const result = minimax(game, depth, -Infinity, Infinity, game.turn() === 'w');
  return moves.find((m) => m.san === result.bestMoveSAN) ?? moves[0];
}

/** Greedy one-ply evaluation. */
function bestOnePlyMove(game: Chess, moves: VerboseMove[]): VerboseMove {
  const isWhite = game.turn() === 'w';
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
  return bestMove;
}

function levelOneMove(moves: VerboseMove[]): EngineMoveResult {
  const captures = moves.filter((m) => m.captured);
  if (captures.length > 0 && Math.random() < 0.4) {
    return toResult(pickRandom(captures), 'Mossa semplice di cattura');
  }
  return toResult(pickRandom(moves), 'Mossa esplorativa');
}

function levelTwoMove(game: Chess, moves: VerboseMove[]): EngineMoveResult {
  if (Math.random() < 0.45) return toResult(pickRandom(moves), 'Mossa istintiva');
  return toResult(bestOnePlyMove(game, moves), 'Sviluppa e cerca materiale');
}

function levelThreeMove(game: Chess, moves: VerboseMove[]): EngineMoveResult {
  if (Math.random() < 0.25) {
    const preferred = moves.filter((m) => m.captured || m.piece === 'n' || m.piece === 'b');
    const pool = preferred.length > 0 ? preferred : moves;
    return toResult(pickRandom(pool), 'Protezione e posizionamento');
  }
  return toResult(searchBestMove(game, moves, 2), 'Sviluppo armonico e difesa dei pezzi');
}

const SEARCH_LEVELS: Record<number, { depth: number; explanation: string }> = {
  4: { depth: 2, explanation: 'Controllo del centro e coordinazione' },
  5: { depth: 3, explanation: 'Strategia attiva e pressione tattica' },
  6: { depth: 4, explanation: 'Calcolo profondo e massima precisione' },
};

/**
 * Calculates computer move tailored to 6 beginner-to-advanced levels.
 * Levels outside 1..6 are clamped to the nearest valid level.
 */
export function getComputerMove(game: Chess, level: number): EngineMoveResult | null {
  const moves = listMoves(game);
  if (moves.length === 0) return null;

  const lvl = Math.min(6, Math.max(1, Math.round(level) || 1));
  if (lvl === 1) return levelOneMove(moves);
  if (lvl === 2) return levelTwoMove(game, moves);
  if (lvl === 3) return levelThreeMove(game, moves);

  const { depth, explanation } = SEARCH_LEVELS[lvl];
  return toResult(searchBestMove(game, moves, depth), explanation);
}

/**
 * Finds all squares with player's pieces currently under direct opponent attack
 */
export function getThreatenedSquares(game: Chess, playerColor: 'w' | 'b'): string[] {
  const opponentColor = playerColor === 'w' ? 'b' : 'w';
  const threatened: string[] = [];
  const board = game.board();

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== playerColor) continue;
      const sq = squareName(r, c);
      if (game.isAttacked(sq, opponentColor)) threatened.push(sq);
    }
  }

  return threatened;
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
