// Simple minimax AI using chess.js game object
// Returns a best move in SAN or verbose object accepted by game.move()

function evaluateBoard(g){
  const values = {p:1, n:3, b:3, r:5, q:9, k:0};
  const board = g.board();
  let score = 0;
  for(let r of board){
    for(let p of r){
      if(!p) continue;
      score += (p.color === 'w' ? 1 : -1) * values[p.type];
    }
  }
  return score;
}

function minimax(g, depth, isMaximizingPlayer, alpha, beta){
  if(depth === 0 || g.game_over()){
    return evaluateBoard(g);
  }
  const moves = g.moves({verbose:true});
  if(isMaximizingPlayer){
    let maxEval = -Infinity;
    for(let m of moves){
      g.move({from:m.from,to:m.to,promotion:m.promotion});
      const eval = minimax(g, depth-1, false, alpha, beta);
      g.undo();
      if(eval > maxEval){ maxEval = eval; }
      alpha = Math.max(alpha, eval);
      if(beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for(let m of moves){
      g.move({from:m.from,to:m.to,promotion:m.promotion});
      const eval = minimax(g, depth-1, true, alpha, beta);
      g.undo();
      if(eval < minEval){ minEval = eval; }
      beta = Math.min(beta, eval);
      if(beta <= alpha) break;
    }
    return minEval;
  }
}

function getBestMove(game, depth){
  const moves = game.moves({verbose:true});
  let bestMove = null;
  let bestValue = game.turn() === 'w' ? -Infinity : Infinity;
  for(let m of moves){
    game.move({from:m.from,to:m.to,promotion:m.promotion});
    const val = minimax(game, depth-1, game.turn() === 'w' ? false : true, -Infinity, Infinity);
    game.undo();
    if(game.turn() === 'w'){
      // If it's white's turn now, we evaluated from white perspective
      if(val > bestValue){ bestValue = val; bestMove = m; }
    } else {
      if(val < bestValue){ bestValue = val; bestMove = m; }
    }
  }
  return bestMove; // verbose move object
}

// Expose for script.js in browser
window.getBestMove = getBestMove;