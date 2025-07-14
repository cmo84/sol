// js/robot.js

import * as state from './state.js';
import * as dom from './dom.js';
import { renderAllPiles } from './render.js';
import { isValidFoundationMove, isValidTableauMove, checkWinCondition } from './game-logic.js';

let robotIntervalId = null;

export function stopRobot() {
    state.updateState({ isRobotActive: false });
    dom.startRobotBtn.style.display = 'inline-block';
    dom.stopRobotBtn.style.display = 'none';
    if (robotIntervalId) {
        clearInterval(robotIntervalId);
        robotIntervalId = null;
    }
}

function tryRobotMoveToFoundation() {
    // Check waste pile
    if (state.waste.length > 0) {
        const card = state.waste[state.waste.length - 1];
        for (let i = 0; i < state.foundations.length; i++) {
            if (isValidFoundationMove(card, state.foundations[i])) {
                state.saveState();
                state.foundations[i].push(state.waste.pop());
                renderAllPiles();
                checkWinCondition();
                return true;
            }
        }
    }
    // Check tableau piles
    for (let i = 0; i < state.tableaus.length; i++) {
        const tableau = state.tableaus[i];
        if (tableau.length > 0) {
            const card = tableau[tableau.length - 1];
            for (let j = 0; j < state.foundations.length; j++) {
                if (isValidFoundationMove(card, state.foundations[j])) {
                    state.saveState();
                    state.foundations[j].push(tableau.pop());
                    if (tableau.length > 0) tableau[tableau.length - 1].flip(true);
                    renderAllPiles();
                    checkWinCondition();
                    return true;
                }
            }
        }
    }
    return false;
}

function tryRobotTableauMove() {
    // Prioritize moves that uncover a card
    for (let i = 0; i < state.tableaus.length; i++) {
        const sourceTableau = state.tableaus[i];
        let firstFaceUpIndex = sourceTableau.findIndex(c => c.isFaceUp);

        if (firstFaceUpIndex > 0) { // A face-down card exists underneath
            const cardToMove = sourceTableau[firstFaceUpIndex];
            const stackToMove = sourceTableau.slice(firstFaceUpIndex);
            for (let j = 0; j < state.tableaus.length; j++) {
                if (i === j) continue;
                const destTableau = state.tableaus[j];
                if (isValidTableauMove(cardToMove, destTableau)) {
                    state.saveState();
                    destTableau.push(...stackToMove);
                    sourceTableau.splice(firstFaceUpIndex);
                    if(sourceTableau.length > 0) sourceTableau[sourceTableau.length-1].flip(true);
                    renderAllPiles();
                    return true;
                }
            }
        }
    }
    
    // Try to move a King to an empty space
    for (let i = 0; i < state.tableaus.length; i++) {
        const sourceTableau = state.tableaus[i];
        if (sourceTableau.length > 0) {
            const bottomCard = sourceTableau[0];
            if (bottomCard.isFaceUp && bottomCard.rank === 'K') {
                    for (let j = 0; j < state.tableaus.length; j++) {
                        if (state.tableaus[j].length === 0) {
                            state.saveState();
                            state.tableaus[j].push(...sourceTableau.splice(0));
                            renderAllPiles();
                            return true;
                        }
                    }
            }
        }
    }
    return false;
}

function tryRobotDrawStock() {
    if (state.stock.length > 0) {
        state.saveState();
        const cardToMove = state.stock.pop();
        cardToMove.flip(true);
        state.waste.push(cardToMove);
        renderAllPiles();
        return true;
    } else if (state.waste.length > 0) {
        state.saveState();
        const newStock = state.waste.reverse();
        newStock.forEach(card => card.flip(false));
        state.updateState({ stock: newStock, waste: [] });
        renderAllPiles();
        return true;
    }
    return false;
}

function robotPlayMove() {
    if (!state.isGameActive) return;
    const foundMove = tryRobotMoveToFoundation() || tryRobotTableauMove() || tryRobotDrawStock();
    if (!foundMove) {
        console.log("Robot cannot find any more moves.");
        stopRobot();
    }
}

export function startRobot() {
    state.updateState({ isRobotActive: true });
    dom.startRobotBtn.style.display = 'none';
    dom.stopRobotBtn.style.display = 'inline-block';
    robotIntervalId = setInterval(robotPlayMove, 800);
}