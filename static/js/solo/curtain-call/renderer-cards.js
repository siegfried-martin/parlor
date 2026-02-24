/**
 * Curtain Call — Card DOM Construction
 *
 * Shared _buildCardDOM helper, hand rendering, card element creation,
 * zoomed card creation, reward card rendering, enemy choice rendering,
 * card type classification, and card playability updates.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    // === Shared Card DOM Builder ===

    /**
     * Build the common card DOM structure shared by hand cards,
     * zoomed cards, and reward cards.
     *
     * @param {Object} card - Card data object
     * @param {Object} options
     * @param {number} [options.cost] - Energy cost to display (defaults to card.cost)
     * @param {string[]} [options.extraClasses] - Additional CSS classes for the root element
     * @param {number} [options.rivetCount] - Number of rivets for Aldric edge (default 4)
     * @returns {HTMLElement} The card DOM element
     */
    _buildCardDOM(card, options) {
        if (!options) options = {};
        const cost = options.cost !== undefined ? options.cost : card.cost;
        const rivetCount = options.rivetCount || 4;
        const extraClasses = options.extraClasses || [];

        const cardDiv = document.createElement('div');
        cardDiv.className = 'game-card';
        cardDiv.classList.add(`card-${card.owner}`);

        const rarity = card.rarity || 'common';
        cardDiv.classList.add(`rarity-${rarity}`);

        extraClasses.forEach(cls => cardDiv.classList.add(cls));

        // Top rarity border
        const rarityTop = document.createElement('div');
        rarityTop.className = 'card__rarity-top';
        cardDiv.appendChild(rarityTop);

        // Card content container
        const content = document.createElement('div');
        content.className = 'card__content';

        // Stub with energy blips
        const stub = document.createElement('div');
        stub.className = 'card__stub';

        const energyContainer = document.createElement('div');
        energyContainer.className = 'card__energy';

        for (let i = 0; i < cost; i++) {
            const blip = document.createElement('div');
            blip.className = `energy-blip energy-blip--${card.owner}`;
            energyContainer.appendChild(blip);
        }
        stub.appendChild(energyContainer);
        content.appendChild(stub);

        // Perforation line
        const perforation = document.createElement('div');
        perforation.className = 'card__perforation';
        content.appendChild(perforation);

        // Card body
        const body = document.createElement('div');
        body.className = 'card__body';

        // "PRESENTING" header
        const presenting = document.createElement('div');
        presenting.className = 'card__presenting';
        presenting.textContent = '\u2014 PRESENTING \u2014';
        body.appendChild(presenting);

        // Card name
        const nameSpan = document.createElement('div');
        nameSpan.className = 'card__name';
        nameSpan.textContent = card.name;
        body.appendChild(nameSpan);

        // Decorative rule
        const rule = document.createElement('div');
        rule.className = 'card__rule';
        body.appendChild(rule);

        // Card description
        const descSpan = document.createElement('div');
        descSpan.className = 'card__description';
        descSpan.textContent = card.description;
        body.appendChild(descSpan);

        // Type badge
        const cardType = this.getCardType(card);
        const typeBadge = document.createElement('div');
        typeBadge.className = `card__type-badge type-${cardType.lowercase}`;
        typeBadge.textContent = `${cardType.icon}  ${cardType.label}`;
        body.appendChild(typeBadge);

        content.appendChild(body);

        // Aldric edge with rivets
        if (card.owner === 'aldric') {
            const edge = document.createElement('div');
            edge.className = 'card__edge';
            for (let i = 0; i < rivetCount; i++) {
                const rivet = document.createElement('div');
                rivet.className = 'card__rivet';
                edge.appendChild(rivet);
            }
            content.appendChild(edge);
        }

        cardDiv.appendChild(content);

        // Bottom rarity border
        const rarityBottom = document.createElement('div');
        rarityBottom.className = 'card__rarity-bottom';
        cardDiv.appendChild(rarityBottom);

        return cardDiv;
    },

    // === Card Rendering ===

    renderHand() {
        // Cancel any pending debounced reflow
        if (this._reflowTimer) {
            clearTimeout(this._reflowTimer);
            this._reflowTimer = null;
        }

        // If user is mid-drag, defer the reflow
        if (this._dragState && this._dragState.dragging) {
            this._reflowPaused = true;
            return;
        }

        const container = this.elements.handCards;
        if (!container) return;

        // Clear existing cards
        container.innerHTML = '';

        // Render each card in hand
        this.hand.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            container.appendChild(cardElement);
        });
    },

    createCardElement(card, index) {
        const effectiveCost = this.getEffectiveCardCost(card);
        const cardDiv = this._buildCardDOM(card, { cost: effectiveCost });

        cardDiv.dataset.index = index;
        cardDiv.dataset.cardId = card.id;
        cardDiv.dataset.instanceId = card.instanceId;

        // Check if card's protagonist is knocked out
        const protagonistState = this.combatState[card.owner];
        if (protagonistState && protagonistState.knockedOut) {
            cardDiv.classList.add('ko-unplayable');
        }

        const isPlayable = this.canPlayCard(card);
        if (!isPlayable && !cardDiv.classList.contains('ko-unplayable')) {
            cardDiv.classList.add('unplayable');
        }

        return cardDiv;
    },

    getCardType(card) {
        // v2: use card.type directly
        const type = card.type || 'action';
        switch (type) {
            case 'attack':
                return { icon: '\u2694', label: 'ATTACK', lowercase: 'attack' };
            case 'defense':
                return { icon: '\uD83D\uDEE1', label: 'DEFENSE', lowercase: 'defense' };
            case 'action':
            default:
                return { icon: '\u2726', label: 'ACTION', lowercase: 'action' };
        }
    },

    createZoomedCardElement(card) {
        const effectiveCost = this.getEffectiveCardCost(card);
        return this._buildCardDOM(card, {
            cost: effectiveCost,
            extraClasses: ['zoomed'],
            rivetCount: 5
        });
    },

    // === Reward & Enemy Choice Rendering ===

    renderRewardCards() {
        const container = this.elements.rewardsCards;
        if (!container) return;

        container.innerHTML = '';

        this.rewardOptions.forEach((card, index) => {
            if (!card) return;
            const cardDiv = this._buildCardDOM(card, { extraClasses: ['reward-card'] });
            cardDiv.dataset.index = index;
            container.appendChild(cardDiv);
        });
    },

    renderEnemyChoices(enemyIds) {
        const container = this.elements.enemyChoices;
        if (!container) return;

        container.innerHTML = '';

        enemyIds.forEach(enemyId => {
            const enemy = this.enemies[enemyId];
            if (!enemy) return;

            const choiceDiv = document.createElement('div');
            choiceDiv.className = 'enemy-choice';
            choiceDiv.dataset.enemyId = enemyId;

            const svgPath = enemy.svg || '/static/svg/enemy-placeholder.svg';
            choiceDiv.innerHTML = `
                <div class="enemy-choice-silhouette">
                    <img src="${svgPath}" alt="${enemy.name}">
                </div>
                <div class="enemy-choice-name">${enemy.name}</div>
                <div class="enemy-choice-hp">HP: ${enemy.hp}</div>
                <div class="enemy-choice-gimmick">${enemy.gimmick}</div>
            `;

            choiceDiv.addEventListener('click', () => this.selectEnemy(enemyId));

            container.appendChild(choiceDiv);
        });
    },

    updateCardPlayability() {
        const cardElements = this.elements.handCards.querySelectorAll('.game-card');
        cardElements.forEach((cardEl, index) => {
            const card = this.hand[index];
            if (card) {
                // Check knockout state first
                const protagonistState = this.combatState[card.owner];
                if (protagonistState && protagonistState.knockedOut) {
                    cardEl.classList.add('ko-unplayable');
                    cardEl.classList.remove('unplayable');
                    return;
                }
                cardEl.classList.remove('ko-unplayable');

                if (this.canPlayCard(card)) {
                    cardEl.classList.remove('unplayable');
                } else {
                    cardEl.classList.add('unplayable');
                }
            }
        });
    }
});
