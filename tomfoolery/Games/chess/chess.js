// ---------- initial state ----------
let board = [];
let turn = 'w';               // 'w' or 'b'
let castling = { wK: true, wQ: true, bK: true, bQ: true };
let enPassant = null;         // square like { row, col } or null
let gameActive = true;
let winner = null;            // 'w', 'b', 'draw'
let statusMsg = "White's turn";

// timer variables (countdown from 10 minutes)
let whiteTime = 600;          // seconds
let blackTime = 600;
let timerInterval = null;
let activeTimer = 'w';        // which player's clock is running

// history for undo (stores state BEFORE move)
let history = [];

// selected square & possible move highlights
let selectedRow = -1, selectedCol = -1;
let possibleTargets = [];     // array of { row, col }

// promotion pending
let pendingPromotion = null;  // { fromRow, fromCol, toRow, toCol }

// ---------- board initialization ----------
function initBoard() {
  // standard setup
  board = [
    ['r','n','b','q','k','b','n','r'], // row 0 (black back rank)
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']  // row 7 (white back rank)
  ];
  turn = 'w';
  castling = { wK: true, wQ: true, bK: true, bQ: true };
  enPassant = null;
  gameActive = true;
  winner = null;
  statusMsg = "White's turn";
  whiteTime = 600;
  blackTime = 600;
  activeTimer = 'w';
  history = [];
  clearHighlights();
  stopTimer();
  startTimer();
  updateStatus();
  renderBoard();
}

// clear selection
function clearHighlights() {
  selectedRow = -1; selectedCol = -1;
  possibleTargets = [];
}

// ---------- rendering ----------
function renderBoard() {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.className = 'square';
      // alternate colors
      const isLight = (row + col) % 2 === 0;
      square.classList.add(isLight ? 'light' : 'dark');
      // data attributes
      square.dataset.row = row;
      square.dataset.col = col;

      // piece symbol
      const piece = board[row][col];
      if (piece) square.textContent = getPieceSymbol(piece);

      // highlight selected
      if (selectedRow === row && selectedCol === col) {
        square.classList.add('selected');
      }

      // possible move highlight
      if (possibleTargets.some(p => p.row === row && p.col === col)) {
        square.classList.add('possible-move');
      }

      boardEl.appendChild(square);
    }
  }
}

function getPieceSymbol(p) {
  const symbols = {
    'K':'♔','Q':'♕','R':'♖','B':'♗','N':'♘','P':'♙',
    'k':'♚','q':'♛','r':'♜','b':'♝','n':'♞','p':'♟'
  };
  return symbols[p] || '';
}

