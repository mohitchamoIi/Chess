document.addEventListener("DOMContentLoaded", () => {
  const home = document.getElementById("home");
  const boardScreen = document.getElementById("boardScreen");
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");

  const startBtn = document.getElementById("startGame");
  const backBtn = document.getElementById("backBtn");
  const themeToggle = document.getElementById("themeToggle");

  const initialBoard = [
    ["♜","♞","♝","♛","♚","♝","♞","♜"],
    ["♟","♟","♟","♟","♟","♟","♟","♟"],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["","","","","","","",""],
    ["♙","♙","♙","♙","♙","♙","♙","♙"],
    ["♖","♘","♗","♕","♔","♗","♘","♖"],
  ];

  let board, selected = null, validMoves = [], whiteTurn = true;

  function resetGame() {
    board = JSON.parse(JSON.stringify(initialBoard));
    selected = null;
    validMoves = [];
    whiteTurn = true;
    statusEl.textContent = "White to move";
    renderBoard();
  }

  function renderBoard() {
    boardEl.innerHTML = "";

    board.forEach((row, r) => {
      row.forEach((piece, c) => {
        const sq = document.createElement("div");
        sq.className = "square " + ((r + c) % 2 === 0 ? "light" : "dark-square");

        if (selected && selected.r === r && selected.c === c) sq.classList.add("selected");
        if (validMoves.some(m => m.r === r && m.c === c)) sq.classList.add("valid");

        sq.textContent = piece;
        sq.onclick = () => onSquareClick(r, c);
        boardEl.appendChild(sq);
      });
    });
  }

  function onSquareClick(r, c) {
    const piece = board[r][c];

    if (selected) {
      const move = validMoves.find(m => m.r === r && m.c === c);
      if (move) {
        makeMove(selected.r, selected.c, r, c);
        selected = null;
        validMoves = [];
        renderBoard();

        if (!whiteTurn) {
          statusEl.textContent = "Black thinking...";
          setTimeout(aiMove, 500);
        }
        return;
      }
    }

    if (piece && isWhite(piece) === whiteTurn) {
      selected = { r, c };
      validMoves = getLegalMoves(r, c);
      renderBoard();
    }
  }

  function makeMove(sr, sc, tr, tc) {
    board[tr][tc] = board[sr][sc];
    board[sr][sc] = "";
    whiteTurn = !whiteTurn;
    statusEl.textContent = whiteTurn ? "White to move" : "Black to move";
  }

  function isWhite(p) { return "♙♖♘♗♕♔".includes(p); }
  function isBlack(p) { return "♟♜♞♝♛♚".includes(p); }

  function getLegalMoves(r, c) {
    const piece = board[r][c];
    const moves = [];

    const dirs = {
      rook: [[1,0],[-1,0],[0,1],[0,-1]],
      bishop: [[1,1],[1,-1],[-1,1],[-1,-1]],
      queen: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
    };

    function slide(directions) {
      directions.forEach(([dr, dc]) => {
        let nr = r + dr, nc = c + dc;
        while (nr>=0 && nr<8 && nc>=0 && nc<8) {
          if (!board[nr][nc]) moves.push({r:nr,c:nc});
          else {
            if (isWhite(piece) !== isWhite(board[nr][nc])) moves.push({r:nr,c:nc});
            break;
          }
          nr += dr; nc += dc;
        }
      });
    }

    if (piece === "♙") {
      if (r>0 && !board[r-1][c]) moves.push({r:r-1,c});
      if (r===6 && !board[r-2][c] && !board[r-1][c]) moves.push({r:r-2,c});
      [[-1,-1],[-1,1]].forEach(([dr,dc])=>{
        const nr=r+dr,nc=c+dc;
        if(board[nr]?.[nc] && isBlack(board[nr][nc])) moves.push({r:nr,c:nc});
      });
    }

    if (piece === "♟") {
      if (r<7 && !board[r+1][c]) moves.push({r:r+1,c});
      if (r===1 && !board[r+2][c] && !board[r+1][c]) moves.push({r:r+2,c});
      [[1,-1],[1,1]].forEach(([dr,dc])=>{
        const nr=r+dr,nc=c+dc;
        if(board[nr]?.[nc] && isWhite(board[nr][nc])) moves.push({r:nr,c:nc});
      });
    }

    if (piece === "♖" || piece === "♜") slide(dirs.rook);
    if (piece === "♗" || piece === "♝") slide(dirs.bishop);
    if (piece === "♕" || piece === "♛") slide(dirs.queen);

    if (piece === "♘" || piece === "♞") {
      [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(([dr,dc])=>{
        const nr=r+dr,nc=c+dc;
        if(nr>=0&&nr<8&&nc>=0&&nc<8 && (!board[nr][nc] || isWhite(piece)!==isWhite(board[nr][nc])))
          moves.push({r:nr,c:nc});
      });
    }

    if (piece === "♔" || piece === "♚") {
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        if(dr||dc){
          const nr=r+dr,nc=c+dc;
          if(nr>=0&&nr<8&&nc>=0&&nc<8 && (!board[nr][nc] || isWhite(piece)!==isWhite(board[nr][nc])))
            moves.push({r:nr,c:nc});
        }
      }
    }

    return moves;
  }

  function aiMove() {
    const allMoves = [];

    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      if (board[r][c] && isBlack(board[r][c])) {
        const moves = getLegalMoves(r,c);
        moves.forEach(m => {
          const capture = board[m.r][m.c];
          const score = capture ? pieceValue(capture) : Math.random();
          allMoves.push({sr:r,sc:c,tr:m.r,tc:m.c,score});
        });
      }
    }

    if (allMoves.length === 0) {
      statusEl.textContent = "Game Over";
      return;
    }

    allMoves.sort((a,b)=>b.score-a.score);
    const move = allMoves[0];

    makeMove(move.sr, move.sc, move.tr, move.tc);
    renderBoard();
  }

  function pieceValue(p) {
    return {"♙":1,"♟":1,"♘":3,"♞":3,"♗":3,"♝":3,"♖":5,"♜":5,"♕":9,"♛":9,"♔":100,"♚":100}[p] || 0;
  }

  startBtn.onclick = () => {
    home.classList.add("hidden");
    boardScreen.classList.remove("hidden");
    resetGame();
  };

  backBtn.onclick = () => {
    boardScreen.classList.add("hidden");
    home.classList.remove("hidden");
  };

  themeToggle.onclick = () => {
    document.body.classList.toggle("dark");
  };
});
