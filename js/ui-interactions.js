import * as dom from './dom.js';
import * as state from './state.js';
import { renderAllPiles } from './render.js';
import { isValidFoundationMove, isValidTableauMove, checkWinCondition, undoMove } from './game-logic.js';
import { startRobot, stopRobot } from './robot.js';

function handleDoubleTap(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - state.lastTap;
    if (tapLength < 300 && tapLength > 0) {
        e.preventDefault();
        const cardElement = e.target.closest('.card');
        if (cardElement) {
            // This now dispatches our custom event, just like the desktop logic.
            cardElement.dispatchEvent(new CustomEvent('card-double-click', { bubbles: true }));
        } else {
            onAutoCompleteClick(e);
        }
    }
    state.updateState({ lastTap: currentTime });
}

function onAutoCompleteClick(e) {
    if (!state.isGameActive || state.isRobotActive) return;
    e.preventDefault();
    e.stopPropagation();
    state.saveState();
    
    let movedACard = false;
    let aMoveWasMadeThisCycle = true;

    while (aMoveWasMadeThisCycle) {
        aMoveWasMadeThisCycle = false;

        for (let i = 0; i < state.tableaus.length; i++) {
            const tableau = state.tableaus[i];
            if (tableau.length > 0) {
                const topCard = tableau[tableau.length - 1];
                for (let j = 0; j < state.foundations.length; j++) {
                    if (isValidFoundationMove(topCard, state.foundations[j])) {
                        state.foundations[j].push(tableau.pop());
                        if (tableau.length > 0) tableau[tableau.length - 1].flip(true);
                        aMoveWasMadeThisCycle = true;
                        movedACard = true;
                        break; 
                    }
                }
            }
        }

        if (state.waste.length > 0) {
            const topCard = state.waste[state.waste.length - 1];
            for (let j = 0; j < state.foundations.length; j++) {
                if (isValidFoundationMove(topCard, state.foundations[j])) {
                    state.foundations[j].push(state.waste.pop());
                    aMoveWasMadeThisCycle = true;
                    movedACard = true;
                    break;
                }
            }
        }
    }
    
    if (movedACard) {
        renderAllPiles();
        checkWinCondition();
    } else {
        state.moveHistory.pop();
    }
}

function highlightHint(sourceEl, destEl) {
    sourceEl.classList.add('hint-highlight');
    destEl.classList.add('hint-highlight');
    setTimeout(() => {
        sourceEl.classList.remove('hint-highlight');
        destEl.classList.remove('hint-highlight');
    }, 1500);
}

function showHint() {
    if (state.isRobotActive) return;

    // Hint: Waste to Foundation
    if (state.waste.length > 0) {
        const card = state.waste[state.waste.length - 1];
        for (let i = 0; i < state.foundations.length; i++) {
            if (isValidFoundationMove(card, state.foundations[i])) {
                highlightHint(card.element, dom.foundationPiles[i]);
                return;
            }
        }
    }
    // Hint: Tableau to Foundation
    for (let i = 0; i < state.tableaus.length; i++) {
        if (state.tableaus[i].length > 0) {
            const card = state.tableaus[i][state.tableaus[i].length - 1];
            for (let j = 0; j < state.foundations.length; j++) {
                if (isValidFoundationMove(card, state.foundations[j])) {
                    highlightHint(card.element, dom.foundationPiles[j]);
                    return;
                }
            }
        }
    }
    // Hint: Uncover a card in Tableau
    for (let i = 0; i < state.tableaus.length; i++) {
        const sourceTableau = state.tableaus[i];
        let firstFaceUpIndex = sourceTableau.findIndex(c => c.isFaceUp);
        if (firstFaceUpIndex > 0) {
            const cardToMove = sourceTableau[firstFaceUpIndex];
            for (let j = 0; j < state.tableaus.length; j++) {
                if (i === j) continue;
                if (isValidTableauMove(cardToMove, state.tableaus[j])) {
                    const destEl = state.tableaus[j].length > 0 ? state.tableaus[j][state.tableaus[j].length - 1].element : dom.tableauPiles[j];
                    highlightHint(cardToMove.element, destEl);
                    return;
                }
            }
        }
    }
    // Hint: Any other valid Tableau move
    for (let i = 0; i < state.tableaus.length; i++) {
        for (let k = 0; k < state.tableaus[i].length; k++) {
            if (state.tableaus[i][k].isFaceUp) {
                const cardToMove = state.tableaus[i][k];
                for (let j = 0; j < state.tableaus.length; j++) {
                    if (i === j) continue;
                    if (isValidTableauMove(cardToMove, state.tableaus[j])) {
                        const destEl = state.tableaus[j].length > 0 ? state.tableaus[j][state.tableaus[j].length - 1].element : dom.tableauPiles[j];
                        highlightHint(cardToMove.element, destEl);
                        return;
                    }
                }
                break;
            }
        }
    }
}

const themes = {
    'blue': { '--card-back-primary': '#0000a0', '--card-back-secondary': '#5555ff' },
    'red': { '--card-back-primary': '#a00000', '--card-back-secondary': '#ff5555' },
    'green': { '--card-back-primary': '#006400', '--card-back-secondary': '#228B22' },
    'castle': { '--card-back-primary': '#4B0082', '--card-back-secondary': '#8A2BE2' },
    'beach': { '--card-back-primary': '#00BFFF', '--card-back-secondary': '#FFD700' }
};

function setTheme(themeName) {
    const theme = themes[themeName];
    Object.keys(theme).forEach(prop => dom.root.style.setProperty(prop, theme[prop]));
    document.querySelectorAll('.deck-preview').forEach(p => p.classList.toggle('selected', p.dataset.theme === themeName));
}

function populateDeckOptions() {
    dom.deckOptionsGrid.innerHTML = '';
    Object.keys(themes).forEach(themeName => {
        const preview = document.createElement('div');
        preview.classList.add('deck-preview');
        preview.dataset.theme = themeName;
        preview.style.setProperty('--card-back-primary', themes[themeName]['--card-back-primary']);
        preview.style.setProperty('--card-back-secondary', themes[themeName]['--card-back-secondary']);
        preview.addEventListener('click', () => {
            setTheme(themeName);
            dom.optionsModal.style.display = 'none';
        });
        dom.deckOptionsGrid.appendChild(preview);
    });
}

export function initializeUI() {
    document.addEventListener('touchend', handleDoubleTap);
    document.addEventListener('contextmenu', onAutoCompleteClick);
    document.addEventListener('keydown', (e) => { if (e.key === 'Backspace') undoMove(); });

    dom.hintBtn.addEventListener('click', showHint);
    dom.startRobotBtn.addEventListener('click', startRobot);
    dom.stopRobotBtn.addEventListener('click', stopRobot);

    dom.deckBtn.addEventListener('click', () => dom.optionsModal.style.display = 'flex');
    dom.closeModalBtn.addEventListener('click', () => dom.optionsModal.style.display = 'none');
    dom.optionsModal.addEventListener('click', (e) => { if (e.target === dom.optionsModal) dom.optionsModal.style.display = 'none'; });

    dom.menuToggle.addEventListener('click', () => {
        dom.sideMenu.classList.toggle('open');
        document.body.classList.toggle('menu-open');
    });

    populateDeckOptions();
    setTheme('blue');
}