// ---------- timer ----------
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameActive) return;
    if (activeTimer === 'w') {
      if (whiteTime > 0) whiteTime--; else gameActive = false;
    } else {
      if (blackTime > 0) blackTime--; else gameActive = false;
    }
    updateTimerDisplay();
    if (!gameActive) {
      stopTimer();
      statusMsg = "Time's up!";
      updateStatus();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  document.getElementById('white-time').textContent = formatTime(whiteTime);
  document.getElementById('black-time').textContent = formatTime(blackTime);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// switch active timer
function switchTimer() {
  activeTimer = (activeTimer === 'w' ? 'b' : 'w');
}

// ---------- move generation & validation ----------
function isInside(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getPieceMoves(row, col, ignoreKingSafety = false) {
  const piece = board[row][col];
  if (!piece) return [];
  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  if (color !== turn) return []; // not your turn

  const moves = [];
  const p = piece.toLowerCase();

  switch (p) {
    case 'p': // pawn
      const dir = color === 'w' ? -1 : 1; // white moves up (row decreases)
      const startRow = color === 'w' ? 6 : 1;
      // one forward
      if (isInside(row+dir, col) && board[row+dir][col] === '') {
        moves.push({ row: row+dir, col });
        // two forward
        if (row === startRow && board[row+2*dir][col] === '') {
          moves.push({ row: row+2*dir, col });
        }
      }
      // captures (normal)
      for (const dc of [-1, 1]) {
        const nr = row+dir, nc = col+dc;
        if (isInside(nr, nc) && board[nr][nc] && 
            (board[nr][nc] === board[nr][nc].toLowerCase() ? 'b' : 'w') !== color) {
          moves.push({ row: nr, col: nc });
        }
      }
      // en passant
      if (enPassant) {
        for (const dc of [-1, 1]) {
          if (row+dir === enPassant.row && col+dc === enPassant.col) {
            moves.push({ row: enPassant.row, col: enPassant.col });
          }
        }
      }
      break;

    case 'n': // knight
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = row+dr, nc = col+dc;
        if (isInside(nr, nc) && (!board[nr][nc] || (board[nr][nc] === board[nr][nc].toLowerCase() ? 'b' : 'w') !== color)) {
          moves.push({ row: nr, col: nc });
        }
      }
      break;

    case 'b': // bishop
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        for (let i = 1; i < 8; i++) {
          const nr = row+dr*i, nc = col+dc*i;
          if (!isInside(nr, nc)) break;
          if (!board[nr][nc]) moves.push({ row: nr, col: nc });
          else {
            if ((board[nr][nc] === board[nr][nc].toLowerCase() ? 'b' : 'w') !== color) moves.push({ row: nr, col: nc });
            break;
          }
        }
      }
      break;

    case 'r': // rook
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        for (let i = 1; i < 8; i++) {
          const nr = row+dr*i, nc = col+dc*i;
          if (!isInside(nr, nc)) break;
          if (!board[nr][nc]) moves.push({ row: nr, col: nc });
          else {
            if ((board[nr][nc] === board[nr][nc].toLowerCase() ? 'b' : 'w') !== color) moves.push({ row: nr, col: nc });
            break;
          }
        }
      }
      break;

    case 'q': // queen = rook + bishop
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
        for (let i = 1; i < 8; i++) {
          const nr = row+dr*i, nc = col+dc*i;
          if (!isInside(nr, nc)) break;
          if (!board[nr][nc]) moves.push({ row: nr, col: nc });
          else {
            if ((board[nr][nc] === board[nr][nc].toLowerCase() ? 'b' : 'w') !== color) moves.push({ row: nr, col: nc });
            break;
          }
        }
      }
      break;

    case 'k': // king (and castling)
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const nr = row+dr, nc = col+dc;
        if (isInside(nr, nc) && (!board[nr][nc] || (board[nr][nc] === board[nr][nc].toLowerCase() ? 'b' : 'w') !== color)) {
          moves.push({ row: nr, col: nc });
        }
      }
      // castling
      if (!ignoreKingSafety) break; // will be filtered later with king safety, but we add here anyway
      const kingRow = color === 'w' ? 7 : 0;
      if (row === kingRow && col === 4) {
        // kingside
        if ((color === 'w' ? castling.wK : castling.bK) && !board[kingRow][5] && !board[kingRow][6]) {
          if (!isSquareAttacked(kingRow,4,color) && !isSquareAttacked(kingRow,5,color)) {
            moves.push({ row: kingRow, col: 6 });
          }
        }
        // queenside
        if ((color === 'w' ? castling.wQ : castling.bQ) && !board[kingRow][3] && !board[kingRow][2] && !board[kingRow][1]) {
          if (!isSquareAttacked(kingRow,4,color) && !isSquareAttacked(kingRow,3,color)) {
            moves.push({ row: kingRow, col: 2 });
          }
        }
      }
      break;
  }
  return moves;
}

// check if a square is attacked by opponent (helper for castling / check)
function isSquareAttacked(row, col, friendlyColor) {
  const oppColor = friendlyColor === 'w' ? 'b' : 'w';
  // we can brute-force: for each opponent piece, see if it attacks (row,col)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
      if (pieceColor !== oppColor) continue;
      // pseudo-legal moves of that piece (ignoring king safety) – if they include target, return true
      const oppMoves = getPseudoMovesWithoutKing(r, c);
      if (oppMoves.some(m => m.row === row && m.col === col)) return true;
    }
  }
  return false;
}

