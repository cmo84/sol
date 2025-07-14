import * as dom from './dom.js';
import * as state from './state.js';
import { OVERLAP_OFFSET } from './constants.js';

function renderPile(pileElement, pileData, overlap = 0) {
    pileElement.innerHTML = '';
    pileData.forEach((card, index) => {
        pileElement.appendChild(card.element);
        card.element.style.top = `${index * overlap}px`;
        card.element.style.left = '0px';
        card.element.style.zIndex = index;
    });
}

function renderTableaus() {
    dom.tableauPiles.forEach((pileEl, i) => renderPile(pileEl, state.tableaus[i], OVERLAP_OFFSET));
}

function renderFoundations() {
    dom.foundationPiles.forEach((pileEl, i) => renderPile(pileEl, state.foundations[i]));
}

function renderWaste() {
    dom.wastePile.innerHTML = '';
    if (state.waste.length > 0) {
        const topCard = state.waste[state.waste.length - 1];
        dom.wastePile.appendChild(topCard.element);
        topCard.element.style.top = '0px';
        topCard.element.style.left = '0px';
    }
}

function renderStock() {
    dom.stockVisualContainer.innerHTML = '';
    if (state.stock.length > 0) {
        const stackDiv = document.createElement('div');
        stackDiv.classList.add('card-stack');
        dom.stockVisualContainer.appendChild(stackDiv);
    } else {
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `width:100%; height:100%; border: 2px dashed rgba(0,0,0,0.3); border-radius: var(--card-border-radius);`;
        dom.stockVisualContainer.appendChild(placeholder);
    }
}

export function renderAllPiles() {
    renderTableaus();
    renderFoundations();
    renderWaste();
    renderStock();
}

export function startWinAnimation() {
    const allCards = state.foundations.flat();
    const bouncingCards = [];
    
    allCards.forEach(cardInstance => {
        const cardEl = cardInstance.element;
        const cardRect = dom.foundationPiles[0].getBoundingClientRect();
        cardEl.classList.add('bouncing');
        cardEl.style.transition = 'none';
        document.body.appendChild(cardEl);
        
        bouncingCards.push({
            el: cardEl,
            x: cardRect.left,
            y: cardRect.top,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 1) * 20
        });
    });

    let animationFrameId;
    function winAnimationLoop() {
        bouncingCards.forEach(card => {
            card.vy += 0.5; // Gravity
            card.x += card.vx;
            card.y += card.vy;

            if (card.x < 0 || card.x + card.el.offsetWidth > window.innerWidth) {
                card.vx *= -0.9;
                card.x = Math.max(0, Math.min(card.x, window.innerWidth - card.el.offsetWidth));
            }
            if (card.y + card.el.offsetHeight > window.innerHeight) {
                card.vy *= -0.85;
                card.y = window.innerHeight - card.el.offsetHeight;
                card.vx *= 0.98;
            }
            
            card.el.style.left = `${card.x}px`;
            card.el.style.top = `${card.y}px`;
        });
        
        animationFrameId = requestAnimationFrame(winAnimationLoop);
    }
    
    winAnimationLoop();
    
    setTimeout(() => {
        cancelAnimationFrame(animationFrameId);
        dom.winOverlay.style.display = 'flex';
    }, 15000);
}