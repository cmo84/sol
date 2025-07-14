import * as dom from './dom.js';
import { initGame, drawFromStock, undoMove, magicSolve, onSingleCardDoubleClick } from './game-logic.js';
import { initializeUI } from './ui-interactions.js';

// This listener ensures the DOM is ready before we do anything.
document.addEventListener('DOMContentLoaded', () => {

    // --- Attach Core Game Action Listeners ---
    dom.stockPile.addEventListener('click', drawFromStock);
    dom.newGameWinBtn.addEventListener('click', initGame);
    dom.newGameMenuBtn.addEventListener('click', initGame);
    dom.undoBtn.addEventListener('click', undoMove);
    dom.undoMainBtn.addEventListener('click', undoMove);
    dom.solveBtn.addEventListener('click', magicSolve);
    
    // Listen for our custom event on the whole game board.
    dom.gameBoard.addEventListener('card-double-click', (e) => {
        // e.target will be the card that was clicked.
        // We pass it to the handler in the expected format.
        onSingleCardDoubleClick({ currentTarget: e.target });
    });

    // --- Initialize All Other UI Listeners (Hints, Robot, Modals, etc.) ---
    initializeUI();

    // --- Start the First Game ---
    initGame();
});