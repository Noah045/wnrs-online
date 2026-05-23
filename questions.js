// Original question decks inspired by the WNRS format.
// Three levels, each deeper than the last.

const LEVELS = [
  {
    id: 1,
    name: "Perception",
    tagline: "First impressions, gentle ground.",
    color: "#f0d8c8",
    accent: "#b94a3d",
    questions: [
      "What's the first thing you noticed about the other player(s) here?",
      "If you had to describe your mood today as a weather forecast, what would it be?",
      "What's a small thing that made you smile this week?",
      "What's something you're currently looking forward to?",
      "What song have you had on repeat lately, and why?",
      "What's the most-used app on your phone — and what does that say about you?",
      "If we were meeting in person, where would you take me?",
      "What's a compliment you've received that stuck with you?",
      "What's something you're proud of that you rarely get to talk about?",
      "What kind of friend are you to your friends?",
      "What's an unpopular opinion you'll defend?",
      "What were you like as a kid?",
      "What's something you used to believe that you don't anymore?",
      "What's a small ritual that grounds you?",
      "What part of your day do you most look forward to?",
      "What's a place that always feels like home to you?",
      "What three words would your closest friend use to describe you?",
      "What's something you're surprisingly good at?",
      "What's the best piece of advice you've ever ignored?",
      "What do you find easy that most people find hard?",
      "What's your idea of a perfect Sunday?",
      "What's something most people don't know about you, but isn't a secret?",
      "If your life right now were a chapter title, what would it be?",
      "What's a recent moment you'd call genuinely peaceful?",
      "What's a question you wish people asked you more often?"
    ],
    wildcards: [
      "Maintain eye contact for 15 seconds with the next person to answer.",
      "Compliment the player who answered last — something specific.",
      "Skip your next turn — or use it to ask anyone any question.",
      "Everyone answers the next question."
    ]
  },
  {
    id: 2,
    name: "Connection",
    tagline: "Past the small talk. Real territory.",
    color: "#e8b8a8",
    accent: "#a8392c",
    questions: [
      "When was the last time you cried, and what was it about?",
      "What part of yourself are you still learning to accept?",
      "What's something you're afraid people will find out about you?",
      "What's a moment that changed the way you see yourself?",
      "Who in your life do you miss right now?",
      "What's something you've forgiven yourself for? What's something you haven't?",
      "When do you feel the most lonely?",
      "What do you wish your younger self knew?",
      "What's a relationship in your life that needs work, and why haven't you started?",
      "What's a compliment you struggle to accept?",
      "What's something you pretend to understand but don't?",
      "When was the last time you felt truly seen?",
      "What's a regret you don't talk about?",
      "What's a fear that's been quietly running your life?",
      "Who do you envy, and what does that envy tell you?",
      "What's the hardest truth you've had to tell yourself recently?",
      "What part of your past still has a grip on you?",
      "What's something you're grieving that isn't a death?",
      "What kind of love do you find hardest to receive?",
      "What's a thing you've been avoiding doing — and what's underneath that avoidance?",
      "What does loneliness feel like, in your body?",
      "What's a story you tell about yourself that might not be true anymore?",
      "What do you do when you're disappointed in yourself?",
      "What's something you've never said out loud?",
      "When you imagine your life a year from now, what scares you about it?"
    ],
    wildcards: [
      "Tell the other player one specific thing you appreciate about them so far.",
      "Reveal something small you'd normally keep to yourself.",
      "Ask the next player a follow-up question instead of drawing a card.",
      "Pause for 30 seconds. Just sit with each other. Then continue."
    ]
  },
  {
    id: 3,
    name: "Reflection",
    tagline: "Honest, vulnerable, no take-backs.",
    color: "#c8483a",
    accent: "#5a1a14",
    questions: [
      "What's your first real impression of me, now that we've talked?",
      "What do you think I'm afraid of?",
      "What do you think I most want to be loved for?",
      "What's something you sense about me that I haven't said?",
      "Where do you think I'm being hardest on myself?",
      "What do you hope I take away from this conversation?",
      "What's one thing you'd want me to remember about you?",
      "Is there anything you'd want to ask me that you've been holding back?",
      "What part of me feels familiar to you?",
      "What's something kind you'd say about me to someone who'd never met me?",
      "If we'd grown up together, what do you think we would have been to each other?",
      "What do you think I deserve more of in my life?",
      "What do you think is the bravest thing I've shared tonight?",
      "What's something you wish I believed about myself?",
      "Has anything I said tonight surprised you about yourself?",
      "Where do you sense I'm protecting myself?",
      "What's something you'd want to thank me for, even if it's small?",
      "What do you think we have in common that surprises you?",
      "What's a question you'd want me to ask you that I haven't?",
      "What do you want to be true about me, even though you don't know me well?",
      "What's something you'll think about tomorrow, from tonight?",
      "What do you want to leave unsaid between us, and why?",
      "What does it mean to you that we did this?",
      "How are you different now than when we started?",
      "If this were the last conversation we ever had — what would you want me to know?"
    ],
    wildcards: [
      "Look at the other player for 30 seconds without speaking, then continue.",
      "Write down one thing you'll remember from tonight before drawing the next card.",
      "Say one thing you appreciate about each player in this room.",
      "Ask the most honest question you can think of, off-card."
    ]
  }
];

function buildDeck(levelIndex) {
  const level = LEVELS[levelIndex];
  const cards = [];
  level.questions.forEach((q, i) => cards.push({ type: "question", text: q, id: `L${level.id}-Q${i}` }));
  level.wildcards.forEach((w, i) => cards.push({ type: "wildcard", text: w, id: `L${level.id}-W${i}` }));
  // shuffle (Fisher-Yates) but keep wildcards from clustering: interleave roughly
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function getLevelMeta(levelIndex) {
  const l = LEVELS[levelIndex];
  return { id: l.id, name: l.name, tagline: l.tagline, color: l.color, accent: l.accent };
}

module.exports = { LEVELS, buildDeck, getLevelMeta };
