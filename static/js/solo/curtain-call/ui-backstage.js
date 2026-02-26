/**
 * Curtain Call — M7 Backstage Menu UI
 *
 * Tabs: Unlocks, Achievements, History, Difficulty.
 * Rendering, interaction, and purchase flow.
 *
 * Extends CurtainCallGame.prototype (loaded after meta-progression.js).
 */

'use strict';

Object.assign(CurtainCallGame.prototype, {

    showBackstage() {
        const overlay = document.getElementById('backstage-overlay');
        if (!overlay) return;

        // Update ticket count
        const ticketCount = document.getElementById('backstage-ticket-count');
        if (ticketCount) ticketCount.textContent = this.metaState?.tickets || 0;

        // Set up tab clicks
        const tabs = overlay.querySelectorAll('.backstage-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderBackstageTab(tab.dataset.tab);
            };
        });

        // Set up close button
        const closeBtn = document.getElementById('backstage-close');
        if (closeBtn) closeBtn.onclick = () => this.hideBackstage();

        // Default to Unlocks tab
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === 'unlocks'));
        this.renderBackstageTab('unlocks');

        overlay.style.display = 'flex';
    },

    hideBackstage() {
        const overlay = document.getElementById('backstage-overlay');
        if (overlay) overlay.style.display = 'none';

        // Refresh title ticket count
        this._updateTitleTickets();
    },

    renderBackstageTab(tab) {
        switch (tab) {
            case 'unlocks': this.renderUnlockTracks(); break;
            case 'achievements': this.renderAchievements(); break;
            case 'history': this.renderRunHistory(); break;
            case 'difficulty': this.renderDifficultySelect(); break;
        }
    },

    renderUnlockTracks() {
        const body = document.getElementById('backstage-body');
        if (!body) return;

        let html = '';
        for (const trackId in UNLOCK_TRACKS) {
            const track = UNLOCK_TRACKS[trackId];
            const unlockedTiers = this.metaState?.unlocks?.[trackId] || [];

            html += `<div class="unlock-track">`;
            html += `<div class="unlock-track-header">${track.icon} ${track.name}</div>`;
            html += `<div class="unlock-track-desc">${track.description}</div>`;
            html += `<div class="unlock-track-tiers">`;

            for (const tierDef of track.tiers) {
                const isUnlocked = unlockedTiers.includes(tierDef.tier);
                // Check if previous tier is unlocked (tier 1 always available)
                const prevUnlocked = tierDef.tier === 1 || unlockedTiers.includes(tierDef.tier - 1);
                const canAfford = (this.metaState?.tickets || 0) >= tierDef.cost;
                const canBuy = !isUnlocked && prevUnlocked && canAfford;

                let tierClass = 'unlock-tier';
                if (isUnlocked) tierClass += ' unlocked';
                else if (canBuy) tierClass += ' available';
                else tierClass += ' locked';

                // Build label from unlocks
                let label = tierDef.unlocks.map(id => {
                    if (tierDef.type === 'card') return CARD_DEFINITIONS[id]?.name || id;
                    if (tierDef.type === 'prop') return STAGE_PROP_DEFINITIONS[id]?.name || id;
                    if (tierDef.type === 'macguffin') return MACGUFFIN_VARIANTS[id]?.name || id;
                    if (tierDef.type === 'basic') return CARD_DEFINITIONS[id]?.name || id;
                    return id;
                }).join(', ');

                html += `<div class="${tierClass}" data-track="${trackId}" data-tier="${tierDef.tier}" data-cost="${tierDef.cost}">`;
                html += `<div class="unlock-tier-name">${label}</div>`;
                if (isUnlocked) {
                    html += `<div class="unlock-tier-status">Unlocked</div>`;
                } else {
                    html += `<div class="unlock-tier-cost">🎫 ${tierDef.cost}</div>`;
                }
                html += `</div>`;
            }

            html += `</div></div>`;
        }

        body.innerHTML = html;

        // Bind purchase clicks
        body.querySelectorAll('.unlock-tier.available').forEach(el => {
            el.addEventListener('click', async () => {
                const track = el.dataset.track;
                const tier = parseInt(el.dataset.tier, 10);
                const cost = parseInt(el.dataset.cost, 10);
                const success = await this.purchaseUnlock(track, tier, cost);
                if (success) {
                    // Re-render
                    const ticketCount = document.getElementById('backstage-ticket-count');
                    if (ticketCount) ticketCount.textContent = this.metaState?.tickets || 0;
                    this.renderUnlockTracks();
                }
            });
        });
    },

    renderAchievements() {
        const body = document.getElementById('backstage-body');
        if (!body) return;

        const earned = this.metaState?.achievements || [];
        let html = '';

        for (const achId in ACHIEVEMENT_DEFINITIONS) {
            const def = ACHIEVEMENT_DEFINITIONS[achId];
            const isEarned = earned.includes(achId);

            html += `<div class="achievement-row${isEarned ? ' earned' : ''}">`;
            html += `<div class="achievement-icon">${isEarned ? def.icon : '\uD83D\uDD12'}</div>`;
            html += `<div class="achievement-info">`;
            html += `<div class="achievement-name">${def.name}</div>`;
            html += `<div class="achievement-desc">${def.description}</div>`;
            html += `</div>`;
            html += `<div class="achievement-reward">${isEarned ? 'Earned' : `🎫 ${def.tickets}`}</div>`;
            html += `</div>`;
        }

        body.innerHTML = html;
    },

    renderRunHistory() {
        const body = document.getElementById('backstage-body');
        if (!body) return;

        const history = this.metaState?.history || [];

        if (history.length === 0) {
            body.innerHTML = '<div class="history-empty">No runs completed yet.</div>';
            return;
        }

        let html = '<div class="history-list">';
        for (const run of history) {
            const isVictory = run.result === 'victory';
            const diffDef = DIFFICULTY_DEFINITIONS[run.difficulty] || DIFFICULTY_DEFINITIONS[0];

            html += `<div class="history-entry${isVictory ? ' victory' : ' defeat'}">`;
            html += `<div class="history-result">${isVictory ? 'Victory' : 'Defeat'}</div>`;
            html += `<div class="history-details">`;
            html += `<span>Acts: ${run.actsCompleted}</span>`;
            html += `<span>Bosses: ${run.bossesDefeated}</span>`;
            html += `<span>${diffDef.icon} ${diffDef.name}</span>`;
            html += `</div>`;
            html += `<div class="history-tickets">🎫 +${run.ticketsEarned}</div>`;
            html += `</div>`;
        }
        html += '</div>';

        body.innerHTML = html;
    },

    renderDifficultySelect() {
        const body = document.getElementById('backstage-body');
        if (!body) return;

        const unlocked = this.getUnlockedDifficulties();
        const currentDifficulty = this.difficulty || 0;

        let html = '<div class="difficulty-description">Difficulty affects all enemies for the next run.</div>';

        for (const def of DIFFICULTY_DEFINITIONS) {
            const isUnlocked = unlocked.some(d => d.level === def.level);
            const isSelected = def.level === currentDifficulty;

            let cls = 'difficulty-option';
            if (isSelected) cls += ' selected';
            if (!isUnlocked) cls += ' locked';

            html += `<div class="${cls}" data-level="${def.level}">`;
            html += `<div class="difficulty-icon">${def.icon}</div>`;
            html += `<div class="difficulty-info">`;
            html += `<div class="difficulty-name">${def.name}</div>`;
            html += `<div class="difficulty-desc">${def.description}</div>`;
            html += `</div>`;
            if (!isUnlocked) {
                const reqAch = ACHIEVEMENT_DEFINITIONS[def.requiresAchievement];
                html += `<div class="difficulty-lock">\uD83D\uDD12 ${reqAch?.name || 'Locked'}</div>`;
            }
            html += `</div>`;
        }

        body.innerHTML = html;

        // Bind selection clicks
        body.querySelectorAll('.difficulty-option:not(.locked)').forEach(el => {
            el.addEventListener('click', () => {
                this.difficulty = parseInt(el.dataset.level, 10);
                this.renderDifficultySelect();
            });
        });
    },

    /**
     * Update the title screen ticket display.
     */
    _updateTitleTickets() {
        const el = document.getElementById('title-ticket-count');
        if (el) el.textContent = this.metaState?.tickets || 0;
    }
});
