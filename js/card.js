import { RANK_VALUES } from './constants.js';

export class Card {
    constructor(suit, rank, handlers) {
        this.suit = suit;
        this.rank = rank;
        this.value = RANK_VALUES[rank];
        this.color = (suit === '♥' || suit === '♦') ? 'red' : 'black';
        this.isFaceUp = false;
        this.element = this.createElement(handlers);
        this.element.cardInstance = this;
    }

    createElement(handlers) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', this.color, 'face-down');
        cardDiv.dataset.rank = this.rank;
        cardDiv.dataset.suit = this.suit;
        const face = `<div class="face"><div class="top-left"><div class="rank">${this.rank}</div><div class="suit">${this.suit}</div></div><div class="center-suit">${this.suit}</div><div class="bottom-right"><div class="rank">${this.rank}</div><div class="suit">${this.suit}</div></div></div>`;
        const back = `<div class="back"></div>`;
        cardDiv.innerHTML = face + back;

        // Attach event handlers passed from game logic
        if (handlers) {
            if (handlers.onDragStart) {
                 cardDiv.addEventListener('mousedown', handlers.onDragStart);
                 cardDiv.addEventListener('touchstart', handlers.onDragStart);
            }
        }
        
        return cardDiv;
    }

    flip(forceState) {
        const targetState = (typeof forceState === 'boolean') ? forceState : !this.isFaceUp;
        this.isFaceUp = targetState;
        this.element.classList.toggle('face-up', this.isFaceUp);
        this.element.classList.toggle('face-down', !this.isFaceUp);
    }
}