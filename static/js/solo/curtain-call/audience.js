/**
 * Curtain Call — Audience System
 *
 * Audience member type data and animation methods
 * (generation, bobbing, waves, tutorial hints, reactions).
 *
 * Data constants are global; animation methods extend
 * CurtainCallGame.prototype (loaded after game.js).
 */

'use strict';

const AUDIENCE_TYPES = {
    basic: {
        id: 'basic',
        svg: '/static/svg/audience/basic.svg',
        bobCount: 1,
        scale: 1.0,
        isChild: false
    },
    tophat: {
        id: 'tophat',
        svg: '/static/svg/audience/tophat.svg',
        bobCount: 1,  // Dignified, single nod
        scale: 1.0,
        isChild: false
    },
    bowler: {
        id: 'bowler',
        svg: '/static/svg/audience/bowler.svg',
        bobCount: 2,  // Polite double-nod
        scale: 1.0,
        isChild: false
    },
    cap: {
        id: 'cap',
        svg: '/static/svg/audience/cap.svg',
        bobCount: 3,  // Enthusiastic casual fan
        scale: 1.0,
        isChild: false
    },
    ponytail: {
        id: 'ponytail',
        svg: '/static/svg/audience/ponytail.svg',
        bobCount: 2,
        scale: 1.0,
        isChild: false
    },
    bun: {
        id: 'bun',
        svg: '/static/svg/audience/bun.svg',
        bobCount: 1,  // Elegant, restrained
        scale: 1.0,
        isChild: false
    },
    afro: {
        id: 'afro',
        svg: '/static/svg/audience/afro.svg',
        bobCount: 3,  // Grooving along
        scale: 1.0,
        isChild: false
    },
    mohawk: {
        id: 'mohawk',
        svg: '/static/svg/audience/mohawk.svg',
        bobCount: 4,  // Headbanger
        scale: 1.0,
        isChild: false
    },
    cowboy: {
        id: 'cowboy',
        svg: '/static/svg/audience/cowboy.svg',
        bobCount: 1,  // Cool, collected tip of the hat
        scale: 1.0,
        isChild: false
    },
    fancyhat: {
        id: 'fancyhat',
        svg: '/static/svg/audience/fancyhat.svg',
        bobCount: 1,  // Refined
        scale: 1.0,
        isChild: false
    },
    boy: {
        id: 'boy',
        svg: '/static/svg/audience/boy.svg',
        bobCount: 5,  // Kids are excitable!
        scale: 0.75,
        isChild: true
    },
    girl: {
        id: 'girl',
        svg: '/static/svg/audience/girl.svg',
        bobCount: 5,  // Kids are excitable!
        scale: 0.75,
        isChild: true
    },
    glasses: {
        id: 'glasses',
        svg: '/static/svg/audience/glasses.svg',
        bobCount: 2,  // Thoughtful nodding
        scale: 1.0,
        isChild: false
    },
    bald: {
        id: 'bald',
        svg: '/static/svg/audience/bald.svg',
        bobCount: 2,
        scale: 1.0,
        isChild: false
    },
    messy: {
        id: 'messy',
        svg: '/static/svg/audience/messy.svg',
        bobCount: 4,  // Wild and energetic
        scale: 1.0,
        isChild: false
    },
    beanie: {
        id: 'beanie',
        svg: '/static/svg/audience/beanie.svg',
        bobCount: 3,
        scale: 1.0,
        isChild: false
    },
    longhair: {
        id: 'longhair',
        svg: '/static/svg/audience/longhair.svg',
        bobCount: 2,
        scale: 1.0,
        isChild: false
    },
    bowtie: {
        id: 'bowtie',
        svg: '/static/svg/audience/bowtie.svg',
        bobCount: 1,  // Dapper, refined
        scale: 1.0,
        isChild: false
    },
    crown: {
        id: 'crown',
        svg: '/static/svg/audience/crown.svg',
        bobCount: 1,  // Royal, barely deigns to nod
        scale: 1.0,
        isChild: false
    }
};

// Derived lists for random selection
const AUDIENCE_TYPE_LIST = Object.values(AUDIENCE_TYPES);
const ADULT_AUDIENCE_TYPES = AUDIENCE_TYPE_LIST.filter(t => !t.isChild);
const CHILD_AUDIENCE_TYPES = AUDIENCE_TYPE_LIST.filter(t => t.isChild);

// === Audience Animation Methods ===
// These extend the game class prototype (game.js must be loaded first).

