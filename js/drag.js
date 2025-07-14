import * as dom from './dom.js';
import * as state from './state.js';
import { renderAllPiles } from './render.js';
import { tryMoveToFoundation, tryMoveToTableau, checkWinCondition } from './game-logic.js';
import { OVERLAP_OFFSET, DOUBLE_CLICK_SPEED } from './constants.js';

let dragOffsetX, dragOffsetY;
let lastClick = { time: 0, target: null };

function getEventCoords(e) {
    return e.touches ? e.touches[0] : e;
}

function findBestDropTarget() {
    if (state.draggedCards.length === 0) return null;

    const draggedRect = state.draggedCards[0].element.getBoundingClientRect();
    let bestTarget = null;
    let maxOverlap = 0;

    const potentialTargets = [...dom.tableauPiles, ...dom.foundationPiles];

    for (const pileEl of potentialTargets) {
        if (pileEl === state.sourcePileElement) continue;

        let targetRect;
        if (pileEl.classList.contains('tableau')) {
            const pileIndex = parseInt(pileEl.id.split('-')[1]);
            const tableau = state.tableaus[pileIndex];
            targetRect = tableau.length > 0 ? tableau[tableau.length - 1].element.getBoundingClientRect() : pileEl.getBoundingClientRect();
        } else {
            targetRect = pileEl.getBoundingClientRect();
        }

        const overlapX = Math.max(0, Math.min(draggedRect.right, targetRect.right) - Math.max(draggedRect.left, targetRect.left));
        const overlapY = Math.max(0, Math.min(draggedRect.bottom, targetRect.bottom) - Math.max(draggedRect.top, targetRect.top));
        const overlapArea = overlapX * overlapY;

        if (overlapArea > maxOverlap) {
            maxOverlap = overlapArea;
            bestTarget = pileEl;
        }
    }
    
    const minOverlapThreshold = (draggedRect.width * draggedRect.height) * 0.25; 
    return maxOverlap > minOverlapThreshold ? bestTarget : null;
}

function drag(e) {
    if (state.draggedCards.length === 0) return;
    if (e.type === 'touchmove') e.preventDefault();
    
    const coords = getEventCoords(e);
    const boardRect = dom.gameBoard.getBoundingClientRect();
    const newX = coords.clientX - boardRect.left - dragOffsetX;
    const newY = coords.clientY - boardRect.top - dragOffsetY;
    const overlap = (state.sourcePileElement.classList.contains('tableau')) ? OVERLAP_OFFSET : 0;

    state.draggedCards.forEach((card, i) => {
        card.element.style.left = `${newX}px`;
        card.element.style.top = `${newY + (i * overlap)}px`;
    });
}

function endDrag(e) {
    if (state.draggedCards.length === 0) return;

    const dropTarget = findBestDropTarget();
    let moveSuccessful = false;

    if (dropTarget) {
        if (dropTarget.classList.contains('foundation')) {
            moveSuccessful = tryMoveToFoundation(state.draggedCards, dropTarget.id);
        } else if (dropTarget.classList.contains('tableau')) {
            moveSuccessful = tryMoveToTableau(state.draggedCards, dropTarget.id);
        }
    }

    if (moveSuccessful) {
        state.sourcePileData.splice(-state.draggedCards.length);
        if (state.sourcePileElement.classList.contains('tableau') && state.sourcePileData.length > 0) {
            const topCard = state.sourcePileData[state.sourcePileData.length - 1];
            if (!topCard.isFaceUp) topCard.flip(true);
        }
        checkWinCondition();
    } else {
        state.moveHistory.pop(); // Revert the state save if move failed
    }

    state.draggedCards.forEach(card => card.element.classList.remove('dragging'));
    state.updateState({ draggedCards: [] });
    renderAllPiles(); 

    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
}

export function startDrag(e) {
    if (!state.isGameActive || state.isRobotActive || (e.type === 'mousedown' && e.button !== 0)) return;
    
    // --- Manual Double-Click Detection ---
    const now = Date.now();
    const cardElement = e.currentTarget;

    if (now - lastClick.time < DOUBLE_CLICK_SPEED && lastClick.target === cardElement) {
        // If the same card is clicked again quickly, dispatch our custom event.
        e.preventDefault();
        cardElement.dispatchEvent(new CustomEvent('card-double-click', { bubbles: true }));
        lastClick = { time: 0, target: null }; // Reset the tracker
        return; // IMPORTANT: Stop here and do not start a drag.
    }

    lastClick = { time: now, target: cardElement };
    // --- END Manual Double-Click Detection ---

    e.preventDefault();
    e.stopPropagation();

    const cardInstance = cardElement.cardInstance;
    if (!cardInstance.isFaceUp || state.draggedCards.length > 0) return;

    const currentSourcePileElement = cardElement.parentElement;
    let currentSourcePileData, cardsToDrag = [];

    if (currentSourcePileElement.classList.contains('tableau')) {
        const pileIndex = parseInt(currentSourcePileElement.id.split('-')[1]);
        currentSourcePileData = state.tableaus[pileIndex];
        const cardIndex = currentSourcePileData.indexOf(cardInstance);
        cardsToDrag = currentSourcePileData.slice(cardIndex);
    } else if (currentSourcePileElement.classList.contains('foundation')) {
        const pileIndex = parseInt(currentSourcePileElement.id.split('-')[1]);
        currentSourcePileData = state.foundations[pileIndex];
        if (currentSourcePileData.length > 0 && cardInstance === currentSourcePileData[currentSourcePileData.length - 1]) cardsToDrag = [cardInstance];
    } else if (currentSourcePileElement.id === 'waste') {
        currentSourcePileData = state.waste;
        if (currentSourcePileData.length > 0 && cardInstance === currentSourcePileData[currentSourcePileData.length - 1]) cardsToDrag = [cardInstance];
    }
    
    if (cardsToDrag.length === 0) return;

    state.updateState({
        draggedCards: cardsToDrag,
        sourcePileElement: currentSourcePileElement,
        sourcePileData: currentSourcePileData
    });
    
    state.saveState();
    const initialRect = cardElement.getBoundingClientRect();
    
    if (currentSourcePileElement.id === 'waste') {
        const secondToLastCard = state.waste.length > 1 ? state.waste[state.waste.length - 2] : null;
        dom.wastePile.innerHTML = '';
        if (secondToLastCard) dom.wastePile.appendChild(secondToLastCard.element);
    }
    
    const coords = getEventCoords(e);
    dragOffsetX = coords.clientX - initialRect.left;
    dragOffsetY = coords.clientY - initialRect.top;

    const boardRect = dom.gameBoard.getBoundingClientRect();
    cardsToDrag.forEach((card, i) => {
        const cardElToMove = card.element;
        cardElToMove.classList.add('dragging');
        cardElToMove.style.zIndex = 1000 + i;
        const overlap = (currentSourcePileElement.classList.contains('tableau')) ? OVERLAP_OFFSET : 0;
        cardElToMove.style.left = `${initialRect.left - boardRect.left}px`;
        cardElToMove.style.top = `${initialRect.top - boardRect.top + (i * overlap)}px`;
        dom.gameBoard.appendChild(cardElToMove);
    });
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
}