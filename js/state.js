// Game State
export let deck = [];
export let stock = [];
export let waste = [];
export let foundations = [[], [], [], []];
export let tableaus = [[], [], [], [], [], [], []];
export let isGameActive = true;
export let moveHistory = [];
export let isRobotActive = false;
export let robotIntervalId = null;
export let lastTap = 0;

// Dragging State
export let draggedCards = [];
export let sourcePileElement = null;
export let sourcePileData = null;

// State Modifying Functions
export function updateState(newState) {
    deck = newState.deck ?? deck;
    stock = newState.stock ?? stock;
    waste = newState.waste ?? waste;
    foundations = newState.foundations ?? foundations;
    tableaus = newState.tableaus ?? tableaus;
    isGameActive = newState.isGameActive ?? isGameActive;
    moveHistory = newState.moveHistory ?? moveHistory;
    isRobotActive = newState.isRobotActive ?? isRobotActive;
    robotIntervalId = newState.robotIntervalId ?? robotIntervalId;
    lastTap = newState.lastTap ?? lastTap;
    draggedCards = newState.draggedCards ?? draggedCards;
    sourcePileElement = newState.sourcePileElement ?? sourcePileElement;
    sourcePileData = newState.sourcePileData ?? sourcePileData;
}

export function saveState() {
    const state = {
        stock: stock.map(c => ({ suit: c.suit, rank: c.rank, isFaceUp: c.isFaceUp })),
        waste: waste.map(c => ({ suit: c.suit, rank: c.rank, isFaceUp: c.isFaceUp })),
        foundations: foundations.map(p => p.map(c => ({ suit: c.suit, rank: c.rank, isFaceUp: c.isFaceUp }))),
        tableaus: tableaus.map(p => p.map(c => ({ suit: c.suit, rank: c.rank, isFaceUp: c.isFaceUp })))
    };
    moveHistory.push(state);
}

export function getLastMove() {
    if (moveHistory.length > 0) {
        return moveHistory.pop();
    }
    return null;
}