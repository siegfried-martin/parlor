/**
 * Curtain Call — Overlays, Menus & Keyword Explanations
 *
 * Card zoom system, keyword explanation bubbles, rewards screen,
 * deck list & card removal, title screen, character select,
 * performance start, and curtain transitions.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    // === Card Zoom System ===

    _extractCardKeywords(card) {
        const found = new Set();
        // Effect types that are themselves glossary keywords
        const directKeywords = new Set([
            'block', 'shield', 'taunt', 'distract', 'retaliate',
            'inspire', 'piercing', 'focus', 'luck', 'ward',
            'fortify', 'flourish', 'regenerate'
        ]);

        for (const effect of card.effects) {
            if (directKeywords.has(effect.type)) {
                found.add(effect.type);
            }
            // inflict/selfInflict carry a keyword field (e.g. burn, poison)
            if ((effect.type === 'inflict' || effect.type === 'selfInflict') && effect.keyword) {
                found.add(effect.keyword);
            }
            // fromOvation / convertOvation reference ovation + target keyword
            if (effect.type === 'fromOvation' || effect.type === 'convertOvation') {
                found.add('ovation');
                if (effect.keyword) found.add(effect.keyword);
                if (effect.to) found.add(effect.to);
            }
            // damageFromOvation / inflictFromOvation reference ovation
            if (effect.type === 'damageFromOvation' || effect.type === 'inflictFromOvation') {
                found.add('ovation');
                if (effect.keyword) found.add(effect.keyword);
            }
            // cleanseBurnPoison
            if (effect.type === 'cleanseBurnPoison') {
                found.add('burn');
                found.add('poison');
            }
            // M4 debuff-scaling effects
            if (effect.type === 'distractPerDebuffType') found.add('distract');
            if (effect.type === 'luckPerDebuffType') found.add('luck');
            if (effect.type === 'shieldFromLuck') { found.add('shield'); found.add('luck'); }
            if (effect.type === 'luckyBreak') found.add('luck');
            if (effect.type === 'allInLuck') found.add('luck');
            if (effect.type === 'ovationFromTaunt') { found.add('ovation'); found.add('taunt'); }
            if (effect.type === 'shieldFromTaunt') { found.add('shield'); found.add('taunt'); }
            if (effect.type === 'convertBlockToOvation') { found.add('block'); found.add('ovation'); }
            if (effect.type === 'retaliateFromFortify') { found.add('retaliate'); found.add('fortify'); }
        }

        // Only return keywords that exist in the glossary
        return [...found].filter(k => KEYWORD_GLOSSARY[k]);
    },

    showCardZoom(cardIndex) {
        const card = this.hand[cardIndex];
        if (!card) return;

        this.zoomedCard = cardIndex;

        // Create zoom overlay
        const overlay = document.createElement('div');
        overlay.className = 'card-zoom-overlay';

        // Create enlarged card using the same structure as createCardElement
        const zoomedCardDiv = this.createZoomedCardElement(card);

        overlay.appendChild(zoomedCardDiv);
        document.body.appendChild(overlay);

        this.zoomedCardElement = overlay;

        // Extract and show keyword explanations from card effects
        const keywords = this._extractCardKeywords(card);
        if (keywords.length > 0) {
            this.showKeywordExplanations(keywords);
        }
    },

    hideCardZoom() {
        if (this.zoomedCardElement) {
            this.zoomedCardElement.remove();
            this.zoomedCardElement = null;
        }
        this.zoomedCard = null;

        // Clear explanation bubbles and pagination
        this.clearKeywordExplanations();
    },

    // === Keyword Explanation System ===

    showKeywordExplanations(keywords) {
        this.clearExplanationBubbles();

        const audienceMembers = this.getRandomAudienceMembers(1);
        if (audienceMembers.length === 0) return;

        // Build a single bubble with all keywords listed
        const lines = keywords.map(keyword => {
            const entry = KEYWORD_GLOSSARY[keyword];
            if (!entry) return null;
            return `${entry.icon} ${entry.name}: ${entry.explanation}`;
        }).filter(Boolean);

        if (lines.length === 0) return;

        const bubble = document.createElement('div');
        bubble.className = 'audience-bubble keyword-list-bubble';

        lines.forEach((line, i) => {
            const row = document.createElement('div');
            row.className = 'keyword-row';
            row.textContent = line;
            bubble.appendChild(row);
        });

        // Position above the audience member
        const member = audienceMembers[0];
        const memberRect = member.getBoundingClientRect();
        const containerRect = this.elements.container.getBoundingClientRect();

        const rawLeft = memberRect.left - containerRect.left + memberRect.width / 2;
        const minLeft = 130;
        const maxLeft = containerRect.width - 130;
        const clampedLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));

        bubble.style.left = `${clampedLeft}px`;
        bubble.style.bottom = `${containerRect.bottom - memberRect.top + 10}px`;

        this.elements.container.appendChild(bubble);
        this.explanationBubbles.push(bubble);

        requestAnimationFrame(() => {
            bubble.classList.add('visible');
        });
    },

    clearExplanationBubbles() {
        this.explanationBubbles.forEach(bubble => bubble.remove());
        this.explanationBubbles = [];
    },

    clearKeywordExplanations() {
        this.clearExplanationBubbles();
    },

    getRandomAudienceMembers(count) {
        if (!this.audienceMembers || this.audienceMembers.length === 0) return [];

        const shuffled = [...this.audienceMembers].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    },

    showAudienceBubble(text, audienceMember, delay) {
        if (delay === undefined) delay = 0;
        setTimeout(() => {
            const bubble = document.createElement('div');
            bubble.className = 'audience-bubble';
            bubble.textContent = text;

            // Position above the audience member
            const memberRect = audienceMember.getBoundingClientRect();
            const containerRect = this.elements.container.getBoundingClientRect();

            // Calculate left position, clamping to stay within container
            const rawLeft = memberRect.left - containerRect.left + memberRect.width / 2;
            const minLeft = 110; // Half of max-width + some padding
            const maxLeft = containerRect.width - 110;
            const clampedLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));

            bubble.style.left = `${clampedLeft}px`;
            bubble.style.bottom = `${containerRect.bottom - memberRect.top + 10}px`;

            this.elements.container.appendChild(bubble);
            this.explanationBubbles.push(bubble);

            // Animate in
            requestAnimationFrame(() => {
                bubble.classList.add('visible');
            });
        }, delay);
    },

    showAudienceExplanation(keywordKey) {
        const glossaryEntry = KEYWORD_GLOSSARY[keywordKey];
        if (!glossaryEntry) return;

        // Get a random audience member
        const audienceMembers = this.getRandomAudienceMembers(1);
        if (audienceMembers.length === 0) return;

        // Clear any existing explanation bubbles
        this.clearExplanationBubbles();

        const bubbleText = `${glossaryEntry.icon} ${glossaryEntry.name}: ${glossaryEntry.explanation}`;
        this.showAudienceBubble(bubbleText, audienceMembers[0]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            this.clearExplanationBubbles();
        }, 4000);
    },

    showEnemyPassiveExplanation(enemy) {
        const audienceMembers = this.getRandomAudienceMembers(1);
        if (audienceMembers.length === 0) return;

        this.clearExplanationBubbles();

        const passiveTexts = enemy.passives.map(p => `${p.name}: ${p.description}`);
        const bubbleText = `${enemy.name} \u2014 ${passiveTexts.join('. ')}`;
        this.showAudienceBubble(bubbleText, audienceMembers[0]);

        setTimeout(() => {
            this.clearExplanationBubbles();
        }, 5000);
    },

    // === Card Rewards System ===

    /**
     * Show reward screen.
     * @param {'normal'|'boss'} type
     *   - 'normal': choice of 2 uncommon (1 Aldric, 1 Pip)
     *   - 'boss': choice of 2 uncommon + 1 rare (1 Aldric uncommon, 1 Pip uncommon, 1 rare from either)
     */
    showRewardsScreen(type) {
        if (!type) type = 'normal';
        this._rewardType = type;
        this._rewardRefreshesLeft = 1;
        this._rewardSeenIds = new Set();

        // Boss reward starts the 3-phase boss reward flow
        if (type === 'boss') {
            this._bossRewardPhase = 'card';
        } else {
            this._bossRewardPhase = null;
        }

        this._generateRewardOptions(type);

        this.selectedRewardIndex = null;

        // Render reward cards
        this.renderRewardCards();

        // Show overlay
        if (this.elements.rewardsOverlay) {
            this.elements.rewardsOverlay.style.display = 'flex';
        }

        // Reset button state
        if (this.elements.confirmRewardBtn) {
            this.elements.confirmRewardBtn.disabled = true;
        }

        // Reset refresh button
        if (this.elements.refreshRewardBtn) {
            this.elements.refreshRewardBtn.disabled = false;
            this.elements.refreshRewardBtn.textContent = 'Refresh (1)';
        }
    },

    _generateRewardOptions(type) {
        if (type === 'boss') {
            const rarePool = Math.random() < 0.5 ? 'aldric' : 'pip';
            this.rewardOptions = [
                this._getUniqueRewardCard('aldric', 'uncommon'),
                this._getUniqueRewardCard('pip', 'uncommon'),
                this._getUniqueRewardCard(rarePool, 'rare')
            ];
        } else {
            const bonusPool = Math.random() < 0.5 ? 'aldric' : 'pip';
            this.rewardOptions = [
                this._getUniqueRewardCard('aldric', 'uncommon'),
                this._getUniqueRewardCard('pip', 'uncommon'),
                this._getUniqueRewardCard(bonusPool, 'uncommon')
            ];
        }

        // Track seen IDs
        for (const card of this.rewardOptions) {
            if (card) this._rewardSeenIds.add(card.id);
        }
    },

    _getUniqueRewardCard(pool, rarity) {
        const ids = CARD_POOLS_BY_RARITY[pool]?.[rarity];
        if (!ids || ids.length === 0) return null;

        // Filter out already-seen cards
        const available = ids.filter(id => !this._rewardSeenIds?.has(id));
        const source = available.length > 0 ? available : ids;

        const randomId = source[Math.floor(Math.random() * source.length)];
        return { ...CARD_DEFINITIONS[randomId] };
    },

    refreshRewards() {
        if (this._rewardRefreshesLeft <= 0) return;

        this._rewardRefreshesLeft--;

        // Clear selection
        this.selectedRewardIndex = null;
        this.clearExplanationBubbles();
        if (this.elements.confirmRewardBtn) {
            this.elements.confirmRewardBtn.disabled = true;
        }

        // Animate cards out, generate new, animate in
        const container = this.elements.rewardsCards;
        if (container) {
            container.classList.add('refreshing');
            setTimeout(() => {
                this._generateRewardOptions(this._rewardType);
                this.renderRewardCards();
                container.classList.remove('refreshing');
                container.classList.add('refresh-enter');
                setTimeout(() => {
                    container.classList.remove('refresh-enter');
                }, 400);
            }, 300);
        }

        // Update refresh button
        if (this.elements.refreshRewardBtn) {
            if (this._rewardRefreshesLeft <= 0) {
                this.elements.refreshRewardBtn.disabled = true;
                this.elements.refreshRewardBtn.textContent = 'Refresh (0)';
            } else {
                this.elements.refreshRewardBtn.textContent = `Refresh (${this._rewardRefreshesLeft})`;
            }
        }
    },

    getRandomCardByRarity(pool, rarity) {
        const ids = CARD_POOLS_BY_RARITY[pool]?.[rarity];
        if (!ids || ids.length === 0) return null;
        const randomId = ids[Math.floor(Math.random() * ids.length)];
        return { ...CARD_DEFINITIONS[randomId] };
    },

    getRandomCardFromPool(pool) {
        const cardIds = CARD_POOLS[pool];
        if (!cardIds || cardIds.length === 0) return null;
        const randomId = cardIds[Math.floor(Math.random() * cardIds.length)];
        return { ...CARD_DEFINITIONS[randomId] };
    },

    selectReward(index) {
        this.selectedRewardIndex = index;

        // Update visual selection
        const cards = this.elements.rewardsCards.querySelectorAll('.reward-card');
        cards.forEach((card, i) => {
            if (i === index) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Enable confirm button
        if (this.elements.confirmRewardBtn) {
            this.elements.confirmRewardBtn.disabled = false;
        }

        // Show keyword explanations via audience
        const selectedCard = this.rewardOptions[index];
        if (selectedCard) {
            const keywords = this._extractCardKeywords(selectedCard);
            if (keywords.length > 0) {
                this.showKeywordExplanations(keywords);
            } else {
                this.clearExplanationBubbles();
            }
        }
    },

    confirmReward() {
        if (this.selectedRewardIndex === null) return;

        const selectedCard = this.rewardOptions[this.selectedRewardIndex];
        if (selectedCard) {
            // Add card to deck (discard pile so it shuffles in next combat)
            const newCard = {
                ...selectedCard,
                instanceId: `${selectedCard.id}-reward-${Date.now()}`
            };
            this.discardPile.push(newCard);
            console.log(`Added ${selectedCard.name} to deck`);
        }

        this.hideRewardsScreen();
    },

    skipReward() {
        console.log('Skipped card reward');
        this.hideRewardsScreen();
    },

    hideRewardsScreen() {
        this.clearExplanationBubbles();

        if (this.elements.rewardsOverlay) {
            this.elements.rewardsOverlay.style.display = 'none';
        }

        // Reset state
        this.rewardOptions = [];
        this.selectedRewardIndex = null;

        // Opening reward goes to scene select; combat rewards advance the scene
        if (this._openingReward) {
            this._openingReward = false;
            this.showSceneSelection();
        } else if (this._bossRewardPhase === 'card') {
            // Boss reward phase 2: card removal
            this._bossRewardPhase = 'removal';
            this._removalFromBoss = true;
            this.showDeckList('remove');
        } else {
            this.advanceScene();
        }
    },

    // === Deck List & Card Removal ===

    /**
     * Show the deck list overlay.
     * @param {'view'|'remove'} mode - 'view' for read-only, 'remove' for card removal
     */
    showDeckList(mode) {
        if (!mode) mode = 'view';
        this._deckListMode = mode;
        this._removalSelectedIndex = null;

        // Build full deck (draw + discard + hand)
        const allCards = [];
        this.deck.forEach((card, i) => allCards.push({ card, location: 'draw', originalIndex: i }));
        this.discardPile.forEach((card, i) => allCards.push({ card, location: 'discard', originalIndex: i }));
        this.hand.forEach((card, i) => allCards.push({ card, location: 'hand', originalIndex: i }));

        // Sort by owner, then by name
        const ownerOrder = { aldric: 0, pip: 1, macguffin: 2 };
        allCards.sort((a, b) => {
            const oa = ownerOrder[a.card.owner] ?? 3;
            const ob = ownerOrder[b.card.owner] ?? 3;
            if (oa !== ob) return oa - ob;
            return a.card.name.localeCompare(b.card.name);
        });

        this._deckListAllCards = allCards;

        // Render
        const container = this.elements.deckListCards;
        if (!container) return;
        container.innerHTML = '';

        const title = this.elements.deckListTitle;
        if (title) {
            title.textContent = mode === 'remove' ? 'Remove a Card' : 'Your Deck';
        }

        let currentOwner = null;

        allCards.forEach((entry, idx) => {
            const { card, location } = entry;

            // Group header
            if (card.owner !== currentOwner) {
                currentOwner = card.owner;
                const group = document.createElement('div');
                group.className = 'deck-list-group';
                const ownerNames = { aldric: 'Aldric', pip: 'Pip', macguffin: 'MacGuffin' };
                group.textContent = ownerNames[card.owner] || card.owner;
                container.appendChild(group);
            }

            const row = document.createElement('div');
            row.className = 'deck-list-entry';
            row.dataset.deckIndex = idx;

            if (mode === 'remove') {
                row.classList.add('removable');
            }

            // Energy cost blips
            const costDiv = document.createElement('div');
            costDiv.className = 'deck-list-entry-cost';
            for (let i = 0; i < card.cost; i++) {
                const blip = document.createElement('div');
                blip.className = `energy-blip energy-blip--${card.owner}`;
                costDiv.appendChild(blip);
            }
            row.appendChild(costDiv);

            // Card info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'deck-list-entry-info';

            const nameSpan = document.createElement('div');
            nameSpan.className = 'deck-list-entry-name';
            nameSpan.textContent = card.name;
            infoDiv.appendChild(nameSpan);

            const descSpan = document.createElement('div');
            descSpan.className = 'deck-list-entry-desc';
            descSpan.textContent = card.description;
            infoDiv.appendChild(descSpan);

            row.appendChild(infoDiv);

            // Owner badge
            const ownerBadge = document.createElement('div');
            ownerBadge.className = `deck-list-entry-owner owner-${card.owner}`;
            const ownerInitials = { aldric: 'A', pip: 'P', macguffin: 'M' };
            ownerBadge.textContent = ownerInitials[card.owner] || '?';
            row.appendChild(ownerBadge);

            // Location indicator (view mode only)
            if (mode === 'view') {
                const locSpan = document.createElement('div');
                locSpan.className = 'deck-list-entry-location';
                const locLabels = { draw: 'Draw', discard: 'Discard', hand: 'Hand' };
                locSpan.textContent = locLabels[location] || location;
                row.appendChild(locSpan);
            }

            // Click handler for removal mode
            if (mode === 'remove') {
                row.addEventListener('click', () => {
                    this.selectCardForRemoval(idx);
                });
            }

            container.appendChild(row);
        });

        // Footer
        const footer = this.elements.deckListFooter;
        if (footer) {
            footer.innerHTML = '';
            const totalCards = allCards.length;

            if (mode === 'remove') {
                const confirmBtn = document.createElement('button');
                confirmBtn.className = 'rewards-btn confirm-btn';
                confirmBtn.id = 'confirm-removal-btn';
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Remove Selected';
                confirmBtn.addEventListener('click', () => this.confirmCardRemoval());
                footer.appendChild(confirmBtn);

                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'rewards-btn skip-btn';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.addEventListener('click', () => this.hideDeckList());
                footer.appendChild(cancelBtn);

                const countSpan = document.createElement('div');
                countSpan.className = 'deck-list-count';
                countSpan.textContent = `${totalCards} cards in deck`;
                footer.appendChild(countSpan);
            } else {
                const countSpan = document.createElement('div');
                countSpan.className = 'deck-list-count';
                countSpan.textContent = `${totalCards} cards in deck`;
                footer.appendChild(countSpan);
            }
        }

        // Show overlay
        if (this.elements.deckListOverlay) {
            this.elements.deckListOverlay.style.display = 'flex';
        }
    },

    hideDeckList() {
        if (this.elements.deckListOverlay) {
            this.elements.deckListOverlay.style.display = 'none';
        }
        this._deckListMode = null;
        this._removalSelectedIndex = null;
        this._deckListAllCards = null;
    },

    selectCardForRemoval(idx) {
        if (this._deckListMode !== 'remove') return;

        // Toggle selection
        if (this._removalSelectedIndex === idx) {
            this._removalSelectedIndex = null;
        } else {
            this._removalSelectedIndex = idx;
        }

        // Update visual selection
        const entries = this.elements.deckListCards.querySelectorAll('.deck-list-entry');
        entries.forEach((entry, i) => {
            if (parseInt(entry.dataset.deckIndex, 10) === this._removalSelectedIndex) {
                entry.classList.add('removal-selected');
            } else {
                entry.classList.remove('removal-selected');
            }
        });

        // Enable/disable confirm button
        const confirmBtn = document.getElementById('confirm-removal-btn');
        if (confirmBtn) {
            confirmBtn.disabled = (this._removalSelectedIndex === null);
        }
    },

    confirmCardRemoval() {
        if (this._removalSelectedIndex === null || !this._deckListAllCards) return;

        // Check minimum deck size (5)
        const totalCards = this.deck.length + this.discardPile.length + this.hand.length;
        if (totalCards <= 5) {
            console.log('Cannot remove: deck at minimum size (5)');
            return;
        }

        const entry = this._deckListAllCards[this._removalSelectedIndex];
        if (!entry) return;

        const { card, location, originalIndex } = entry;

        // Remove from the appropriate pile
        switch (location) {
            case 'draw':
                this.deck.splice(originalIndex, 1);
                break;
            case 'discard':
                this.discardPile.splice(originalIndex, 1);
                break;
            case 'hand':
                this.hand.splice(originalIndex, 1);
                this.renderHand();
                break;
        }

        console.log(`Removed ${card.name} from deck (was in ${location})`);

        this.renderDeckCount();
        this.hideDeckList();

        // If triggered from rewards, proceed to hide rewards and advance
        if (this._removalFromRewards) {
            this._removalFromRewards = false;
            this.hideRewardsScreen();
        } else if (this._removalFromBoss) {
            this._removalFromBoss = false;
            // Boss reward phase 3: stage prop selection
            this.showStagePropSelection(() => {
                this.advanceScene();
            });
        }
    },

    showDeckListForRemoval() {
        this._removalFromRewards = true;
        // Hide rewards overlay temporarily
        if (this.elements.rewardsOverlay) {
            this.elements.rewardsOverlay.style.display = 'none';
        }
        this.showDeckList('remove');
    },

    // === Title & Character Select ===

    showTitleScreen() {
        this.runState.phase = 'menu';

        if (this.elements.titleScreen) {
            this.elements.titleScreen.style.display = 'flex';
        }
        if (this.elements.characterSelect) {
            this.elements.characterSelect.style.display = 'none';
        }

        // Show/hide continue button based on saved run data
        if (this.elements.continuePerformanceBtn) {
            if (this._savedRunData) {
                this.elements.continuePerformanceBtn.style.display = '';
                this.elements.continuePerformanceBtn.onclick = () => this.continuePerformance();
            } else {
                this.elements.continuePerformanceBtn.style.display = 'none';
            }
        }

        // Bind "New Performance" — abandon existing run first if present
        if (this.elements.newPerformanceBtn) {
            this.elements.newPerformanceBtn.onclick = () => {
                if (this._savedRunData) {
                    this.abandonRun();
                    this._savedRunData = null;
                }
                this.showCharacterSelect();
            };
        }
    },

    continuePerformance() {
        if (!this._savedRunData) return;

        // Hide title screen
        if (this.elements.titleScreen) {
            this.elements.titleScreen.style.display = 'none';
        }

        // Restore state from payload
        this.restoreFromPayload(this._savedRunData);
        this._savedRunData = null;

        // Show game UI behind closed curtains
        this.elements.container.classList.remove('game-ui-hidden');

        // Initialize animations and voice lines
        this.initializeAnimations();
        this.initVoiceLines();

        // Update progress indicator and combat state display
        this.updateProgressIndicator();
        this.renderCombatState();
        this.renderStageProps();

        // Go to scene selection
        this.showSceneSelection();
    },

    showCharacterSelect() {
        this.runState.phase = 'character-select';

        if (this.elements.titleScreen) {
            this.elements.titleScreen.style.display = 'none';
        }
        if (this.elements.characterSelect) {
            this.elements.characterSelect.style.display = 'flex';
        }

        // Bind basic card selection (radio-style per protagonist)
        const attackOptions = document.querySelectorAll('.cs-attack-option');
        attackOptions.forEach(option => {
            option.onclick = () => {
                const protagonist = option.closest('.cs-card')?.dataset.protagonist;
                if (!protagonist) return;

                // Deselect siblings
                const siblings = option.parentNode.querySelectorAll('.cs-attack-option');
                siblings.forEach(s => s.classList.remove('selected'));
                option.classList.add('selected');
            };
        });

        // Bind button
        if (this.elements.raiseCurtainBtn) {
            this.elements.raiseCurtainBtn.onclick = () => this.startPerformance();
        }
    },

    startPerformance() {
        // Read selected basic cards
        const aldricOption = document.querySelector('.cs-card[data-protagonist="aldric"] .cs-attack-option.selected');
        const pipOption = document.querySelector('.cs-card[data-protagonist="pip"] .cs-attack-option.selected');

        this.selectedAldricBasic = aldricOption?.dataset.card || 'galvanize';
        this.selectedPipBasic = pipOption?.dataset.card || 'quick-jab';

        console.log(`Starting deck: ${this.selectedAldricBasic} + ${this.selectedPipBasic}`);

        // Start new persistence run
        this.startNewRun();

        // Rebuild deck with selections
        this.initializeDeck();

        // Reset run state to Act 1 scene 0
        this.runState = {
            currentAct: 1,
            currentScene: 0,
            phase: 'scene-select'
        };

        // Hide character select
        if (this.elements.characterSelect) {
            this.elements.characterSelect.style.display = 'none';
        }

        // Show game UI behind closed curtains
        this.elements.container.classList.remove('game-ui-hidden');

        // Keep curtain-closed (don't open yet) - scene selection appears on top
        // Initialize animations and voice lines now that the game is starting
        this.initializeAnimations();
        this.initVoiceLines();

        // Update progress indicator for Act 1
        this.updateProgressIndicator();

        // Show opening reward (choice of 2 uncommon) before first battle
        this._openingReward = true;
        this.showRewardsScreen('normal');
    },

    // === Curtain Transitions ===

    /**
     * Reusable curtain close/open transition.
     * Closes curtains, executes callback, then opens curtains.
     * @param {Function} callback - Called while curtains are closed
     */
    curtainTransition(callback) {
        this.isAnimating = true;

        // Close curtains
        this.elements.container.classList.add('curtain-closing');

        setTimeout(() => {
            // Curtains now closed
            this.elements.container.classList.remove('curtain-closing');
            this.elements.container.classList.add('curtain-closed');

            // Execute the content swap
            if (callback) callback();

            // Brief pause while closed
            setTimeout(() => {
                // Open curtains
                this.elements.container.classList.remove('curtain-closed');
                this.elements.container.classList.add('curtain-opening');

                setTimeout(() => {
                    this.elements.container.classList.remove('curtain-opening');
                    this.isAnimating = false;
                }, 1300);
            }, 400);
        }, 1300);
    },

    /**
     * Close curtains and execute callback. Does NOT auto-open.
     * @param {Function} callback - Called after curtains are closed
     */
    curtainClose(callback) {
        this.isAnimating = true;

        this.elements.container.classList.add('curtain-closing');

        setTimeout(() => {
            this.elements.container.classList.remove('curtain-closing');
            this.elements.container.classList.add('curtain-closed');
            this.isAnimating = false;

            if (callback) callback();
        }, 1300);
    },

    /**
     * Open curtains from closed state and execute callback when done.
     * @param {Function} callback - Called after curtains finish opening
     */
    curtainOpen(callback) {
        this.isAnimating = true;

        this.elements.container.classList.remove('curtain-closed');
        this.elements.container.classList.add('curtain-opening');

        setTimeout(() => {
            this.elements.container.classList.remove('curtain-opening');
            this.isAnimating = false;

            if (callback) callback();
        }, 1300);
    }
});
