/**
 * Curtain Call — Event Bus
 *
 * Composable event system for reactive triggers. Used by:
 * - Enemy passives (registered per combat, owner: 'enemy-passive')
 * - Enchantment cards (M3, registered per card play, owner: 'enchantment')
 * - Stage Props (M5, registered per run, owner: 'stage-prop')
 *
 * Supports priority-ordered async listeners and owner-based bulk
 * deregistration for cleanup at combat/run boundaries.
 *
 * Loaded before game.js.
 */

'use strict';

class EventBus {
    constructor() {
        this._listeners = {};
    }

    /**
     * Register a listener for an event.
     * @param {string} event
     * @param {Function} callback - Called with event data. May be async.
     * @param {Object} [options]
     * @param {string} [options.owner] - Owner ID for bulk deregistration
     * @param {number} [options.priority=0] - Higher priority fires first
     */
    on(event, callback, options) {
        if (!options) options = {};
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push({
            callback,
            owner: options.owner || null,
            priority: options.priority || 0
        });
        this._listeners[event].sort((a, b) => b.priority - a.priority);
    }

    /**
     * Remove a specific listener by callback reference.
     */
    off(event, callback) {
        const list = this._listeners[event];
        if (!list) return;
        this._listeners[event] = list.filter(l => l.callback !== callback);
    }

    /**
     * Remove all listeners registered by a given owner.
     * @param {string} owner
     */
    offByOwner(owner) {
        for (const event in this._listeners) {
            this._listeners[event] = this._listeners[event].filter(l => l.owner !== owner);
        }
    }

    /**
     * Remove all listeners.
     */
    clear() {
        this._listeners = {};
    }

    /**
     * Emit an event. Listeners fire in priority order (highest first).
     * Each listener is awaited before the next fires.
     *
     * For "before" events, pass a mutable context object that listeners
     * can modify (e.g., { damage: 10, blocked: false }).
     *
     * @param {string} event
     * @param {Object} [data={}]
     */
    async emit(event, data) {
        const list = this._listeners[event];
        if (!list || list.length === 0) return;
        for (const listener of [...list]) {
            await listener.callback(data || {});
        }
    }

    /**
     * Check if any listeners are registered for an event.
     * @param {string} event
     * @returns {boolean}
     */
    has(event) {
        const list = this._listeners[event];
        return list && list.length > 0;
    }
}
