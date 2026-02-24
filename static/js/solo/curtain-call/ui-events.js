/**
 * Curtain Call — Input Handling & Drag-to-Play
 *
 * Event binding for end turn, card interactions (pointer events),
 * card zoom dismiss, puppet taps, status icon taps, reward buttons,
 * deck list controls, and the full drag-to-play system.
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
                    this._dragState = null;
                    this.playCard(ds.index, drop.target);
                } else {
                    this._cancelDrag(ds);
                    this._dragState = null;
                    this._resumeReflow();
                }
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

        // Remove a Card button on rewards screen
        if (this.elements.removeCardBtn) {
            this.elements.removeCardBtn.addEventListener('click', () => {
                this.showDeckListForRemoval();
            });
        }

        // Deck count indicator — tap to open deck list (view mode)
        if (this.elements.deckCountIndicator) {
            this.elements.deckCountIndicator.addEventListener('click', () => {
                if (this.runState.phase === 'combat') {
                    this.showDeckList('view');
                }
            });
        }

        // Deck list close button
        if (this.elements.deckListClose) {
            this.elements.deckListClose.addEventListener('click', () => {
                // If removal was in progress from rewards, re-show rewards
                if (this._removalFromRewards) {
                    this._removalFromRewards = false;
                    if (this.elements.rewardsOverlay) {
                        this.elements.rewardsOverlay.style.display = 'flex';
                    }
                }
                this.hideDeckList();
            });
        }

        // Deck list overlay — dismiss on background click
        if (this.elements.deckListOverlay) {
            this.elements.deckListOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.deckListOverlay) {
                    // Same logic as close button
                    if (this._removalFromRewards) {
                        this._removalFromRewards = false;
                        if (this.elements.rewardsOverlay) {
                            this.elements.rewardsOverlay.style.display = 'flex';
                        }
                    }
                    this.hideDeckList();
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
            'Focus': 'focus',
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
    }
});