if (typeof CurtainCallGame !== 'undefined') {
    Object.assign(CurtainCallGame.prototype, {

        initializeAnimations() {
            // Generate audience with positioning algorithm
            this.generateAudience();

            // Schedule occasional wave (every 20-40 seconds)
            this.scheduleAudienceWave();

            // Initialize protagonists with random animation delays
            if (this.elements.heroAldric) {
                const aldricDelay = Math.random() * 3;
                this.elements.heroAldric.style.animationDelay = `-${aldricDelay}s`;
            }

            if (this.elements.heroPip) {
                const pipDelay = Math.random() * 2.2;
                this.elements.heroPip.style.animationDelay = `-${pipDelay}s`;
            }

            // Also randomize enemy animation delay
            if (this.elements.enemyPuppet) {
                const enemyDelay = Math.random() * 2.5;
                this.elements.enemyPuppet.style.animationDelay = `-${enemyDelay}s`;
            }
        },

        generateAudience() {
            const strip = document.getElementById('audience-strip');
            if (!strip) return;

            // Clear existing audience members
            strip.innerHTML = '';
            this.audienceMembers = [];
            this.audienceTimers = [];

            // Y positions for rows 1-5 (1=front/bottom, 5=back/top)
            // More spread out to use vertical space
            const yPositions = {
                1: 5,    // Front row
                2: 22,   //
                3: 40,   // Middle
                4: 58,   //
                5: 76    // Back row
            };

            // X positions for 6 columns
            const xPositions = [0, 38, 76, 114, 152, 190];

            // Pair configurations: [row1, row2]
            const pairConfigs = [
                [1, 4],
                [1, 5],
                [2, 5]
            ];

            // Single person row options
            const singleRows = [2, 3, 4];

            let memberIndex = 0;

            // For each X position (column)
            xPositions.forEach((xPos, colIndex) => {
                const hasTwoPeople = Math.random() < 0.5;

                if (hasTwoPeople) {
                    // Pick a pair configuration
                    const pairConfig = pairConfigs[Math.floor(Math.random() * pairConfigs.length)];

                    pairConfig.forEach(row => {
                        const member = this.createAudienceMember(xPos, yPositions[row], row, memberIndex);
                        strip.appendChild(member);
                        this.audienceMembers.push(member);
                        this.scheduleAudienceBob(member, memberIndex);
                        memberIndex++;
                    });
                } else {
                    // Single person in middle rows
                    const row = singleRows[Math.floor(Math.random() * singleRows.length)];
                    const member = this.createAudienceMember(xPos, yPositions[row], row, memberIndex);
                    strip.appendChild(member);
                    this.audienceMembers.push(member);
                    this.scheduleAudienceBob(member, memberIndex);
                    memberIndex++;
                }
            });
        },

        createAudienceMember(xPos, yPos, row, index) {
            const member = document.createElement('div');
            member.className = `audience-member row-${row}`;
            member.dataset.index = index;
            member.dataset.row = row;

            // Pick a random audience type
            // 15% chance for a child in front rows (1-2), otherwise adult
            let audienceType;
            if (row <= 2 && Math.random() < 0.15 && CHILD_AUDIENCE_TYPES.length > 0) {
                audienceType = CHILD_AUDIENCE_TYPES[Math.floor(Math.random() * CHILD_AUDIENCE_TYPES.length)];
            } else {
                audienceType = ADULT_AUDIENCE_TYPES[Math.floor(Math.random() * ADULT_AUDIENCE_TYPES.length)];
            }

            member.dataset.type = audienceType.id;
            member.dataset.bobCount = audienceType.bobCount;

            // Set position via CSS variables
            member.style.setProperty('--pos-x', `${xPos}px`);
            member.style.setProperty('--pos-y', `${yPos}px`);

            // Apply scale for children
            if (audienceType.isChild) {
                member.classList.add('child');
                member.style.setProperty('--member-scale', audienceType.scale);
            }

            // Create the SVG image
            const img = document.createElement('img');
            img.src = audienceType.svg;
            img.alt = audienceType.id;
            img.className = 'audience-svg';
            img.draggable = false;
            member.appendChild(img);

            return member;
        },

        scheduleAudienceBob(member, index) {
            // Random interval between 5-15 seconds before next bob
            const interval = 5000 + Math.random() * 10000;

            const timerId = setTimeout(() => {
                // Don't bob if currently doing wave
                if (member.classList.contains('audience-wave')) {
                    this.scheduleAudienceBob(member, index);
                    return;
                }

                // Get bob count from personality
                const bobCount = parseInt(member.dataset.bobCount) || 1;

                // Trigger the bob animation with appropriate class
                let bobClass;
                if (bobCount >= 4) {
                    bobClass = 'audience-bob-4';
                } else if (bobCount >= 3) {
                    bobClass = 'audience-bob-3';
                } else if (bobCount >= 2) {
                    bobClass = 'audience-bob-2';
                } else {
                    bobClass = 'audience-bob-1';
                }
                member.classList.add(bobClass);

                // Remove class after animation completes (200ms per bob + buffer)
                const duration = bobCount * 200 + 100;
                setTimeout(() => {
                    member.classList.remove(bobClass);
                }, duration);

                // Schedule next bob
                this.scheduleAudienceBob(member, index);
            }, interval);

            this.audienceTimers[index] = timerId;
        },

        scheduleAudienceWave() {
            // Wave or tutorial hint every 20-40 seconds
            const interval = 20000 + Math.random() * 20000;

            this.waveTimer = setTimeout(() => {
                // 60% chance of wave, 40% chance of tutorial hint
                if (Math.random() < 0.6) {
                    this.triggerAudienceWave();
                } else {
                    this.triggerRandomTutorialHint();
                }
                this.scheduleAudienceWave();
            }, interval);
        },

        triggerAudienceWave() {
            // Sort members by X position for wave effect
            const sortedMembers = [...this.audienceMembers].sort((a, b) => {
                const xA = parseInt(a.style.getPropertyValue('--pos-x'));
                const xB = parseInt(b.style.getPropertyValue('--pos-x'));
                return xA - xB;
            });

            sortedMembers.forEach((member, index) => {
                // Stagger the wave from left to right
                const delay = index * 0.08; // 80ms between each member
                member.style.setProperty('--wave-delay', `${delay}s`);
                member.classList.add('audience-wave');

                // Remove wave class after animation
                setTimeout(() => {
                    member.classList.remove('audience-wave');
                }, 600 + delay * 1000);
            });
        },

        triggerRandomTutorialHint() {
            // Pick a random keyword from the glossary
            const keywords = Object.keys(KEYWORD_GLOSSARY);
            const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
            const glossaryEntry = KEYWORD_GLOSSARY[randomKeyword];

            if (!glossaryEntry || !glossaryEntry.hints || glossaryEntry.hints.length === 0) return;

            // Pick a random hint for this keyword
            const randomHint = glossaryEntry.hints[Math.floor(Math.random() * glossaryEntry.hints.length)];

            // Get a random audience member
            const audienceMembers = this.getRandomAudienceMembers(1);
            if (audienceMembers.length === 0) return;

            // Show the hint with the icon
            const bubbleText = `${glossaryEntry.icon} ${randomHint}`;

            // Create a tutorial hint bubble (slightly different style)
            const bubble = document.createElement('div');
            bubble.className = 'audience-bubble tutorial-hint';
            bubble.textContent = bubbleText;

            const member = audienceMembers[0];
            const memberRect = member.getBoundingClientRect();
            const containerRect = this.elements.container.getBoundingClientRect();

            // Calculate left position, clamping to stay within container
            const rawLeft = memberRect.left - containerRect.left + memberRect.width / 2;
            const minLeft = 110;
            const maxLeft = containerRect.width - 110;
            const clampedLeft = Math.max(minLeft, Math.min(maxLeft, rawLeft));

            bubble.style.left = `${clampedLeft}px`;
            bubble.style.bottom = `${containerRect.bottom - memberRect.top + 10}px`;

            this.elements.container.appendChild(bubble);

            // Animate in
            requestAnimationFrame(() => {
                bubble.classList.add('visible');
            });

            // Remove after 5 seconds
            setTimeout(() => {
                bubble.classList.remove('visible');
                setTimeout(() => bubble.remove(), 300);
            }, 5000);
        },

        // Public method to trigger reactions on special events
        triggerAudienceReaction(type) {
            if (type === undefined) type = 'wave';
            if (type === 'wave') {
                this.triggerAudienceWave();
            } else if (type === 'excited') {
                this.audienceMembers.forEach(member => {
                    member.classList.add('audience-excited');
                    setTimeout(() => member.classList.remove('audience-excited'), 400);
                });
            } else if (type === 'worried') {
                this.audienceMembers.forEach(member => {
                    member.classList.add('audience-worried');
                    setTimeout(() => member.classList.remove('audience-worried'), 500);
                });
            }
        }
    });
}
