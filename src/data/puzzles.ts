export interface Puzzle {
  id: string;
  category: 'matto1' | 'forchetta' | 'inchiodatura' | 'salvataggio' | 'materiale' | 'finali';
  categoryLabel: string;
  title: string;
  difficulty: 1 | 2 | 3;
  fen: string;
  playerTurn: 'w' | 'b';
  expectedMove: { from: string; to: string; san: string };
  followupMoves?: { opponent: { from: string; to: string }; response: { from: string; to: string } }[];
  instruction: string;
  explanation: string;
  hint: string;
}

export const PUZZLES: Puzzle[] = [
  {
    id: 'puz-1',
    category: 'matto1',
    categoryLabel: 'Matto in 1',
    title: 'Il Corridoio Fatale',
    difficulty: 1,
    fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
    playerTurn: 'w',
    expectedMove: { from: 'a1', to: 'a8', san: 'Ra8#' },
    instruction: 'Trova la mossa del Bianco che dà scacco matto immediato!',
    explanation: 'La Torre scivola in a8. Il Re nero è intrappolato dietro i suoi stessi pedoni e non ha caselle di fuga: Matto del Corridoio!',
    hint: 'La traversa 8 è completamente sguarnita.',
  },
  {
    id: 'puz-2',
    category: 'forchetta',
    categoryLabel: 'Forchetta',
    title: 'Forchetta Reale col Cavallo',
    difficulty: 1,
    fen: '4k3/8/8/3q4/4N3/8/8/4K3 w - - 0 1',
    playerTurn: 'w',
    expectedMove: { from: 'e4', to: 'f6', san: 'Nf6+' },
    instruction: 'Attacca contemporaneamente il Re e la Donna nera con un colpo solo!',
    explanation: 'Il Cavallo in f6 dà scacco al Re e contemporaneamente minaccia la Donna in d5. Il Re deve fuggire e la Donna è perduta!',
    hint: 'Trova una casella per il Cavallo da cui può guardare sia il Re che la Regina.',
  },
  {
    id: 'puz-3',
    category: 'inchiodatura',
    categoryLabel: 'Inchiodatura',
    title: 'L’Alfiere Implacabile',
    difficulty: 1,
    fen: '4k3/8/8/3r4/8/8/8/2B1K3 w - - 0 1',
    playerTurn: 'w',
    expectedMove: { from: 'c1', to: 'a3', san: 'Ba3' },
    instruction: 'Inchioda la Torre nera contro il suo Re per impedirle di fuggire.',
    explanation: 'L’Alfiere in a3 si allinea sulla diagonale col Re nero. La Torre non potrà mai muoversi senza esporre il Re allo scacco.',
    hint: 'Sposta l’Alfiere sulla diagonale che attraversa sia la Torre che il Re nero.',
  },
  {
    id: 'puz-4',
    category: 'matto1',
    categoryLabel: 'Matto in 1',
    title: 'Il Bacio della Regina',
    difficulty: 1,
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
    playerTurn: 'w',
    expectedMove: { from: 'f3', to: 'f7', san: 'Qxf7#' },
    instruction: 'Sferra lo scacco matto sul punto debole f7!',
    explanation: 'La Donna cattura in f7 protetta dall’Alfiere in c4. Il Re nero non può catturare la regina perché protetta, né può fuggire.',
    hint: 'Guarda la coordinazione tra Donna in f3 e Alfiere in c4 sulla casella f7.',
  },
  {
    id: 'puz-5',
    category: 'salvataggio',
    categoryLabel: 'Difesa dal Re',
    title: 'Parata con Scudo',
    difficulty: 2,
    fen: '4k3/8/8/8/8/8/4B3/3RK2r w - - 0 1',
    playerTurn: 'w',
    expectedMove: { from: 'e2', to: 'f1', san: 'Bf1' },
    instruction: 'Sei sotto scacco dalla Torre nera in h1! Trova il miglior modo per proteggere il Re.',
    explanation: 'Interponendo l’Alfiere in f1 neutralizzi completamente lo scacco e mantieni il tuo Re e le tue Torri perfettamente coordinate.',
    hint: 'Interponi un pezzo tra la Torre avversaria e il tuo Re.',
  },
  {
    id: 'puz-6',
    category: 'materiale',
    categoryLabel: 'Tattica',
    title: 'Pezzo Sospeso Indifeso',
    difficulty: 1,
    fen: 'r1b1k2r/pppp1ppp/5n2/4q3/1b6/2N5/PPP1PPPP/R1BQKBNR w KQkq - 2 6',
    playerTurn: 'w',
    expectedMove: { from: 'c1', to: 'd2', san: 'Bd2' },
    instruction: 'Neutralizza lo scacco dell’Alfiere nero in b4 sviluppando un pezzo.',
    explanation: 'Parare con l’Alfiere in d2 toglie lo scacco, sviluppa un pezzo minore e contrattacca sull’alfiere nero.',
    hint: 'Interponi l’Alfiere sul percorso del pezzo attaccante.',
  },
  {
    id: 'puz-7',
    category: 'finali',
    categoryLabel: 'Finali',
    title: 'La Corsa alla Promozione',
    difficulty: 2,
    fen: '8/4P3/8/8/8/4k3/8/4K3 w - - 0 1',
    playerTurn: 'w',
    expectedMove: { from: 'e7', to: 'e8', san: 'e8=Q' },
    instruction: 'Promuovi il pedone a nuova Regina per vincere la partita!',
    explanation: 'Il pedone raggiunge l’ottava traversa e si trasforma in Donna con scacco matto imminente.',
    hint: 'Fai l’ultimo passo in avanti con il pedone.',
  },
  {
    id: 'puz-8',
    category: 'matto1',
    categoryLabel: 'Matto in 1',
    title: 'Doppio Attacco di Cavallo',
    difficulty: 2,
    fen: '6k1/5p1p/6p1/8/8/8/5N1P/4q1K1 w - - 0 1',
    playerTurn: 'w',
    expectedMove: { from: 'g1', to: 'g2', san: 'Kg2' },
    instruction: 'Il Re bianco è sotto scacco: trova l’unica casella sicura!',
    explanation: 'Spostando il Re in g2 esci dallo scacco e il Cavallo continua a fare da guardiano.',
    hint: 'Allontanati dalla prima traversa minacciata dalla regina.',
  },
];
