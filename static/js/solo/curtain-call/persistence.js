/**
 * Curtain Call — Run Persistence (Client)
 *
 * Save/load/restore prototype extensions for run persistence.
 * Cards stored as {id, instanceId} — reconstructed from CARD_DEFINITIONS on load.
 *
 * Version 2: Adds gold, eventHistory, nextCombatModifiers, merchantPurchases.
 *            Scene index is now 0-4 into NODE_SEQUENCE.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    /**
     * Build a compact save payload from current between-combat state.
     */
    getSavePayload() {
        const serializeCards = (cards) =>
            cards.map(c => ({ id: c.id, instanceId: c.instanceId }));

        return {
            version: 3,
            selectedAldricBasic: this.selectedAldricBasic,
            selectedPipBasic: this.selectedPipBasic,
            runState: { ...this.runState },
            macguffin: {
                currentHP: this.combatState.macguffin.currentHP,
                maxHP: this.combatState.macguffin.maxHP
            },
            deck: serializeCards(this.deck),
            discardPile: serializeCards(this.discardPile),
            activeEnchantments: serializeCards(this.activeEnchantments),
            stageProps: [...(this.stageProps || [])],
            gold: this.gold || 0,
            eventHistory: [...(this.eventHistory || [])],
            nextCombatModifiers: { ...(this.nextCombatModifiers || {}) },
            merchantPurchases: [...(this.merchantPurchases || [])],
            // M7 fields
            selectedMacGuffin: this.selectedMacGuffin || 'treasure-chest',
            difficulty: this.difficulty || 0,
            runStats: { ...this.runStats, bossesDefeated: [...(this.runStats.bossesDefeated || [])] }
        };
    },

    /**
     * Save the current run to the server. Fire-and-forget.
     */
    saveRun() {
        const runId = localStorage.getItem('curtainCallRunId');
        if (!runId) return;

        const payload = this.getSavePayload();

        fetch('/api/curtain-call/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ run_id: runId, state: payload, username: this.username || '' })
        }).then(res => {
            if (!res.ok) console.warn('Curtain Call: save failed', res.status);
            else console.log('Curtain Call: run saved');
        }).catch(err => {
            console.warn('Curtain Call: save error', err);
        });
    },

    /**
     * Load a run from the server.
     * @param {string} runId
     * @returns {Promise<object|null>} Parsed state or null
     */
    async loadRun(runId) {
        try {
            const res = await fetch(`/api/curtain-call/load/${runId}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            console.warn('Curtain Call: load error', err);
            return null;
        }
    },

    /**
     * Migrate a v1 payload to v2 format.
     */
    _migrateV1toV2(payload) {
        const scene = payload.runState.currentScene;
        if (scene === 'boss') {
            payload.runState.currentScene = 4;
        } else if (typeof scene === 'number') {
            payload.runState.currentScene = scene * 2;
        }
        payload.version = 2;
        payload.gold = payload.gold || 0;
        payload.eventHistory = [];
        payload.nextCombatModifiers = {};
        payload.merchantPurchases = [];
        return payload;
    },

    /**
     * Migrate a v2 payload to v3 format (M7 meta-progression fields).
     */
    _migrateV2toV3(payload) {
        payload.version = 3;
        payload.selectedMacGuffin = payload.selectedMacGuffin || 'treasure-chest';
        payload.difficulty = payload.difficulty || 0;
        payload.runStats = payload.runStats || {
            actsCompleted: 0, bossesDefeated: [], maxOvationReached: 0,
            maxEnemyDebuffTypes: 0, flawlessBoss: false, finalGold: 0,
            result: 'defeat', macguffinId: 'treasure-chest', difficulty: 0,
            aldricBasic: payload.selectedAldricBasic || 'galvanize',
            pipBasic: payload.selectedPipBasic || 'quick-jab'
        };
        return payload;
    },

    /**
     * Restore game state from a saved payload.
     */
    restoreFromPayload(payload) {
        // Migrate old saves
        if (payload.version === 1 || !payload.version) {
            payload = this._migrateV1toV2(payload);
        }
        if (payload.version === 2) {
            payload = this._migrateV2toV3(payload);
        }

        // Character choices
        this.selectedAldricBasic = payload.selectedAldricBasic || 'galvanize';
        this.selectedPipBasic = payload.selectedPipBasic || 'quick-jab';

        // Run state
        this.runState = { ...payload.runState };

        // MacGuffin HP
        this.combatState.macguffin.currentHP = payload.macguffin.currentHP;
        this.combatState.macguffin.maxHP = payload.macguffin.maxHP;

        // Reconstruct full card objects from compact {id, instanceId}
        const reconstruct = (entries) =>
            entries
                .filter(e => CARD_DEFINITIONS[e.id])
                .map(e => ({ ...CARD_DEFINITIONS[e.id], instanceId: e.instanceId }));

        const allCards = [
            ...reconstruct(payload.deck || []),
            ...reconstruct(payload.discardPile || []),
            ...reconstruct(payload.activeEnchantments || [])
        ];

        // Shuffle combined cards into deck for next combat
        for (let i = allCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
        }

        this.deck = allCards;
        this.discardPile = [];
        this.hand = [];

        // Stage props
        this.stageProps = payload.stageProps || [];

        // M6 fields
        this.gold = payload.gold || 0;
        this.eventHistory = payload.eventHistory || [];
        this.nextCombatModifiers = payload.nextCombatModifiers || {};
        this.merchantPurchases = payload.merchantPurchases || [];

        // M7 fields
        this.selectedMacGuffin = payload.selectedMacGuffin || 'treasure-chest';
        this.difficulty = payload.difficulty || 0;
        if (payload.runStats) {
            this.runStats = {
                ...this.runStats,
                ...payload.runStats,
                bossesDefeated: payload.runStats.bossesDefeated || []
            };
        }
    },

    /**
     * Check localStorage for an existing run and load it from the server.
     * @returns {Promise<object|null>} Saved payload or null
     */
    async checkForExistingRun() {
        const runId = localStorage.getItem('curtainCallRunId');
        if (!runId) return null;

        const payload = await this.loadRun(runId);
        if (!payload) {
            // Server doesn't have it — clear stale localStorage
            localStorage.removeItem('curtainCallRunId');
            return null;
        }
        return payload;
    },

    /**
     * Start a new run: generate UUID and store in localStorage.
     */
    startNewRun() {
        const runId = crypto.randomUUID();
        localStorage.setItem('curtainCallRunId', runId);
        console.log('Curtain Call: new run', runId);
    },

    /**
     * Abandon the current run (delete from server + clear localStorage).
     */
    abandonRun() {
        const runId = localStorage.getItem('curtainCallRunId');
        if (!runId) return;

        fetch(`/api/curtain-call/run/${runId}`, { method: 'DELETE' })
            .catch(() => {});
        localStorage.removeItem('curtainCallRunId');
    },

    /**
     * Delete a completed run (victory or defeat). Same as abandonRun.
     */
    deleteCompletedRun() {
        this.abandonRun();
    }
});
