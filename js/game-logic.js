import { SUITS, RANKS } from './constants.js';
import * as dom from './dom.js';
import * as state from './state.js';
import { Card } from './card.js';
import { renderAllPiles, startWinAnimation } from './render.js';
import { startDrag } from './drag.js';
import { stopRobot } from './robot.js';

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function checkWinCondition() {
    const totalCardsInFoundations = state.foundations.reduce((sum, pile) => sum + pile.length, 0);
    if (totalCardsInFoundations === 52) {
        state.updateState({ isGameActive: false });
        startWinAnimation();
    }
}

export function isValidFoundationMove(card, foundationPile) {
    const topCard = foundationPile.length > 0 ? foundationPile[foundationPile.length - 1] : null;
    return !topCard ? card.rank === 'A' : card.suit === topCard.suit && card.value === topCard.value + 1;
}

export function isValidTableauMove(card, tableauPile) {
    const topCard = tableauPile.length > 0 ? tableauPile[tableauPile.length - 1] : null;
    return !topCard ? card.rank === 'K' : card.color !== topCard.color && card.value === topCard.value - 1;
}

export function tryMoveToFoundation(cardsToMove, foundationId) {
    if (cardsToMove.length !== 1) return false;
    const card = cardsToMove[0];
    const pileIndex = parseInt(foundationId.split('-')[1]);
    const targetPile = state.foundations[pileIndex];
    if (isValidFoundationMove(card, targetPile)) {
        targetPile.push(card);
        return true;
    }
    return false;
}

export function tryMoveToTableau(cardsToMove, tableauId) {
    const card = cardsToMove[0];
    const pileIndex = parseInt(tableauId.split('-')[1]);
    const targetPile = state.tableaus[pileIndex];
    if (isValidTableauMove(card, targetPile)) {
        targetPile.push(...cardsToMove);
        return true;
    }
    return false;
}

export function onSingleCardDoubleClick(e) {
    if (!state.isGameActive || state.isRobotActive) return;

    const cardInstance = e.currentTarget.cardInstance;
    if (!cardInstance.isFaceUp) return;

    const parentPileEl = e.currentTarget.parentElement;
    let sourcePileData;

    if (parentPileEl.classList.contains('tableau')) {
        sourcePileData = state.tableaus[parseInt(parentPileEl.id.split('-')[1])];
    } else if (parentPileEl.id === 'waste') {
        sourcePileData = state.waste;
    } else {
        return;
    }
    
    if (sourcePileData.length === 0 || sourcePileData[sourcePileData.length - 1] !== cardInstance) {
        return;
    }
    
    for (let i = 0; i < dom.foundationPiles.length; i++) {
        if (isValidFoundationMove(cardInstance, state.foundations[i])) {
            state.saveState();
            sourcePileData.pop();
            state.foundations[i].push(cardInstance);
            
            if (parentPileEl.classList.contains('tableau') && sourcePileData.length > 0) {
                sourcePileData[sourcePileData.length - 1].flip(true);
            }
            
            renderAllPiles();
            checkWinCondition();
            return;
        }
    }
}

const cardEventHandlers = {
    onDragStart: startDrag
};

export function createCard(suit, rank) {
    return new Card(suit, rank, cardEventHandlers);
}

export function initGame() {
    stopRobot();
    const newDeck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            newDeck.push(createCard(suit, rank));
        }
    }
    shuffle(newDeck);

    const newTableaus = Array.from({ length: 7 }, () => []);
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j <= i; j++) {
            const card = newDeck.pop();
            newTableaus[i].push(card);
            if (j === i) card.flip(true);
        }
    }

    state.updateState({
        deck: newDeck,
        stock: newDeck,
        waste: [],
        foundations: [[], [], [], []],
        tableaus: newTableaus,
        moveHistory: [],
        isGameActive: true
    });
    
    document.querySelectorAll('.card.bouncing').forEach(c => c.remove());
    [...dom.foundationPiles, ...dom.tableauPiles, dom.wastePile].forEach(p => p.innerHTML = '');
    dom.winOverlay.style.display = 'none';
    
    renderAllPiles();
}

export function drawFromStock() {
    if (!state.isGameActive || state.isRobotActive) return;
    state.saveState();
    if (state.stock.length > 0) {
        const cardToMove = state.stock.pop();
        cardToMove.flip(true);
        state.waste.push(cardToMove);
    } else if (state.waste.length > 0) {
        const newStock = state.waste.reverse();
        newStock.forEach(card => card.flip(false));
        state.updateState({ stock: newStock, waste: [] });
    }
    renderAllPiles();
}

export function undoMove() {
    if (state.isRobotActive) return;
    const lastState = state.getLastMove();
    if (!lastState) return;
    
    const restorePile = (pileData) => pileData.map(data => {
        const card = createCard(data.suit, data.rank);
        card.flip(data.isFaceUp);
        return card;
    });

    state.updateState({
        stock: restorePile(lastState.stock),
        waste: restorePile(lastState.waste),
        foundations: lastState.foundations.map(p => restorePile(p)),
        tableaus: lastState.tableaus.map(p => restorePile(p)),
    });

    renderAllPiles();
}

export function magicSolve() {
    if (!state.isGameActive) return;
    stopRobot();

    const newFoundations = [];
    for (let i = 0; i < SUITS.length; i++) {
        const suitPile = [];
        for (let j = 0; j < RANKS.length; j++) {
            const card = createCard(SUITS[i], RANKS[j]);
            card.flip(true);
            suitPile.push(card);
        }
        newFoundations.push(suitPile);
    }

    state.updateState({
        stock: [],
        waste: [],
        tableaus: Array.from({ length: 7 }, () => []),
        foundations: newFoundations
    });
    
    renderAllPiles();
    checkWinCondition();
}