// get pseudo moves without castling (to avoid recursion) and without king safety filter
function getPseudoMovesWithoutKing(row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  const p = piece.toLowerCase();
  const moves = [];

  // simplified – only sliding and knight and pawn and king (but no castling)
  switch (p) {
    case 'p':
      const dir = color === 'w' ? -1 : 1;
      // captures only (for attack detection we only care about captures)
      for (const dc of [-1, 1]) {
        const nr = row+dir, nc = col+dc;
        if (isInside(nr, nc)) moves.push({ row: nr, col: nc });
      }
      // also en passant? we ignore for attack detection
      break;
    case 'n':
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = row+dr, nc = col+dc;
        if (isInside(nr, nc)) moves.push({ row: nr, col: nc });
      }
      break;
    case 'b':
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        for (let i = 1; i < 8; i++) {
          const nr = row+dr*i, nc = col+dc*i;
          if (!isInside(nr, nc)) break;
          moves.push({ row: nr, col: nc });
          if (board[nr][nc]) break;
        }
      }
      break;
    case 'r':
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        for (let i = 1; i < 8; i++) {
          const nr = row+dr*i, nc = col+dc*i;
          if (!isInside(nr, nc)) break;
          moves.push({ row: nr, col: nc });
          if (board[nr][nc]) break;
        }
      }
      break;
    case 'q':
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
        for (let i = 1; i < 8; i++) {
          const nr = row+dr*i, nc = col+dc*i;
          if (!isInside(nr, nc)) break;
          moves.push({ row: nr, col: nc });
          if (board[nr][nc]) break;
        }
      }
      break;
    case 'k':
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const nr = row+dr, nc = col+dc;
        if (isInside(nr, nc)) moves.push({ row: nr, col: nc });
      }
      break;
  }
  return moves;
}

// filter moves that leave own king in check
function filterLegalMoves(row, col, moves) {
  const piece = board[row][col];
  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  return moves.filter(m => {
    return !wouldMoveLeaveKingInCheck(row, col, m.row, m.col, color);
  });
}

function wouldMoveLeaveKingInCheck(fromRow, fromCol, toRow, toCol, friendlyColor) {
  // simulate move on board copy
  const boardCopy = board.map(r => [...r]);
  const piece = boardCopy[fromRow][fromCol];
  const captured = boardCopy[toRow][toCol];
  boardCopy[toRow][toCol] = piece;
  boardCopy[fromRow][fromCol] = '';

  // handle en passant capture removal
  if (enPassant && toRow === enPassant.row && toCol === enPassant.col && piece.toLowerCase() === 'p') {
    // remove the pawn that just double-moved (behind)
    const pawnRow = friendlyColor === 'w' ? toRow+1 : toRow-1;
    boardCopy[pawnRow][toCol] = '';
  }

  // find king position
  let kingRow, kingCol;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = boardCopy[r][c];
      if (p && (p === (friendlyColor === 'w' ? 'K' : 'k'))) {
        kingRow = r; kingCol = c; break;
      }
    }
  }

  // check if king is attacked
  return isSquareAttackedOnBoard(boardCopy, kingRow, kingCol, friendlyColor);
}

function isSquareAttackedOnBoard(boardObj, row, col, friendlyColor) {
  const oppColor = friendlyColor === 'w' ? 'b' : 'w';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = boardObj[r][c];
      if (!piece) continue;
      const color = piece === piece.toUpperCase() ? 'w' : 'b';
      if (color !== oppColor) continue;
      // get pseudo moves ignoring king safety (simple function for boardObj)
      const moves = getSimpleAttacks(boardObj, r, c);
      if (moves.some(m => m.row === row && m.col === col)) return true;
    }
  }
  return false;
}

function getSimpleAttacks(boardObj, row, col) {
  const piece = boardObj[row][col];
  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  const p = piece.toLowerCase();
  const moves = [];
  switch (p) {
    case 'p':
      const dir = color === 'w' ? -1 : 1;
      for (const dc of [-1, 1]) {
        const nr = row+dir, nc = col+dc;
        if (isInside(nr, nc)) moves.push({ row: nr, col: nc });
      }
      break;
    case 'n':
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        if (isInside(row+dr, col+dc)) moves.push({ row: row+dr, col: col+dc });
      }
      break;
    case 'b':
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        for (let i = 1; i < 8; i++) {
          const nr = row+dr*i, nc = col+dc*i;
          if (!isInside(nr, nc)) break;
          moves.push({ row: nr, col: nc });
          if (boardObj[nr][nc]) break;
        }
      }
      break;
    case 'r':
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        for (let i = 1; i < 8; i++) {
          const nr = row+dr*i, nc = col+dc*i;
          if (!isInside(nr, nc)) break;
          moves.push({ row: nr, col: nc });
          if (boardObj[nr][nc]) break;
        }
      }
      break;
    case 'q':
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
        for (let i = 1; i < 8; i++) {
          const nr = row+dr*i, nc = col+dc*i;
          if (!isInside(nr, nc)) break;
          moves.push({ row: nr, col: nc });
          if (boardObj[nr][nc]) break;
        }
      }
      break;
    case 'k':
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        if (isInside(row+dr, col+dc)) moves.push({ row: row+dr, col: col+dc });
      }
      break;
  }
  return moves;
}

