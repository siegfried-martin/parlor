/**
 * Curtain Call — Narrative Events
 *
 * 6 narrative events presented as puppet show vignettes on the actual stage.
 * Curtains open to reveal: title at top, protagonists with speech bubbles,
 * and choice buttons in the hand area.
 *
 * Outcome types:
 *   gainRandomCard, gainCardReward, removeCardChoice,
 *   gainStageProp, gainGold, loseGold, healMacGuffin, damageMacGuffin,
 *   healProtagonists, nextCombatModifier
 *
 * Sub-flow outcomes (gainCardReward, removeCardChoice, gainStageProp) must
 * be the LAST outcome in a choice's outcome array. They launch interactive
 * sub-flows that handle advanceScene on completion.
 *
 * Extends CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

const NARRATIVE_EVENTS = {
    'hungry-pip': {
        id: 'hungry-pip',
        title: 'The Hungry Puppet',
        dialogue: [
            { speaker: 'pip', text: "That MacGuffin smells delicious... just one tiny bite?" },
            { speaker: 'aldric', text: "Pip, NO. We need it intact for the finale!" }
        ],
        choices: [
            {
                label: 'Side with Pip',
                description: 'Gain an uncommon Pip card, but the MacGuffin takes 5 damage',
                protagonist: 'pip',
                reaction: "Mmm! Totally worth it!",
                outcomes: [
                    { type: 'damageMacGuffin', value: 5 },
                    { type: 'gainRandomCard', pool: 'pip', rarity: 'uncommon' }
                ]
            },
            {
                label: 'Side with Aldric',
                description: 'Heal the MacGuffin for 5 HP and start next combat with 5 Block',
                protagonist: 'aldric',
                reaction: "Good. Let's keep things professional.",
                outcomes: [
                    { type: 'healMacGuffin', value: 5 },
                    { type: 'nextCombatModifier', modifier: { playerBlock: 5 } }
                ]
            }
        ]
    },

    'stage-fright': {
        id: 'stage-fright',
        title: 'Stage Fright',
        dialogue: [
            { speaker: 'aldric', text: "I... I can't feel my legs. What if I forget my lines?" },
            { speaker: 'pip', text: "Relax, big guy! Or don't — I'll handle it for a small fee." }
        ],
        choices: [
            {
                label: 'Encourage Aldric',
                description: 'Gain 2 Inspire, but the next enemy also gains 2 Inspire',
                protagonist: 'aldric',
                reaction: "You're right. I was born for this stage!",
                outcomes: [
                    { type: 'nextCombatModifier', modifier: { playerInspire: 2, enemyInspire: 2 } }
                ]
            },
            {
                label: 'Let Pip handle it',
                description: 'Gain 15 Gold',
                protagonist: 'pip',
                reaction: "Step right up, folks! Tickets half price!",
                outcomes: [
                    { type: 'gainGold', value: 15 }
                ]
            }
        ]
    },

    'mysterious-prop': {
        id: 'mysterious-prop',
        title: 'The Mysterious Prop',
        dialogue: [
            { speaker: 'aldric', text: "There's something backstage... a strange glowing prop." },
            { speaker: 'pip', text: "Ooh, shiny! I bet we could pawn that for a fortune." }
        ],
        choices: [
            {
                label: 'Claim the prop',
                description: 'Gain a Stage Prop, but the next enemy starts with 2 Inspire',
                protagonist: 'aldric',
                reaction: "This will serve us well on stage.",
                outcomes: [
                    { type: 'nextCombatModifier', modifier: { enemyInspire: 2 } },
                    { type: 'gainStageProp' }
                ]
            },
            {
                label: 'Sell it',
                description: 'Gain 20 Gold',
                protagonist: 'pip',
                reaction: "Sold! To the puppet with excellent taste!",
                outcomes: [
                    { type: 'gainGold', value: 20 }
                ]
            }
        ]
    },

    'script-rewrite': {
        id: 'script-rewrite',
        title: 'Script Rewrite',
        dialogue: [
            { speaker: 'pip', text: "The script is all wrong! Let me improvise — I'll cut the boring parts." },
            { speaker: 'aldric', text: "Or we could stick to the original and add a dramatic scene." }
        ],
        choices: [
            {
                label: 'Improvise with Pip',
                description: 'Remove a card from your deck, but the MacGuffin takes 3 damage',
                protagonist: 'pip',
                reaction: "Snip snip! Much better without that bit.",
                outcomes: [
                    { type: 'damageMacGuffin', value: 3 },
                    { type: 'removeCardChoice' }
                ]
            },
            {
                label: 'Stick with Aldric',
                description: 'Gain a standard card reward',
                protagonist: 'aldric',
                reaction: "A classic never goes out of style.",
                outcomes: [
                    { type: 'gainCardReward' }
                ]
            }
        ]
    },

    'costume-malfunction': {
        id: 'costume-malfunction',
        title: 'Costume Malfunction',
        dialogue: [
            { speaker: 'aldric', text: "My armor is falling apart! Someone get the sewing kit!" },
            { speaker: 'pip', text: "Forget sewing — I've got glue and glitter. Trust me." }
        ],
        choices: [
            {
                label: 'Proper repair',
                description: 'Heal both protagonists to full HP',
                protagonist: 'aldric',
                reaction: "Good as new. Well, good enough.",
                outcomes: [
                    { type: 'healProtagonists' }
                ]
            },
            {
                label: "Pip's quick fix",
                description: 'Start next combat with 3 Luck + 2 Ward, but gain 2 Burn',
                protagonist: 'pip',
                reaction: "Glitter makes everything better! ...Is that smoke?",
                outcomes: [
                    { type: 'nextCombatModifier', modifier: { playerLuck: 3, playerWard: 2, playerBurn: 2 } }
                ]
            }
        ]
    },

    'rival-troupe': {
        id: 'rival-troupe',
        title: 'The Rival Troupe',
        dialogue: [
            { speaker: 'aldric', text: "The rival troupe is backstage. They're planning to sabotage our show!" },
            { speaker: 'pip', text: "Sabotage THEM back? Or I could bribe them to leave..." }
        ],
        choices: [
            {
                label: 'Confront them',
                description: 'Next enemy starts Weak 2 + Vulnerable 2, but lose 15 Gold',
                protagonist: 'aldric',
                reaction: "They won't be bothering us again.",
                outcomes: [
                    { type: 'loseGold', value: 15 },
                    { type: 'nextCombatModifier', modifier: { enemyWeak: 2, enemyVulnerable: 2 } }
                ]
            },
            {
                label: 'Bribe them',
                description: 'Gain 20 Gold, but next enemy starts with 1 Inspire',
                protagonist: 'pip',
                reaction: "Pleasure doing business! Suckers.",
                outcomes: [
                    { type: 'gainGold', value: 20 },
                    { type: 'nextCombatModifier', modifier: { enemyInspire: 1 } }
                ]
            }
        ]
    }
};

// === Narrative Event Prototype Extensions ===

Object.assign(CurtainCallGame.prototype, {

    /**
     * Show a narrative event on the actual stage.
     * Opens curtains, shows title + dialogue + choices.
     */
    showNarrativeEvent() {
        this.saveRun();
        this.showGoldDisplay(true);
        this.renderGoldDisplay();

        const allIds = Object.keys(NARRATIVE_EVENTS);
        const unseen = allIds.filter(id => !this.eventHistory.includes(id));
        const pool = unseen.length > 0 ? unseen : allIds;

        const eventId = pool[Math.floor(Math.random() * pool.length)];
        const event = NARRATIVE_EVENTS[eventId];

        this._currentEvent = event;
        this._eventBubbles = [];
        this.eventHistory.push(eventId);

        // Hide scene select
        if (this.elements.sceneSelectOverlay) {
            this.elements.sceneSelectOverlay.style.display = 'none';
        }

        // Enter event mode — hides combat UI via CSS class
        this.elements.container.classList.add('event-active');

        // Show event title
        if (this.elements.eventStageTitle) {
            this.elements.eventStageTitle.textContent = event.title;
            this.elements.eventStageTitle.style.display = 'block';
        }

        // Clear hand area and hide choices
        if (this.elements.handCards) {
            this.elements.handCards.innerHTML = '';
        }
        if (this.elements.eventStageChoices) {
            this.elements.eventStageChoices.innerHTML = '';
            this.elements.eventStageChoices.style.display = 'none';
        }

        // Open curtains to reveal the stage with protagonists
        this.curtainOpen(() => {
            // Small delay for layout to settle after curtain open
            setTimeout(() => {
                this.playEventDialogue(event.dialogue, 0, () => {
                    this.showEventChoicesOnStage(event);
                });
            }, 300);
        });
    },

    /**
     * Play dialogue lines sequentially as persistent speech bubbles.
     */
    playEventDialogue(dialogue, index, onComplete) {
        if (index >= dialogue.length) {
            if (onComplete) onComplete();
            return;
        }

        const line = dialogue[index];
        const element = line.speaker === 'aldric'
            ? this.elements.heroAldric
            : this.elements.heroPip;

        this._showEventBubble(line.text, element);

        const wordCount = line.text.split(/\s+/).length;
        const delay = Math.min(3000, 1200 + wordCount * 100);

        setTimeout(() => {
            this.playEventDialogue(dialogue, index + 1, onComplete);
        }, delay);
    },

    /**
     * Create a persistent speech bubble near a target element.
     * Unlike combat bubbles, these stay until manually removed.
     */
    _showEventBubble(text, targetElement) {
        if (!this.elements.speechBubbles || !targetElement) return;

        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble character event-persistent';
        bubble.textContent = text;

        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = this.elements.speechBubbles.getBoundingClientRect();

        const left = targetRect.left - containerRect.left + targetRect.width / 2;
        const top = Math.max(0, targetRect.top - containerRect.top - 40);

        bubble.style.left = `${left}px`;
        bubble.style.top = `${top}px`;
        bubble.style.transform = 'translateX(-50%)';

        this.elements.speechBubbles.appendChild(bubble);
        this._eventBubbles = this._eventBubbles || [];
        this._eventBubbles.push(bubble);
    },

    /**
     * Show choice buttons in the hand area, positioned side-by-side.
     */
    showEventChoicesOnStage(event) {
        const container = this.elements.eventStageChoices;
        if (!container) return;

        container.innerHTML = '';
        container.style.display = 'flex';

        event.choices.forEach((choice, i) => {
            const btn = document.createElement('button');
            btn.className = `event-stage-choice choice-${choice.protagonist}`;

            const label = document.createElement('span');
            label.className = 'event-choice-label';
            label.textContent = choice.label;
            btn.appendChild(label);

            const desc = document.createElement('span');
            desc.className = 'event-choice-desc';
            desc.textContent = choice.description;
            btn.appendChild(desc);

            btn.addEventListener('click', () => {
                this.selectEventChoice(event, i);
            });

            container.appendChild(btn);
        });
    },

    selectEventChoice(event, choiceIndex) {
        const choice = event.choices[choiceIndex];
        if (!choice) return;

        // Disable choice buttons
        const container = this.elements.eventStageChoices;
        if (container) {
            container.querySelectorAll('button').forEach(b => b.disabled = true);
        }

        // Clear dialogue bubbles
        this._clearEventBubbles();

        // Show reaction bubble on the protagonist
        const element = choice.protagonist === 'aldric'
            ? this.elements.heroAldric
            : this.elements.heroPip;
        this.showCharacterBubble(choice.reaction, element);

        // Apply outcomes after a short delay for reaction to be read
        setTimeout(() => {
            this.applyEventOutcomes(choice.outcomes, () => {
                // BUG FIX: This callback is the normal completion path.
                // Clean up event UI and advance to the next scene.
                this.cleanupEvent();
                this.advanceScene();
            });
        }, 1500);
    },

    applyEventOutcomes(outcomes, onComplete) {
        this._pendingOutcomes = [...outcomes];
        this._eventOnComplete = onComplete;
        this._processNextOutcome();
    },

    _processNextOutcome() {
        if (!this._pendingOutcomes || this._pendingOutcomes.length === 0) {
            const cb = this._eventOnComplete;
            this._pendingOutcomes = null;
            this._eventOnComplete = null;
            if (cb) cb();
            return;
        }

        const outcome = this._pendingOutcomes.shift();

        switch (outcome.type) {
            case 'gainRandomCard': {
                const card = this.getRandomCardByRarity(outcome.pool, outcome.rarity || 'uncommon');
                if (card) {
                    const newCard = { ...card, instanceId: `${card.id}-event-${Date.now()}` };
                    this.discardPile.push(newCard);
                    this.showCharacterBubble(`Gained ${card.name}!`, this.elements.macguffin);
                    console.log(`Event: gained ${card.name}`);
                }
                setTimeout(() => this._processNextOutcome(), 800);
                break;
            }

            case 'gainCardReward':
                // Sub-flow: show rewards screen. Cleanup event first.
                // hideRewardsScreen() checks _eventReward → advanceScene()
                this._eventReward = true;
                this._pendingOutcomes = null;
                this._eventOnComplete = null;
                this.cleanupEvent();
                this.showRewardsScreen('normal');
                return;

            case 'removeCardChoice':
                // Sub-flow: show deck list for removal. Cleanup event first.
                // confirmCardRemoval() / _handleDeckListClose() checks _removalFromEvent → advanceScene()
                this._removalFromEvent = true;
                this._pendingOutcomes = null;
                this._eventOnComplete = null;
                this.cleanupEvent();
                this.showDeckList('remove');
                return;

            case 'gainStageProp':
                // Sub-flow: show prop selection. Cleanup event, then continue outcomes after selection.
                this.cleanupEvent();
                this.showStagePropSelection(() => {
                    this._processNextOutcome();
                });
                return;

            case 'gainGold':
                this.gold += outcome.value;
                this.renderGoldDisplay();
                this.showSpeechBubble(`+${outcome.value} Gold`, 'buff', this.elements.macguffin);
                console.log(`Event: gained ${outcome.value} gold`);
                setTimeout(() => this._processNextOutcome(), 800);
                break;

            case 'loseGold':
                this.gold = Math.max(0, this.gold - outcome.value);
                this.renderGoldDisplay();
                this.showSpeechBubble(`-${outcome.value} Gold`, 'damage', this.elements.macguffin);
                console.log(`Event: lost ${outcome.value} gold`);
                setTimeout(() => this._processNextOutcome(), 800);
                break;

            case 'healMacGuffin': {
                const mg = this.combatState.macguffin;
                const oldHP = mg.currentHP;
                mg.currentHP = Math.min(mg.maxHP, mg.currentHP + outcome.value);
                const healed = mg.currentHP - oldHP;
                if (healed > 0) {
                    this.showHealBubble(healed, this.elements.macguffin);
                    this.renderMacGuffinHP();
                }
                console.log(`Event: healed MacGuffin for ${healed}`);
                setTimeout(() => this._processNextOutcome(), 800);
                break;
            }

            case 'damageMacGuffin': {
                const mg = this.combatState.macguffin;
                mg.currentHP = Math.max(0, mg.currentHP - outcome.value);
                this.showDamageBubble(outcome.value, this.elements.macguffin);
                this.renderMacGuffinHP();
                console.log(`Event: damaged MacGuffin for ${outcome.value}`);

                if (mg.currentHP <= 0) {
                    this.cleanupEvent();
                    this.onDefeat();
                    return;
                }
                setTimeout(() => this._processNextOutcome(), 800);
                break;
            }

            case 'healProtagonists':
                for (const prot of ['aldric', 'pip']) {
                    const state = this.combatState[prot];
                    const oldHP = state.currentHP;
                    state.currentHP = state.maxHP;
                    state.knockedOut = false;
                    const healed = state.currentHP - oldHP;
                    if (healed > 0) {
                        this.showHealBubble(healed, this.getTargetElement(prot));
                        this.renderProtagonistHP(prot);
                        this.renderKnockoutState(prot);
                    }
                }
                console.log('Event: healed both protagonists to full');
                setTimeout(() => this._processNextOutcome(), 800);
                break;

            case 'nextCombatModifier':
                Object.assign(this.nextCombatModifiers, outcome.modifier);
                console.log('Event: set next-combat modifiers', outcome.modifier);
                this._processNextOutcome();
                break;

            default:
                console.warn('Unknown event outcome type:', outcome.type);
                this._processNextOutcome();
                break;
        }
    },

    /**
     * Clean up all event UI state. Safe to call multiple times.
     */
    cleanupEvent() {
        this._clearEventBubbles();

        if (this.elements.eventStageTitle) {
            this.elements.eventStageTitle.style.display = 'none';
        }
        if (this.elements.eventStageChoices) {
            this.elements.eventStageChoices.style.display = 'none';
        }

        this.elements.container.classList.remove('event-active');
        this._currentEvent = null;
    },

    _clearEventBubbles() {
        if (this._eventBubbles) {
            this._eventBubbles.forEach(b => b.remove());
            this._eventBubbles = [];
        }
    }
});
