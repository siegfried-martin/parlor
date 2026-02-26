/**
 * Curtain Call — Merchant System
 *
 * "Gertie's Grip Shop" — 5 fixed inventory slots available between
 * combat 2 and the boss. Items can only be purchased once per act.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

const MERCHANT_ITEMS = [
    {
        id: 'stage-prop',
        name: 'Stage Prop',
        description: 'Choose a permanent passive',
        icon: '\uD83C\uDFAD',
        price: 30,
        effect: 'stageProp'
    },
    {
        id: 'card-pack',
        name: 'Card Pack',
        description: 'Pick 1 of 3 uncommon cards',
        icon: '\uD83C\uDCCF',
        price: 20,
        effect: 'cardReward'
    },
    {
        id: 'premium-card',
        name: 'Premium Card',
        description: 'Pick 1 of 3 rare cards',
        icon: '\u2B50',
        price: 35,
        effect: 'rareCardReward'
    },
    {
        id: 'card-shredder',
        name: 'Card Shredder',
        description: 'Remove 1 card from deck',
        icon: '\u2702\uFE0F',
        price: 25,
        effect: 'removeCard'
    },
    {
        id: 'macguffin-polish',
        name: 'MacGuffin Polish',
        description: 'Restore 8 HP to the MacGuffin',
        icon: '\u2728',
        price: 15,
        effect: 'healMacGuffin'
    }
];

Object.assign(CurtainCallGame.prototype, {

    showMerchant() {
        this.saveRun();
        this.showGoldDisplay(true);
        this.renderGoldDisplay();

        this.runState.phase = 'merchant';
        this.renderMerchant();

        if (this.elements.merchantOverlay) {
            this.elements.merchantOverlay.style.display = 'flex';
        }
    },

    renderMerchant() {
        if (!this.elements.merchantItems) return;

        // Update gold display
        if (this.elements.merchantGoldValue) {
            this.elements.merchantGoldValue.textContent = this.gold;
        }

        this.elements.merchantItems.innerHTML = '';

        MERCHANT_ITEMS.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'merchant-item';

            const sold = this.merchantPurchases.includes(item.id);
            const canAfford = this.gold >= item.price;

            if (sold) {
                row.classList.add('sold');
            } else if (!canAfford) {
                row.classList.add('unaffordable');
            }

            // Icon
            const iconDiv = document.createElement('div');
            iconDiv.className = 'merchant-item-icon';
            iconDiv.textContent = item.icon;
            row.appendChild(iconDiv);

            // Info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'merchant-item-info';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'merchant-item-name';
            nameDiv.textContent = sold ? `${item.name} (SOLD)` : item.name;
            infoDiv.appendChild(nameDiv);

            const descDiv = document.createElement('div');
            descDiv.className = 'merchant-item-desc';
            descDiv.textContent = item.description;
            infoDiv.appendChild(descDiv);

            row.appendChild(infoDiv);

            // Price
            const priceDiv = document.createElement('div');
            priceDiv.className = 'merchant-item-price';
            priceDiv.innerHTML = `<span class="gold-icon">&#x1FA99;</span>${item.price}`;
            row.appendChild(priceDiv);

            // Click handler
            if (!sold && canAfford) {
                row.addEventListener('click', () => {
                    this.purchaseMerchantItem(item);
                });
            }

            this.elements.merchantItems.appendChild(row);
        });
    },

    purchaseMerchantItem(item) {
        if (this.gold < item.price) return;
        if (this.merchantPurchases.includes(item.id)) return;

        // Deduct gold and mark as purchased
        this.gold -= item.price;
        this.merchantPurchases.push(item.id);
        this.renderGoldDisplay();

        console.log(`Purchased: ${item.name} for ${item.price} gold`);

        // Execute effect
        switch (item.effect) {
            case 'stageProp':
                this.hideMerchantOverlay();
                this.showStagePropSelection(() => {
                    this.returnToMerchant();
                });
                break;

            case 'cardReward':
                this._merchantReward = true;
                this.hideMerchantOverlay();
                this.showRewardsScreen('normal');
                break;

            case 'rareCardReward':
                this._merchantReward = true;
                this.hideMerchantOverlay();
                this._showRareRewardScreen();
                break;

            case 'removeCard':
                this._removalFromMerchant = true;
                this.hideMerchantOverlay();
                this.showDeckList('remove');
                break;

            case 'healMacGuffin': {
                const mg = this.combatState.macguffin;
                const oldHP = mg.currentHP;
                mg.currentHP = Math.min(mg.maxHP, mg.currentHP + 8);
                const healed = mg.currentHP - oldHP;
                if (healed > 0) {
                    this.showHealBubble(healed, this.elements.macguffin);
                    this.renderMacGuffinHP();
                }
                console.log(`Merchant: healed MacGuffin for ${healed}`);
                // Stay at merchant — re-render to update state
                this.renderMerchant();
                break;
            }

            default:
                console.warn('Unknown merchant effect:', item.effect);
                this.renderMerchant();
                break;
        }
    },

    /**
     * Show a reward screen with rare-quality cards only.
     */
    _showRareRewardScreen() {
        this._rewardType = 'merchant-rare';
        this._rewardRefreshesLeft = 1;
        this._rewardSeenIds = new Set();
        this._bossRewardPhase = null;

        // Generate 3 rare cards
        const rarePool = Math.random() < 0.5 ? 'aldric' : 'pip';
        const otherPool = rarePool === 'aldric' ? 'pip' : 'aldric';
        this.rewardOptions = [
            this._getUniqueRewardCard(rarePool, 'rare'),
            this._getUniqueRewardCard(otherPool, 'rare'),
            this._getUniqueRewardCard(Math.random() < 0.5 ? 'aldric' : 'pip', 'rare')
        ];

        for (const card of this.rewardOptions) {
            if (card) this._rewardSeenIds.add(card.id);
        }

        this.selectedRewardIndex = null;
        this.renderRewardCards();

        if (this.elements.rewardsOverlay) {
            this.elements.rewardsOverlay.style.display = 'flex';
        }

        if (this.elements.confirmRewardBtn) {
            this.elements.confirmRewardBtn.disabled = true;
        }

        if (this.elements.refreshRewardBtn) {
            this.elements.refreshRewardBtn.disabled = false;
            this.elements.refreshRewardBtn.textContent = 'Refresh (1)';
        }
    },

    hideMerchantOverlay() {
        if (this.elements.merchantOverlay) {
            this.elements.merchantOverlay.style.display = 'none';
        }
    },

    /**
     * Return to merchant after a sub-flow (card reward, removal, prop selection).
     */
    returnToMerchant() {
        this.renderMerchant();
        if (this.elements.merchantOverlay) {
            this.elements.merchantOverlay.style.display = 'flex';
        }
    },

    leaveMerchant() {
        this.hideMerchantOverlay();
        this.advanceScene();
    }
});