// ---------- move execution ----------
function tryMove(fromRow, fromCol, toRow, toCol) {
  if (!gameActive) return false;
  const piece = board[fromRow][fromCol];
  if (!piece) return false;
  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  if (color !== turn) return false;

  // check if target is in possible moves
  const isLegal = possibleTargets.some(p => p.row === toRow && p.col === toCol);
  if (!isLegal) return false;

  // special: castling
  const pLower = piece.toLowerCase();
  if (pLower === 'k' && Math.abs(toCol - fromCol) === 2) {
    // castling move
    const rookFromCol = toCol === 6 ? 7 : 0;
    const rookToCol = toCol === 6 ? 5 : 3;
    board[fromRow][rookToCol] = board[fromRow][rookFromCol];
    board[fromRow][rookFromCol] = '';
  }

  // handle en passant capture (remove pawn)
  if (enPassant && toRow === enPassant.row && toCol === enPassant.col && pLower === 'p') {
    const capturedRow = turn === 'w' ? toRow+1 : toRow-1;
    board[capturedRow][toCol] = '';
  }

  // handle promotion (pawn reaches last rank)
  const willPromote = (pLower === 'p' && (toRow === 0 || toRow === 7));
  if (willPromote) {
    pendingPromotion = { fromRow, fromCol, toRow, toCol };
    showPromotionModal();
    return false; // move not complete yet
  }

  // execute move (standard)
  executeMove(fromRow, fromCol, toRow, toCol, null);
  return true;
}

function executeMove(fromRow, fromCol, toRow, toCol, promotionPiece) {
  // push state to history BEFORE move
  history.push({
    board: board.map(r => [...r]),
    turn,
    castling: { ...castling },
    enPassant: enPassant ? { ...enPassant } : null,
    whiteTime,
    blackTime,
    activeTimer
  });

  const piece = board[fromRow][fromCol];
  const color = piece === piece.toUpperCase() ? 'w' : 'b';

  // update castling rights
  if (piece === 'K') { castling.wK = false; castling.wQ = false; }
  if (piece === 'k') { castling.bK = false; castling.bQ = false; }
  if (piece === 'R' && fromRow === 7 && fromCol === 7) castling.wK = false;
  if (piece === 'R' && fromRow === 7 && fromCol === 0) castling.wQ = false;
  if (piece === 'r' && fromRow === 0 && fromCol === 7) castling.bK = false;
  if (piece === 'r' && fromRow === 0 && fromCol === 0) castling.bQ = false;

  // move piece
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = '';

  // promotion
  if (promotionPiece) {
    board[toRow][toCol] = (color === 'w' ? promotionPiece.toUpperCase() : promotionPiece.toLowerCase());
  }

  // set en passant for next move
  enPassant = null;
  if (piece.toLowerCase() === 'p' && Math.abs(toRow - fromRow) === 2) {
    enPassant = { row: (fromRow + toRow) / 2, col: fromCol };
  }

  // switch turn
  turn = turn === 'w' ? 'b' : 'w';
  switchTimer();

  clearHighlights();
  renderBoard();
  checkGameState();
  updateStatus();
}

// promotion modal
function showPromotionModal() {
  document.getElementById('promotion-modal').classList.remove('hidden');
}

function hidePromotionModal() {
  document.getElementById('promotion-modal').classList.add('hidden');
  pendingPromotion = null;
}

document.querySelectorAll('.piece-choice').forEach(btn => {
  btn.addEventListener('click', e => {
    if (!pendingPromotion) return;
    const piece = e.target.dataset.piece; // 'q','r','b','n'
    const { fromRow, fromCol, toRow, toCol } = pendingPromotion;
    hidePromotionModal();
    executeMove(fromRow, fromCol, toRow, toCol, piece);
  });
});

