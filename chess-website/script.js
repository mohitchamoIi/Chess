const home = document.getElementById("home");
const boardScreen = document.getElementById("boardScreen");
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

const startBtn = document.getElementById("startGame");
const backBtn = document.getElementById("backBtn");
const resetBtn = document.getElementById("resetBtn");
const themeToggle = document.getElementById("themeToggle");

// Pieces: Uppercase = White, Lowercase = Black
const initialBoard = [
  ["r","n","b","q","k","b","n","r"],
  ["p","p","p","p","p","p","p","p"],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["P","P","P","P","P","P","P","P"],
  ["R","N","B","Q","K","B","N","R"],
];

const pieceMap = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
};

let board, selected, legalMoves, turn;

function resetGame() {
  board = JSON.parse(JSON.stringify(initialBoard));
  selected = null;
  legalMoves = [];
  turn = "white"; // player is white
  statusEl.textContent = "Your move (White)";
  renderBoard();
}

function isWhite(p) { return p && p === p.toUpperCase(); }
function isBlack(p) { return p && p === p.toLowerCase(); }
function inBounds(r,c) { return r>=0 && r<8 && c>=0 && c<8; }

function renderBoard() {
  boardEl.innerHTML = "";

  board.forEach((row, r) => {
    row.forEach((piece, c) => {
      const square = document.createElement("div");
      square.classList.add("square");

      if ((r + c) % 2 === 0) square.classList.add("light");
      else square.classList.add("dark-square");

      if (selected && selected.r === r && selected.c === c) square.classList.add("selected");
      if (legalMoves.some(m => m.r === r && m.c === c)) square.classList.add("legal");

      square.textContent = pieceMap[piece] || "";
      square.onclick = () => handleClick(r, c);

      boardEl.appendChild(square);
    });
  });
}

function handleClick(r, c) {
  if (turn !== "white") return; // prevent moving during AI turn

  const piece = board[r][c];

  if (selected) {
    if (legalMoves.some(m => m.r === r && m.c === c)) {
      movePiece(selected.r, selected.c, r, c);
      selected = null;
      legalMoves = [];
      renderBoard();

      turn = "black";
      statusEl.textContent = "Computer thinking...";
      setTimeout(computerMove, 400);
      return;
    }
  }

  if (piece && isWhite(piece)) {
    selected = { r, c };
    legalMoves = getLegalMoves(r, c, piece);
    renderBoard();
  }
}

function movePiece(sr, sc, tr, tc) {
  board[tr][tc] = board[sr][sc];
  board[sr][sc] = "";
}

function computerMove() {
  const allMoves = [];

  board.forEach((row, r) => {
    row.forEach((piece, c) => {
      if (isBlack(piece)) {
        const moves = getLegalMoves(r, c, piece);
        moves.forEach(m => allMoves.push({ from: {r, c}, to: m }));
      }
    });
  });

  if (allMoves.length === 0) {
    statusEl.textContent = "Game over";
    return;
  }

  const choice = allMoves[Math.floor(Math.random() * allMoves.length)];
  movePiece(choice.from.r, choice.from.c, choice.to.r, choice.to.c);

  turn = "white";
  statusEl.textContent = "Your move (White)";
  renderBoard();
}

function getLegalMoves(r, c, piece) {
  const moves = [];
  const dirs = {
    rook: [[1,0],[-1,0],[0,1],[0,-1]],
    bishop: [[1,1],[1,-1],[-1,1],[-1,-1]],
    knight: [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]],
    king: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
  };

  const white = isWhite(piece);

  // Pawn
  if (piece.toLowerCase() === "p") {
    const dir = white ? -1 : 1;
    const startRow = white ? 6 : 1;

    if (inBounds(r+dir,c) && board[r+dir][c] === "") moves.push({r:r+dir,c});
    if (r === startRow && board[r+dir][c] === "" && board[r+2*dir][c] === "") moves.push({r:r+2*dir,c});

    [[dir,-1],[dir,1]].forEach(([dr,dc]) => {
      const nr=r+dr,nc=c+dc;
      if (inBounds(nr,nc) && board[nr][nc] && (white?isBlack(board[nr][nc]):isWhite(board[nr][nc]))) {
        moves.push({r:nr,c:nc});
      }
    });
    return moves;
  }

  // Knight
  if (piece.toLowerCase() === "n") {
    dirs.knight.forEach(([dr,dc])=>{
      const nr=r+dr,nc=c+dc;
      if(inBounds(nr,nc) && (!board[nr][nc] || (white?isBlack(board[nr][nc]):isWhite(board[nr][nc]))))
        moves.push({r:nr,c:nc});
    });
    return moves;
  }

  // King
  if (piece.toLowerCase() === "k") {
    dirs.king.forEach(([dr,dc])=>{
      const nr=r+dr,nc=c+dc;
      if(inBounds(nr,nc) && (!board[nr][nc] || (white?isBlack(board[nr][nc]):isWhite(board[nr][nc]))))
        moves.push({r:nr,c:nc});
    });
    return moves;
  }

  // Sliding pieces (rook, bishop, queen)
  let slideDirs = [];
  if (piece.toLowerCase() === "r") slideDirs = dirs.rook;
  if (piece.toLowerCase() === "b") slideDirs = dirs.bishop;
  if (piece.toLowerCase() === "q") slideDirs = dirs.rook.concat(dirs.bishop);

  slideDirs.forEach(([dr,dc]) => {
    let nr=r+dr, nc=c+dc;
    while(inBounds(nr,nc)){
      if(board[nr][nc] === "") moves.push({r:nr,c:nc});
      else {
        if(white?isBlack(board[nr][nc]):isWhite(board[nr][nc])) moves.push({r:nr,c:nc});
        break;
      }
      nr+=dr; nc+=dc;
    }
  });

  return moves;
}

// ----------------------
// Basic Tests (console)
// ----------------------
function runTests() {
  console.log("Running basic tests...");
  const testBoard = JSON.parse(JSON.stringify(initialBoard));
  board = testBoard;

  const whitePawnMoves = getLegalMoves(6, 0, "P");
  console.assert(whitePawnMoves.length === 2, "White pawn initial should have 2 moves");

  const blackPawnMoves = getLegalMoves(1, 0, "p");
  console.assert(blackPawnMoves.length === 2, "Black pawn initial should have 2 moves");

  console.log("Tests completed. If no assertion errors, logic is OK.");
}

// ----------------------
// Event bindings
// ----------------------
startBtn.onclick = () => {
  home.classList.add("hidden");
  boardScreen.classList.remove("hidden");
  resetGame();
  runTests();
};

backBtn.onclick = () => {
  boardScreen.classList.add("hidden");
  home.classList.remove("hidden");
};

resetBtn.onclick = resetGame;

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
};
