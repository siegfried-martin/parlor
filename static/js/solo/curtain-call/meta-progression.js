/**
 * Curtain Call — M7 Meta-Progression Client Logic
 *
 * Load/cache meta state, pool injection, ticket calculation,
 * achievement checking, end-of-run submission, purchase flow.
 *
 * Extends CurtainCallGame.prototype (loaded after meta-data.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    /**
     * Load meta state from the server and cache it.
     * Called during setup() before showing the title screen.
     */
    async loadMetaState() {
        try {
            const res = await fetch('/api/curtain-call/meta');
            if (!res.ok) {
                console.warn('Curtain Call: meta load failed', res.status);
                this.metaState = { tickets: 0, unlocks: {}, achievements: [], history: [] };
                return;
            }
            this.metaState = await res.json();
        } catch (err) {
            console.warn('Curtain Call: meta load error', err);
            this.metaState = { tickets: 0, unlocks: {}, achievements: [], history: [] };
        }
        this.applyMetaUnlocks();
        console.log('Curtain Call: meta state loaded', this.metaState.tickets, 'tickets');
    },

    /**
     * Apply unlocked content to card/prop/basic pools.
     * Called after loading meta state and after purchases.
     */
    applyMetaUnlocks() {
        if (!this.metaState || !this.metaState.unlocks) return;

        const unlocks = this.metaState.unlocks;

        for (const trackId in UNLOCK_TRACKS) {
            const track = UNLOCK_TRACKS[trackId];
            const unlockedTiers = unlocks[trackId] || [];

            for (const tierDef of track.tiers) {
                if (!unlockedTiers.includes(tierDef.tier)) continue;

                for (const itemId of tierDef.unlocks) {
                    if (tierDef.type === 'card') {
                        this._injectCard(itemId);
                    } else if (tierDef.type === 'prop') {
                        this._injectProp(itemId);
                    } else if (tierDef.type === 'basic') {
                        this._injectBasic(itemId, tierDef.protagonist);
                    }
                    // 'macguffin' type doesn't need pool injection — handled by getUnlockedMacGuffins
                }
            }
        }
    },

    _injectCard(cardId) {
        const card = CARD_DEFINITIONS[cardId];
        if (!card) return;

        const owner = card.owner;
        // Only inject into protagonist pools (aldric/pip), or handle macguffin neutral cards
        const poolOwner = (owner === 'macguffin') ? null : owner;

        if (poolOwner) {
            // Add to main pool if not present
            if (!CARD_POOLS[poolOwner].includes(cardId)) {
                CARD_POOLS[poolOwner].push(cardId);
            }
            // Add to rarity pool
            const rarity = card.rarity === 'basic' ? 'uncommon' : card.rarity;
            if (CARD_POOLS_BY_RARITY[poolOwner]?.[rarity] &&
                !CARD_POOLS_BY_RARITY[poolOwner][rarity].includes(cardId)) {
                CARD_POOLS_BY_RARITY[poolOwner][rarity].push(cardId);
            }
        } else {
            // Neutral cards: add to both pools
            for (const p of ['aldric', 'pip']) {
                if (!CARD_POOLS[p].includes(cardId)) {
                    CARD_POOLS[p].push(cardId);
                }
                const rarity = card.rarity === 'basic' ? 'uncommon' : card.rarity;
                if (CARD_POOLS_BY_RARITY[p]?.[rarity] &&
                    !CARD_POOLS_BY_RARITY[p][rarity].includes(cardId)) {
                    CARD_POOLS_BY_RARITY[p][rarity].push(cardId);
                }
            }
        }
    },

    _injectProp(propId) {
        if (STAGE_PROP_DEFINITIONS[propId] && !STAGE_PROP_POOL.includes(propId)) {
            STAGE_PROP_POOL.push(propId);
        }
    },

    _injectBasic(cardId, protagonist) {
        if (!BASIC_OPTIONS[protagonist]) return;
        if (!BASIC_OPTIONS[protagonist].includes(cardId)) {
            BASIC_OPTIONS[protagonist].push(cardId);
        }
    },

    /**
     * Get variant IDs the player has unlocked (always includes treasure-chest).
     */
    getUnlockedMacGuffins() {
        const unlocked = ['treasure-chest'];
        const tiers = this.metaState?.unlocks?.['macguffin-variants'] || [];

        const track = UNLOCK_TRACKS['macguffin-variants'];
        if (track) {
            for (const tierDef of track.tiers) {
                if (tiers.includes(tierDef.tier)) {
                    unlocked.push(...tierDef.unlocks);
                }
            }
        }
        return unlocked;
    },

    /**
     * Get difficulty levels the player can access.
     */
    getUnlockedDifficulties() {
        const achievements = this.metaState?.achievements || [];
        return DIFFICULTY_DEFINITIONS.filter(d =>
            !d.requiresAchievement || achievements.includes(d.requiresAchievement)
        );
    },

    /**
     * Calculate tickets earned from a run result.
     */
    calculateTickets(runStats) {
        let tickets = 0;

        // Acts completed: 5 per act
        tickets += (runStats.actsCompleted || 0) * 5;

        // Victory bonus
        if (runStats.result === 'victory') {
            tickets += 15;
        }

        // Bosses defeated: 3 each
        const bossCount = runStats.bossesDefeated ? runStats.bossesDefeated.length : 0;
        tickets += bossCount * 3;

        // Gold: divide by 10 (floored)
        tickets += Math.floor((runStats.finalGold || 0) / 10);

        // Difficulty multiplier
        const diffLevel = runStats.difficulty || 0;
        if (diffLevel >= 1) {
            tickets = Math.floor(tickets * (1 + diffLevel * 0.25));
        }

        return tickets;
    },

    /**
     * Check which achievements were newly earned this run.
     */
    checkNewAchievements(runStats) {
        const earned = this.metaState?.achievements || [];
        const newAchievements = [];

        for (const achId in ACHIEVEMENT_DEFINITIONS) {
            if (earned.includes(achId)) continue;
            const def = ACHIEVEMENT_DEFINITIONS[achId];
            if (def.check && def.check(runStats)) {
                newAchievements.push(achId);
            }
        }

        return newAchievements;
    },

    /**
     * Submit end-of-run data to the server.
     */
    async submitEndOfRun(runStats) {
        const ticketsEarned = this.calculateTickets(runStats);
        const newAchievements = this.checkNewAchievements(runStats);

        // Add achievement ticket bonuses
        let achievementTickets = 0;
        for (const achId of newAchievements) {
            const def = ACHIEVEMENT_DEFINITIONS[achId];
            if (def) achievementTickets += def.tickets;
        }

        const totalTickets = ticketsEarned + achievementTickets;

        const body = {
            ticketsEarned: totalTickets,
            newAchievements,
            runData: {
                result: runStats.result,
                actsCompleted: runStats.actsCompleted || 0,
                bossesDefeated: runStats.bossesDefeated ? runStats.bossesDefeated.length : 0,
                macguffinId: runStats.macguffinId || 'treasure-chest',
                difficulty: runStats.difficulty || 0,
                ticketsEarned: totalTickets,
                finalGold: runStats.finalGold || 0,
                aldricBasic: runStats.aldricBasic,
                pipBasic: runStats.pipBasic
            }
        };

        try {
            const res = await fetch('/api/curtain-call/meta/end-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                this.metaState = await res.json();
                console.log('Curtain Call: end-of-run recorded, tickets:', this.metaState.tickets);
            }
        } catch (err) {
            console.warn('Curtain Call: end-of-run error', err);
        }

        return { ticketsEarned, achievementTickets, newAchievements, totalTickets };
    },

    /**
     * Show the end-of-run summary overlay with ticket breakdown and achievements.
     */
    async showEndOfRunSummary(result) {
        // Finalize run stats
        this.runStats.result = result;
        this.runStats.finalGold = this.gold || 0;
        this.runStats.macguffinId = this.selectedMacGuffin || 'treasure-chest';
        this.runStats.difficulty = this.difficulty || 0;
        this.runStats.aldricBasic = this.selectedAldricBasic;
        this.runStats.pipBasic = this.selectedPipBasic;

        // Calculate and submit
        const { ticketsEarned, achievementTickets, newAchievements, totalTickets } =
            await this.submitEndOfRun(this.runStats);

        // Build overlay
        const overlay = document.getElementById('run-summary-overlay');
        if (!overlay) return;

        const isVictory = result === 'victory';
        const title = overlay.querySelector('.run-summary-title');
        if (title) {
            title.textContent = isVictory ? 'Performance Complete!' : 'The Curtain Falls...';
            title.className = 'run-summary-title' + (isVictory ? ' victory' : ' defeat');
        }

        // Stats breakdown
        const statsEl = overlay.querySelector('.run-summary-stats');
        if (statsEl) {
            const diffDef = DIFFICULTY_DEFINITIONS[this.runStats.difficulty] || DIFFICULTY_DEFINITIONS[0];
            statsEl.innerHTML = `
                <div class="run-stat"><span>Acts Completed</span><span>${this.runStats.actsCompleted}</span></div>
                <div class="run-stat"><span>Bosses Defeated</span><span>${this.runStats.bossesDefeated.length}</span></div>
                <div class="run-stat"><span>Final Gold</span><span>${this.runStats.finalGold}</span></div>
                <div class="run-stat"><span>Difficulty</span><span>${diffDef.icon} ${diffDef.name}</span></div>
            `;
        }

        // Ticket breakdown
        const ticketsEl = overlay.querySelector('.run-summary-tickets');
        if (ticketsEl) {
            let html = `<div class="ticket-heading">Tickets Earned</div>`;
            html += `<div class="ticket-line"><span>Run performance</span><span>+${ticketsEarned - (ticketsEarned > 0 ? 0 : 0)}</span></div>`;
            if (achievementTickets > 0) {
                html += `<div class="ticket-line achievement"><span>Achievement bonuses</span><span>+${achievementTickets}</span></div>`;
            }
            html += `<div class="ticket-total"><span>Total</span><span>\uD83C\uDFAB ${totalTickets}</span></div>`;
            ticketsEl.innerHTML = html;
        }

        // New achievements
        const achEl = overlay.querySelector('.run-summary-achievements');
        if (achEl) {
            if (newAchievements.length > 0) {
                let html = '<div class="achievement-heading">New Achievements!</div>';
                for (const achId of newAchievements) {
                    const def = ACHIEVEMENT_DEFINITIONS[achId];
                    if (def) {
                        html += `<div class="achievement-entry">${def.icon} ${def.name} <span class="achievement-tickets">+${def.tickets} \uD83C\uDFAB</span></div>`;
                    }
                }
                achEl.innerHTML = html;
                achEl.style.display = '';
            } else {
                achEl.innerHTML = '';
                achEl.style.display = 'none';
            }
        }

        overlay.style.display = 'flex';
    },

    /**
     * Hide the end-of-run summary and return to title.
     */
    hideEndOfRunSummary() {
        const overlay = document.getElementById('run-summary-overlay');
        if (overlay) overlay.style.display = 'none';

        // Reset run stats for next run
        this.runStats = {
            actsCompleted: 0,
            bossesDefeated: [],
            maxOvationReached: 0,
            maxEnemyDebuffTypes: 0,
            flawlessBoss: false,
            finalGold: 0,
            result: 'defeat',
            macguffinId: 'treasure-chest',
            difficulty: 0,
            aldricBasic: 'galvanize',
            pipBasic: 'quick-jab'
        };

        // Go back to title
        this.elements.container.classList.add('game-ui-hidden', 'curtain-closed');
        this._savedRunData = null;
        this.showTitleScreen();
    },

    /**
     * Purchase an unlock tier from the Backstage menu.
     */
    async purchaseUnlock(trackId, tier, cost) {
        try {
            const res = await fetch('/api/curtain-call/meta/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackId, tier, cost })
            });
            if (!res.ok) {
                console.warn('Curtain Call: purchase failed', res.status);
                return false;
            }
            this.metaState = await res.json();
            this.applyMetaUnlocks();
            console.log('Curtain Call: purchased', trackId, 'tier', tier);
            return true;
        } catch (err) {
            console.warn('Curtain Call: purchase error', err);
            return false;
        }
    }
});