// ---------- game state ----------
function checkGameState() {
  const opponent = turn; // because we just switched turn
  if (isInCheck(opponent)) {
    if (!hasAnyLegalMove(opponent)) {
      gameActive = false;
      winner = opponent === 'w' ? 'b' : 'w';
      statusMsg = winner === 'w' ? 'White wins (checkmate)!' : 'Black wins (checkmate)!';
      stopTimer();
    } else {
      statusMsg = (opponent === 'w' ? 'White' : 'Black') + ' is in check';
    }
  } else {
    if (!hasAnyLegalMove(opponent)) {
      gameActive = false;
      winner = 'draw';
      statusMsg = 'Stalemate!';
      stopTimer();
    } else {
      statusMsg = (opponent === 'w' ? "White's" : "Black's") + ' turn';
    }
  }
  updateStatus();
}

function isInCheck(color) {
  // find king
  let kingR, kingC;
  for (let r=0; r<8; r++) for (let c=0; c<8; c++) {
    if (board[r][c] === (color==='w'?'K':'k')) { kingR=r; kingC=c; break; }
  }
  return isSquareAttackedOnBoard(board, kingR, kingC, color);
}

function hasAnyLegalMove(color) {
  for (let r=0; r<8; r++) {
    for (let c=0; c<8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if ((p === p.toUpperCase() ? 'w' : 'b') !== color) continue;
      const moves = getPieceMoves(r, c, true); // pseudo legal
      for (let m of moves) {
        if (!wouldMoveLeaveKingInCheck(r, c, m.row, m.col, color)) {
          return true;
        }
      }
    }
  }
  return false;
}

// ---------- undo ----------
function undo() {
  if (history.length === 0) return;
  const prev = history.pop();
  board = prev.board.map(r => [...r]);
  turn = prev.turn;
  castling = { ...prev.castling };
  enPassant = prev.enPassant ? { ...prev.enPassant } : null;
  whiteTime = prev.whiteTime;
  blackTime = prev.blackTime;
  activeTimer = prev.activeTimer;
  gameActive = true;
  winner = null;
  clearHighlights();
  renderBoard();
  checkGameState();
  updateStatus();
  // timer continues with restored activeTimer
}

// ---------- draw / stalemate buttons ----------
function drawButton() {
  if (!gameActive) return;
  gameActive = false;
  winner = 'draw';
  statusMsg = 'Draw agreed.';
  stopTimer();
  updateStatus();
  clearHighlights();
  renderBoard();
}

function stalemateButton() {
  if (!gameActive) return;
  const current = turn; // because it's the player to move
  if (!hasAnyLegalMove(current) && !isInCheck(current)) {
    gameActive = false;
    winner = 'draw';
    statusMsg = 'Stalemate!';
    stopTimer();
  } else {
    statusMsg = 'Not stalemate (has legal moves or in check)';
  }
  updateStatus();
  clearHighlights();
  renderBoard();
}

// ---------- UI event handlers ----------
document.addEventListener('click', e => {
  const square = e.target.closest('.square');
  if (!square) return;
  if (!gameActive) return;

  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  const piece = board[row][col];

  // if there is a pending promotion, ignore clicks
  if (pendingPromotion) return;

  // if nothing selected yet
  if (selectedRow === -1) {
    // select only if it's a piece of current turn
    if (piece && ((piece === piece.toUpperCase() ? 'w' : 'b') === turn)) {
      selectedRow = row; selectedCol = col;
      // generate legal moves for this piece
      const pseudo = getPieceMoves(row, col, true);
      possibleTargets = filterLegalMoves(row, col, pseudo);
      renderBoard();
    }
  } else {
    // a square is already selected – try to move
    if (selectedRow === row && selectedCol === col) {
      // deselect
      clearHighlights();
    } else {
      // attempt move
      const success = tryMove(selectedRow, selectedCol, row, col);
      if (!success) {
        // if clicking on another own piece, switch selection
        if (piece && ((piece === piece.toUpperCase() ? 'w' : 'b') === turn)) {
          selectedRow = row; selectedCol = col;
          const pseudo = getPieceMoves(row, col, true);
          possibleTargets = filterLegalMoves(row, col, pseudo);
        } else {
          clearHighlights();
        }
      }
    }
    renderBoard();
  }
});

function updateStatus() {
  document.getElementById('status').textContent = statusMsg;
}

// ---------- reset ----------
document.getElementById('reset-btn').addEventListener('click', () => {
  stopTimer();
  initBoard();
  renderBoard();
});

document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('draw-btn').addEventListener('click', drawButton);
document.getElementById('stalemate-btn').addEventListener('click', stalemateButton);

// ---------- start ----------
initBoard();
renderBoard();
updateTimerDisplay();