/**
 * Curtain Call — UI & Scene Flow
 *
 * Event binding, menus, scene selection, curtain transitions,
 * rewards screen, starting deck selection, 3-act progression,
 * and card zoom/keyword explanations.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    // === Event Binding ===

    bindEvents() {
        // End turn button
        if (this.elements.endTurnBtn) {
            this.elements.endTurnBtn.addEventListener('click', () => {
                this.onEndTurn();
            });
        }

        // Card drag-to-play and tap-to-zoom (using Pointer Events + event delegation)
        if (this.elements.handCards) {
            this._dragState = null;
            this._dragThreshold = 8; // px to distinguish tap from drag

            this.elements.handCards.addEventListener('pointerdown', (e) => {
                const cardEl = e.target.closest('.game-card');
                if (!cardEl || this.phase !== 'player') return;
                if (this.zoomedCard !== null) { this.hideCardZoom(); return; }

                const index = parseInt(cardEl.dataset.index, 10);
                cardEl.setPointerCapture(e.pointerId);

                // Pause any pending reflow while dragging
                if (this._reflowTimer) {
                    clearTimeout(this._reflowTimer);
                    this._reflowTimer = null;
                    this._reflowPaused = true;
                }

                this._dragState = {
                    pointerId: e.pointerId,
                    index: index,
                    cardEl: cardEl,
                    startX: e.clientX,
                    startY: e.clientY,
                    dragging: false,
                    ghost: null
                };
            });

            this.elements.handCards.addEventListener('pointermove', (e) => {
                const ds = this._dragState;
                if (!ds || ds.pointerId !== e.pointerId) return;

                const dx = e.clientX - ds.startX;
                const dy = e.clientY - ds.startY;

                if (!ds.dragging) {
                    // Check threshold
                    if (Math.abs(dx) < this._dragThreshold && Math.abs(dy) < this._dragThreshold) return;
                    // Enter drag mode
                    ds.dragging = true;
                    this._startDrag(ds, e);
                }

                // Move ghost
                if (ds.ghost) {
                    ds.ghost.style.left = (e.clientX - ds.ghostOffsetX) + 'px';
                    ds.ghost.style.top = (e.clientY - ds.ghostOffsetY) + 'px';
                }

                // Hit-test drop zones
                this._updateDropTarget(e.clientX, e.clientY, ds);
            });

            this.elements.handCards.addEventListener('pointerup', (e) => {
                const ds = this._dragState;
                if (!ds || ds.pointerId !== e.pointerId) return;

                if (!ds.dragging) {
                    // It was a tap — show card zoom
                    this._dragState = null;
                    this._resumeReflow();
                    this._zoomJustOpened = true;
                    this.showCardZoom(ds.index);
                    requestAnimationFrame(() => { this._zoomJustOpened = false; });
                    return;
                }

                // Check for valid drop
                const drop = this._getDropTarget(e.clientX, e.clientY);
                const card = this.hand[ds.index];
                const targeting = card?.targeting || 'none';

                if (drop && this._isValidDrop(targeting, drop) && this.canPlayCard(card)) {
                    this._cleanupDrag(ds);
                    this._reflowPaused = false;
                    this.playCard(ds.index, drop.target);
                } else {
                    this._cancelDrag(ds);
                    this._resumeReflow();
                }

                this._dragState = null;
            });

            this.elements.handCards.addEventListener('pointercancel', (e) => {
                const ds = this._dragState;
                if (!ds || ds.pointerId !== e.pointerId) return;
                this._cancelDrag(ds);
                this._dragState = null;
                this._resumeReflow();
            });
        }

        // Dismiss card zoom on click/tap anywhere
        document.addEventListener('click', (e) => {
            if (this.zoomedCard !== null && !this._zoomJustOpened) {
                this.hideCardZoom();
            }
        });

        // Puppet tap handling
        const puppets = [
            this.elements.enemyPuppet,
            this.elements.heroAldric,
            this.elements.heroPip,
            this.elements.macguffin
        ];

        puppets.forEach(puppet => {
            if (puppet) {
                puppet.addEventListener('click', () => {
                    this.onPuppetTap(puppet);
                });
            }
        });

        // Status icon / keyword tap handling (event delegation)
        document.addEventListener('click', (e) => {
            // Status icons (buffs, debuffs, block, shield, taunt)
            const statusIcon = e.target.closest('.status-icon');
            if (statusIcon) {
                const title = statusIcon.getAttribute('title');
                if (title) {
                    const keywordKey = this.titleToKeywordKey(title);
                    if (keywordKey && KEYWORD_GLOSSARY[keywordKey]) {
                        this.showAudienceExplanation(keywordKey);
                        return;
                    }
                }
            }

            // Ovation meter
            if (e.target.closest('#ovation-meter')) {
                if (KEYWORD_GLOSSARY.ovation) {
                    this.showAudienceExplanation('ovation');
                    return;
                }
            }

            // Enemy puppet — explain passive
            if (e.target.closest('#enemy-puppet') && !e.target.closest('.status-icon')) {
                const enemy = this.combatState.enemy;
                if (enemy?.passives?.length > 0) {
                    this.showEnemyPassiveExplanation(enemy);
                    return;
                }
            }
        });

        // Rewards screen buttons
        if (this.elements.confirmRewardBtn) {
            this.elements.confirmRewardBtn.addEventListener('click', () => {
                this.confirmReward();
            });
        }
        if (this.elements.skipRewardBtn) {
            this.elements.skipRewardBtn.addEventListener('click', () => {
                this.skipReward();
            });
        }
        // Reward card selection (event delegation)
        if (this.elements.rewardsCards) {
            this.elements.rewardsCards.addEventListener('click', (e) => {
                const card = e.target.closest('.reward-card');
                if (card) {
                    const index = parseInt(card.dataset.index, 10);
                    this.selectReward(index);
                }
            });
        }
    },

    // Convert status title to keyword key (v2)
    titleToKeywordKey(title) {
        const mapping = {
            'Block': 'block',
            'Distract': 'distract',
            'Taunt': 'taunt',
            'Shield': 'shield',
            'Regenerate': 'regenerate',
            'Retaliate': 'retaliate',
            'Inspire': 'inspire',
            'Fortify': 'fortify',
            'Piercing': 'piercing',
            'Accuracy': 'accuracy',
            'Ward': 'ward',
            'Luck': 'luck',
            'Flourish': 'flourish',
            'Ovation': 'ovation',
            'Poison': 'poison',
            'Burn': 'burn',
            'Stage Fright': 'stageFright',
            'Heckled': 'heckled',
            'Forgetful': 'forgetful',
            'Vulnerable': 'vulnerable',
            'Weak': 'weak',
            'Confused': 'confused',
            'Curse': 'curse',
            'Fear': 'fear',
            'Frustration': 'frustration'
        };
        return mapping[title] || null;
    },

    onEndTurn() {
        if (this.phase !== 'player' || this.isAnimating) return;
        this.endTurn();
    },

    // === Drag-to-Play System ===

    _startDrag(ds, e) {
        const card = this.hand[ds.index];
        if (!card) return;

        // Create ghost clone
        const ghost = ds.cardEl.cloneNode(true);
        ghost.className = ds.cardEl.className + ' card-ghost';
        ghost.classList.remove('unplayable', 'ko-unplayable');

        const rect = ds.cardEl.getBoundingClientRect();
        ds.ghostOffsetX = e.clientX - rect.left;
        ds.ghostOffsetY = e.clientY - rect.top;

        ghost.style.width = rect.width + 'px';
        ghost.style.height = rect.height + 'px';
        ghost.style.left = (e.clientX - ds.ghostOffsetX) + 'px';
        ghost.style.top = (e.clientY - ds.ghostOffsetY) + 'px';

        document.body.appendChild(ghost);
        ds.ghost = ghost;

        // Dim original
        ds.cardEl.classList.add('dragging-source');

        // Highlight valid drop zones
        this._highlightDropZones(card);
    },

    _getDropTarget(x, y) {
        const el = document.elementFromPoint(x, y);
        if (!el) return null;

        if (el.closest('#hero-aldric')) return { zone: 'protagonist', target: 'aldric' };
        if (el.closest('#hero-pip'))    return { zone: 'protagonist', target: 'pip' };
        if (el.closest('#macguffin'))   return { zone: 'ally', target: 'macguffin' };
        if (el.closest('.enemy-area'))  return { zone: 'play', target: null };
        if (el.closest('.stage-area'))  return { zone: 'play', target: null };

        return null;
    },

    _isValidDrop(targeting, drop) {
        if (!drop) return false;
        switch (targeting) {
            case 'none':
                return true; // Any drop zone is valid for untargeted cards
            case 'protagonist':
                return drop.zone === 'protagonist';
            case 'ally':
                return drop.zone === 'protagonist' || drop.zone === 'ally';
            default:
                return true;
        }
    },

    _updateDropTarget(x, y, ds) {
        const card = this.hand[ds.index];
        const targeting = card?.targeting || 'none';
        if (targeting === 'none') return; // No hover highlights for untargeted cards

        const drop = this._getDropTarget(x, y);
        const valid = drop && this._isValidDrop(targeting, drop) && this.canPlayCard(card);

        // Clear previous active highlights
        document.querySelectorAll('.drop-target-active').forEach(el => {
            el.classList.remove('drop-target-active');
        });

        if (valid && drop) {
            // Highlight the specific target element
            let targetEl = null;
            if (drop.target === 'aldric') targetEl = this.elements.heroAldric;
            else if (drop.target === 'pip') targetEl = this.elements.heroPip;
            else if (drop.target === 'macguffin') targetEl = this.elements.macguffin;

            if (targetEl) targetEl.classList.add('drop-target-active');
        }
    },

    _highlightDropZones(card) {
        const targeting = card.targeting || 'none';
        if (targeting === 'none') return; // No highlights for untargeted cards

        const zones = [];

        switch (targeting) {
            case 'protagonist':
                zones.push(this.elements.heroAldric, this.elements.heroPip);
                break;
            case 'ally':
                zones.push(this.elements.heroAldric, this.elements.heroPip, this.elements.macguffin);
                break;
        }

        zones.forEach(el => { if (el) el.classList.add('drop-zone-valid'); });
    },

    _clearDropZoneHighlights() {
        document.querySelectorAll('.drop-zone-valid, .drop-target-active').forEach(el => {
            el.classList.remove('drop-zone-valid', 'drop-target-active');
        });
    },

    _cleanupDrag(ds) {
        if (ds.ghost) ds.ghost.remove();
        ds.cardEl.classList.remove('dragging-source');
        this._clearDropZoneHighlights();
    },

    _cancelDrag(ds) {
        if (ds.ghost) {
            ds.ghost.style.transition = 'opacity 0.15s ease';
            ds.ghost.style.opacity = '0';
            setTimeout(() => ds.ghost.remove(), 150);
        }
        ds.cardEl.classList.remove('dragging-source');
        this._clearDropZoneHighlights();
    },

    _resumeReflow() {
        if (this._reflowPaused) {
            this._reflowPaused = false;
            this._debouncedReflow();
        }
    },

    // === Card Zoom System ===

    _extractCardKeywords(card) {
        const found = new Set();
        // Effect types that are themselves glossary keywords
        const directKeywords = new Set([
            'block', 'shield', 'taunt', 'distract', 'retaliate',
            'inspire', 'piercing', 'accuracy', 'luck', 'ward',
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
        const bubbleText = `${enemy.name} — ${passiveTexts.join('. ')}`;
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

        if (type === 'boss') {
            // 2 uncommon (1 per protagonist) + 1 rare (random protagonist)
            const rarePool = Math.random() < 0.5 ? 'aldric' : 'pip';
            this.rewardOptions = [
                this.getRandomCardByRarity('aldric', 'uncommon'),
                this.getRandomCardByRarity('pip', 'uncommon'),
                this.getRandomCardByRarity(rarePool, 'rare')
            ];
        } else {
            // 2 uncommon (1 per protagonist)
            this.rewardOptions = [
                this.getRandomCardByRarity('aldric', 'uncommon'),
                this.getRandomCardByRarity('pip', 'uncommon')
            ];
        }

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
        } else {
            this.advanceScene();
        }
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

        // Bind button (use onclick to avoid duplicate listeners)
        if (this.elements.newPerformanceBtn) {
            this.elements.newPerformanceBtn.onclick = () => this.showCharacterSelect();
        }
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
        // Initialize animations now that the game is starting
        this.initializeAnimations();

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
    },

    // === Scene Selection System ===

    showSceneSelection() {
        const act = this.actStructure[this.runState.currentAct];
        if (!act) return;

        // Determine which enemies to show
        let enemyIds;
        let sceneNumber;

        if (this.runState.currentScene < act.scenes.length) {
            // Regular scene
            sceneNumber = this.runState.currentScene + 1;
            enemyIds = act.scenes[this.runState.currentScene].enemies;

            if (this.elements.sceneTitle) {
                this.elements.sceneTitle.textContent = `Act ${this.runState.currentAct}: ${act.name} \u2014 Scene ${sceneNumber}`;
            }
        } else {
            // Boss scene
            this.startBossCombat();
            return;
        }

        this.runState.phase = 'scene-select';
        this.renderEnemyChoices(enemyIds);

        if (this.elements.sceneSelectOverlay) {
            this.elements.sceneSelectOverlay.style.display = 'flex';
        }
    },

    selectEnemy(enemyId) {
        const enemy = this.enemies[enemyId];
        if (!enemy) return;
        if (this.isAnimating) return;

        console.log(`Selected enemy: ${enemy.name}`);

        // Hide scene selection overlay
        if (this.elements.sceneSelectOverlay) {
            this.elements.sceneSelectOverlay.style.display = 'none';
        }

        // Set up combat behind closed curtains
        this.startCombatWithEnemy(enemyId);

        // Open curtains to reveal combat
        this.curtainOpen();
    },

    startCombatWithEnemy(enemyId) {
        const enemy = this.enemies[enemyId];
        if (!enemy) return;

        // Determine initial intent from pattern or phase 0 pattern
        let initialIntent;
        if (enemy.phases) {
            initialIntent = { ...enemy.phases[0].pattern[0] };
        } else {
            initialIntent = { ...enemy.pattern[0] };
        }
        // Sanitize intent to display-only fields
        initialIntent = {
            type: initialIntent.type,
            value: initialIntent.value,
            hits: initialIntent.hits || 1,
            target: initialIntent.target
        };

        // Set up enemy state
        this.combatState.enemy = {
            id: enemy.id,
            name: enemy.name,
            currentHP: enemy.hp,
            maxHP: enemy.hp,
            intent: initialIntent,
            patternIndex: 0,
            currentPhase: 0,
            speechBubbles: enemy.speechBubbles,
            isBoss: enemy.isBoss || false,
            passives: enemy.passives || [],
            passiveState: {}
        };

        // Reset all v2 keywords
        this.resetKeywords();

        // Reset global defensive pools
        this.combatState.block = 0;
        this.combatState.distract = 0;
        this.combatState.retaliate = 0;

        // Reset protagonist HP and defenses for new combat
        this.combatState.aldric = { currentHP: 20, maxHP: 20, knockedOut: false, shield: 0, taunt: 0 };
        this.combatState.pip = { currentHP: 10, maxHP: 10, knockedOut: false, shield: 0, taunt: 0 };
        this.elements.heroAldric.classList.remove('knocked-out');
        this.elements.heroPip.classList.remove('knocked-out');
        // Remove any lingering KO badges
        const aldricBadge = this.elements.heroAldric.querySelector('.ko-badge');
        if (aldricBadge) aldricBadge.remove();
        const pipBadge = this.elements.heroPip.querySelector('.ko-badge');
        if (pipBadge) pipBadge.remove();

        // Apply combat-start passives
        this.applyCombatStartPassives(enemy);

        this.renderCombatState();
        this.renderEnemyPassive();

        // Update UI
        this.elements.enemyPuppet.classList.remove('enemy-defeat', 'enemy-hurt');
        this.elements.enemyPuppet.classList.add('enemy-idle');

        // Update progress indicator
        this.updateProgressIndicator();

        // Start the turn
        this.runState.phase = 'combat';
        this.startTurn();
    },

    applyCombatStartPassives(enemy) {
        if (!enemy.passives) return;

        for (const passive of enemy.passives) {
            switch (passive.id) {
                case 'rusty-armor':
                    // Rusty Knight: starts with 3 Block
                    this.keywords.enemy.block = 3;
                    break;
                case 'dramatic-ego':
                    // Prima Donna: permanent Retaliate 2
                    this.keywords.enemy.retaliate = 2;
                    break;
                // Other passives are triggered during combat, not at start
            }
        }
    },

    startBossCombat() {
        const act = this.actStructure[this.runState.currentAct];
        if (!act || !act.boss) return;

        // Hide scene selection
        if (this.elements.sceneSelectOverlay) {
            this.elements.sceneSelectOverlay.style.display = 'none';
        }

        if (this.elements.sceneTitle) {
            this.elements.sceneTitle.textContent = `Act ${this.runState.currentAct}: ${act.name} \u2014 BOSS`;
        }

        this.runState.currentScene = 'boss';
        // Set up boss behind closed curtains, then open
        this.startCombatWithEnemy(act.boss);
        this.curtainOpen();
    },

    advanceScene() {
        const act = this.actStructure[this.runState.currentAct];
        if (!act) return;

        if (typeof this.runState.currentScene === 'number') {
            this.runState.currentScene++;

            // Close curtains, then show scene selection on top
            // Player picks enemy -> selectEnemy() handles opening
            this.curtainClose(() => {
                this.showSceneSelection();
            });
        } else if (this.runState.currentScene === 'boss') {
            // Boss defeated, check if there's another act
            this.onActComplete();
        }
    },

    onActComplete() {
        console.log(`Act ${this.runState.currentAct} complete!`);

        const nextAct = this.runState.currentAct + 1;
        if (this.actStructure[nextAct]) {
            // Advance to next act
            this.runState.currentAct = nextAct;
            this.runState.currentScene = 0;
            console.log(`Advancing to Act ${nextAct}`);

            // Close curtains, then show scene selection for new act
            this.curtainClose(() => {
                this.updateProgressIndicator();
                this.showSceneSelection();
            });
        } else {
            // All acts complete — game won!
            this.phase = 'gameover';
            this.runState.phase = 'victory';

            if (this.elements.endTurnBtn) {
                this.elements.endTurnBtn.textContent = 'Victory! Performance Complete!';
            }

            console.log('All acts complete! Victory!');
        }
    },

    updateProgressIndicator() {
        const indicator = this.elements.progressIndicator;
        if (!indicator) return;

        // Rebuild progress dots for current act structure (all 3 acts)
        indicator.innerHTML = '';

        for (let act = 1; act <= 3; act++) {
            const actData = this.actStructure[act];
            if (!actData) continue;

            // Add act label
            const actLabel = document.createElement('span');
            actLabel.className = 'progress-act-label';
            actLabel.textContent = act;
            indicator.appendChild(actLabel);

            // Scene dots
            for (let s = 0; s < actData.scenes.length; s++) {
                const dot = document.createElement('span');
                dot.className = 'progress-dot';
                dot.dataset.act = act;
                dot.dataset.scene = s + 1;

                if (act < this.runState.currentAct) {
                    dot.classList.add('complete');
                } else if (act === this.runState.currentAct) {
                    if (typeof this.runState.currentScene === 'number') {
                        if (s < this.runState.currentScene) {
                            dot.classList.add('complete');
                        } else if (s === this.runState.currentScene) {
                            dot.classList.add('active');
                        }
                    } else {
                        // boss — all scenes complete
                        dot.classList.add('complete');
                    }
                }

                indicator.appendChild(dot);
            }

            // Boss dot
            const bossDot = document.createElement('span');
            bossDot.className = 'progress-dot boss';
            bossDot.dataset.act = act;
            bossDot.dataset.scene = 'boss';

            if (act < this.runState.currentAct) {
                bossDot.classList.add('complete');
            } else if (act === this.runState.currentAct && this.runState.currentScene === 'boss') {
                bossDot.classList.add('active');
            }

            indicator.appendChild(bossDot);
        }
    }
});
