/* Chess UI + logic using chess.js */
const game = new Chess();
let mode = 'two'; // 'two' or 'ai'
let humanColor = 'w';
let selected = null;
let legalDestinations = [];
let lastMove = null;

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const movesEl = document.getElementById('moves');
const modeTwoBtn = document.getElementById('mode-two');
const modeAiBtn = document.getElementById('mode-ai');
const sideSelect = document.getElementById('side-select');
const restartBtn = document.getElementById('btn-restart');
const undoBtn = document.getElementById('btn-undo');
const darkToggle = document.getElementById('dark-toggle');

// Piece unicode map
const UNICODE = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

function coordToSquare(col, row){
  const files = 'abcdefgh';
  return files[col] + (8 - row);
}

function renderBoard(){
  boardEl.innerHTML = '';
  const board = game.board();
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const sq = document.createElement('div');
      sq.className = 'square ' + (((r+c)%2)?'dark':'light');
      const squareName = coordToSquare(c,r);
      sq.dataset.square = squareName;
      const p = board[r][c];
      if(p){
        const key = p.color === 'w' ? p.type.toUpperCase() : p.type;
        const pieceEl = document.createElement('span');
        pieceEl.className = 'piece';
        pieceEl.textContent = UNICODE[key];
        sq.appendChild(pieceEl);
      }
      sq.addEventListener('click', onSquareClick);
      boardEl.appendChild(sq);
    }
  }
  // show last move
  document.querySelectorAll('.square.last-move').forEach(s=>s.classList.remove('last-move'));
  if(lastMove){
    const f = document.querySelector(`[data-square='${lastMove.from}']`);
    const t = document.querySelector(`[data-square='${lastMove.to}']`);
    if(f) f.classList.add('last-move');
    if(t) t.classList.add('last-move');
  }
  highlightLegal();
  updateStatus();
}

function onSquareClick(e){
  const sq = e.currentTarget.dataset.square;
  const piece = game.get(sq);
  const turn = game.turn();

  // If currently selecting a piece
  if(!selected){
    if(!piece) return;
    // allow pick only if it's the player to move
    if(mode === 'ai'){
      if(turn !== humanColor) return; // it's not human's turn
    }
    if(piece.color !== turn) return;
    selected = sq;
    const moves = game.moves({square: sq, verbose:true});
    legalDestinations = moves.map(m => m.to);
  } else {
    // if clicking same square, unselect
    if(selected === sq){ selected = null; legalDestinations = []; renderBoard(); return; }
    // if the clicked square is a legal destination, move
    if(legalDestinations.includes(sq)){
      const from = selected, to = sq;
      const moveObj = {from, to, promotion: 'q'};
      const mv = game.move(moveObj);
      selected = null; legalDestinations = [];
      animateMove(from, to, mv && mv.captured).then(()=>{
        renderBoard();
        if(mode === 'ai' && !game.game_over()){
          setTimeout(doAIMove, 200);
        }
      });
      return;
    }
    // otherwise try to select another piece
    if(piece && piece.color === turn){
      selected = sq; legalDestinations = game.moves({square:sq, verbose:true}).map(m=>m.to);
    } else {
      selected = null; legalDestinations = [];
    }
  }
  renderBoard();
}

function highlightLegal(){
  document.querySelectorAll('.square').forEach(sq=>sq.classList.remove('highlight'));
  for(let d of legalDestinations){
    const el = document.querySelector(`[data-square='${d}']`);
    if(el) el.classList.add('highlight');
  }
}

function updateStatus(){
  if(game.in_checkmate()){
    statusEl.textContent = `Checkmate — ${game.turn() === 'w' ? 'Black' : 'White'} wins`;
  } else if(game.in_draw()){
    statusEl.textContent = 'Draw';
  } else {
    statusEl.textContent = `${game.turn() === 'w' ? 'White' : 'Black'} to move` + (game.in_check() ? ' — Check' : '');
  }
  movesEl.textContent = 'Moves: ' + game.history().join(' ');
}

async function doAIMove(){
  if(game.game_over()) return;
  const depth = 3; // reasonable default
  // getBestMove is provided by ai.js
  const best = window.getBestMove(game, depth);
  if(best){
    const mv = game.move({from:best.from,to:best.to,promotion:best.promotion});
    await animateMove(best.from, best.to, mv && mv.captured);
    renderBoard();
  }
}

// Helpers for animations
function getSquareElement(square){
  return document.querySelector(`[data-square='${square}']`);
}

function animateMove(from, to, captured=false){
  return new Promise(resolve => {
    const fromEl = getSquareElement(from);
    const toEl = getSquareElement(to);
    if(!fromEl || !toEl){ lastMove = {from,to}; resolve(); return; }
    const pieceChar = fromEl.textContent;
    const boardRect = boardEl.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const floating = document.createElement('div');
    floating.className = 'floating-piece';
    floating.textContent = pieceChar;
    floating.style.left = (fromRect.left - boardRect.left) + 'px';
    floating.style.top = (fromRect.top - boardRect.top) + 'px';
    floating.style.width = fromRect.width + 'px';
    floating.style.height = fromRect.height + 'px';
    floating.style.fontSize = window.getComputedStyle(fromEl).fontSize;
    boardEl.appendChild(floating);

    // clear source visually
    fromEl.innerHTML = '';

    // animate captured piece (scale down)
    if(captured){
      const capturedPiece = toEl.querySelector('.piece');
      if(capturedPiece){ capturedPiece.classList.add('captured'); }
    }

    requestAnimationFrame(()=>{
      const dx = toRect.left - fromRect.left;
      const dy = toRect.top - fromRect.top;
      floating.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    floating.addEventListener('transitionend', ()=>{
      floating.remove();
      lastMove = {from,to};
      // cleanup captured visuals
      setTimeout(()=>{ if(toEl){ const cp = toEl.querySelector('.captured'); if(cp) cp.remove(); } }, 200);
      resolve();
    }, {once:true});
  });
}

// Controls
modeTwoBtn.addEventListener('click', ()=>{ mode = 'two'; modeTwoBtn.classList.add('active'); modeAiBtn.classList.remove('active'); renderBoard(); });
modeAiBtn.addEventListener('click', ()=>{ mode = 'ai'; modeAiBtn.classList.add('active'); modeTwoBtn.classList.remove('active'); renderBoard(); });
sideSelect.addEventListener('change', ()=>{ humanColor = sideSelect.value; restart(); });
restartBtn.addEventListener('click', restart);
undoBtn.addEventListener('click', ()=>{ game.undo(); renderBoard(); });
darkToggle.addEventListener('change', (e)=>{ document.body.classList.toggle('dark', e.target.checked); });

function restart(){ game.reset(); renderBoard(); if(mode==='ai' && humanColor!=='w'){ // AI (black/white) move if human plays black
    setTimeout(doAIMove, 300);
  }}

// initial render
renderBoard();
