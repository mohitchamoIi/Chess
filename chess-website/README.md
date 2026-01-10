# Chess Website

Simple web-based chess game with two modes:

- **2 Player** — local two-player on the same device
- **Vs Computer** — play against a basic minimax AI (depth 3)

Features:
- Dark mode toggle
- Restart and Undo
- Uses `chess.js` for move legality and game rules

How to run:
1. Open `d:\Chess\chess-website\index.html` in a browser, or serve the folder with a static server (e.g., `python -m http.server`)
2. Use the mode buttons to switch between **2 Player** and **Vs Computer**. When vs computer, pick your side (White or Black).

Notes & future improvements:
- AI is a simple minimax with material evaluation. You can increase depth in `js/ai.js` (but it will be slower).
- Add PGN export, time control, better UI animations, and stronger engine integration as improvements.

Enjoy! Feel free to request features or tweaks.