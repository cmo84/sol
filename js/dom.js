export const gameBoard = document.getElementById('game-board');
export const stockPile = document.getElementById('stock');
export const stockVisualContainer = document.getElementById('stock-visual-container');
export const wastePile = document.getElementById('waste');
export const foundationPiles = Array.from(document.querySelectorAll('.foundation'));
export const tableauPiles = Array.from(document.querySelectorAll('.tableau'));

export const winOverlay = document.getElementById('win-overlay');
export const newGameWinBtn = document.getElementById('new-game-win-btn');
export const newGameMenuBtn = document.getElementById('new-game-menu-btn');

export const undoBtn = document.getElementById('undo-btn');
export const undoMainBtn = document.getElementById('undo-main-btn');
export const hintBtn = document.getElementById('hint-btn');
export const solveBtn = document.getElementById('solve-btn');

export const startRobotBtn = document.getElementById('start-robot-btn');
export const stopRobotBtn = document.getElementById('stop-robot-btn');

export const deckBtn = document.getElementById('deck-btn');
export const optionsModal = document.getElementById('options-modal');
export const closeModalBtn = document.getElementById('close-modal-btn');
export const deckOptionsGrid = document.getElementById('deck-options-grid');

export const menuToggle = document.getElementById('menu-toggle');
export const sideMenu = document.getElementById('side-menu');
export const root = document.documentElement;