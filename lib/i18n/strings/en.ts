import type { Strings } from "./de";

export const en: Strings = {
  tagline: "City · Country · River",
  heroWords: ["City.", "Country.", "River."],

  common: {
    back: "Back",
    round: (n, total) => `Round ${n}/${total}`,
    roundLong: (n, total) => `Round ${n} of ${total}`,
    you: "You",
    host: "Host",
    bot: "Bot",
    offline: "offline",
    letter: "Letter",
    rolling: "Rolling the letter…",
    syncing: "Syncing…",
    cancel: "Cancel",
    language: "Language",
  },

  home: {
    intro:
      "The classic, freshly rolled. Your own categories, a letter die and bots that actually think — or friends, wherever they happen to be.",
    soloTitle: "Solo vs bots",
    soloDesc: "Start right now. No account, no sign-up, no connection needed.",
    soloCta: "Play",
    friendsTitle: "With friends",
    friendsDesc: "Open a room, share the code, play together — from anywhere, on any device.",
    friendsCta: "Create a room",
    wins: (wins, games) => `${wins}/${games} won`,
    ruleDice: { title: "The die decides", body: "Every round the app rolls a fresh letter — never the same one twice." },
    ruleCategories: { title: "Any categories you like", body: "City, country, river … or pizza topping. The bots adapt." },
    ruleScoring: { title: "Classic scoring", body: "20 / 10 / 5 points — and everyone gets to strike out lazy answers." },
    footer: "Solo runs entirely offline on your device.",
    rulesLink: "Rules",
  },

  solo: {
    title: "Solo vs bots",
    opponents: "Opponents",
    opponentsHint: "How many bots join the game.",
    start: "Let's go 🎲",
  },

  categories: {
    title: (n, max) => `Categories (${n}/${max})`,
    classic: "Classics",
    placeholder: "Your own category, e.g. pizza topping",
    add: "Add",
    quickAdd: "Quick add",
    remove: (name) => `Remove ${name}`,
    legend: "means the bots have real knowledge for this category.",
    legendGuess: "means they are guessing — and you can strike their answers in the review phase.",
    knownTitle: "The bots know this category",
    guessTitle: "The bots are guessing here",
  },

  settings: {
    title: "Rules",
    rounds: "Rounds",
    timePerRound: "Time per round",
    botStrength: "Bot strength",
    chill: "Chill",
    normal: "Normal",
    brutal: "Brutal",
    stopButton: "Stop button",
    stopHint: "Whoever fills everything in first ends the round for everyone.",
    stopHintForced: "Essential without a timer — otherwise the round never ends.",
    soloBonus: "20 points for a lone answer",
    soloBonusHint: "Being the only one with an answer pays double.",
    hardLetters: "Drop the nasty letters",
    hardLettersHint: (letters) => `Without ${letters}.`,
    summaryRounds: (n) => `${n} rounds`,
    summaryTime: (s) => `${s}s per round`,
    summaryNoTime: "no time limit",
    summaryStop: "stop allowed",
    summaryNoStop: "no stop",
    less: "less",
    more: "more",
  },

  play: {
    filled: (n, total) => `${n}/${total} filled in`,
    submit: "Hand in",
    stop: "STOP!",
    submitted: "Handed in — waiting for the others…",
    stoppedBy: (who) => `${who} hit stop — pens down!`,
    wrongLetter: (letter) => `does not start with ${letter}`,
  },

  review: {
    title: "Check the answers",
    hint: "Tap any answer you would not accept. It only gets struck if most of the other players agree.",
    strike: "strike",
    struck: "struck",
    wrongLetter: "wrong letter",
    done: "Looks good",
    waiting: "Waiting for the others…",
    progress: (done, total) => `${done}/${total} done`,
  },

  results: {
    roundPoints: "Points this round",
    category: "Category",
    total: "Standings",
    next: "Next round 🎲",
    waitHost: "The host starts the next round…",
    waitGeneric: "Waiting for the host…",
  },

  final: {
    youWin: "You win!",
    someoneWins: (who) => `${who} wins`,
    points: (n) => `${n} points`,
    lead: (n) => `${n} ahead`,
    rematch: "Rematch",
    toStart: "Back to start",
    summary: (letter, rounds, cats) => `Last letter: ${letter} · ${rounds} rounds · ${cats} categories`,
    roomStays: (code) => `Room ${code} stays open — the host can start a rematch.`,
  },

  playhub: {
    title: "With friends",
    offlineTitle: "Online play is not connected right now.",
    offlineBody:
      "Rounds with friends need a database (Turso). Solo against bots works regardless, any time.",
    profileTitle: "Your guest profile",
    profileHint:
      "No account, no password — just a name so your friends know who they are playing. It stays on this device.",
    namePlaceholder: "Your name",
    createRoom: "Create a room",
    creating: "Opening the room…",
    joinTitle: "Join a room",
    codePlaceholder: "CODE",
    go: "Go",
    needName: "Enter your name above first.",
    avatar: (emoji) => `Avatar ${emoji}`,
  },

  room: {
    lobby: "Lobby",
    code: "Room code",
    invite: "Invite friends",
    copied: "Link copied ✓",
    shareText: (code) => `Play Lexiroll with me! Room code: ${code}`,
    players: (n) => `Players (${n})`,
    addBot: "+ Bot",
    removeBot: "− Bot",
    kick: "kick",
    leave: "Leave the room",
    start: "Start the game 🎲",
    needPlayers: "Waiting for players…",
    waitHost: "Waiting for the host…",
    you: "(you)",
  },

  install: {
    iosHint: ["Tap", "Share", "and then", "Add to Home Screen", "— Lexiroll then starts like a real app."],
    question: "Install Lexiroll on your home screen?",
    install: "Install",
    dismiss: "Dismiss",
  },

  rules: {
    title: "Rules",
    items: [
      {
        title: "The die decides",
        body: "Every round the app rolls a letter. Letters that already came up will not repeat — and you can throw the nasty ones out entirely.",
      },
      {
        title: "Everyone writes at once",
        body: "One word per category, starting with that letter. Accents do not matter: Ä counts as A, Ö as O, Ü as U.",
      },
      {
        title: "Stop ends the round",
        body: "Whoever fills everything in first may hit STOP. Everyone else gets three more seconds.",
      },
      {
        title: "Points",
        body: "20 points if you are the only one with an answer. 10 points for an answer nobody else had. 5 points if you wrote the same thing. 0 for empty, wrong letter or struck out.",
      },
      {
        title: "Review phase",
        body: "After each round everyone sees every answer and may strike the dubious ones. An answer goes only if most of the other players strike it — bots included.",
      },
      {
        title: "Your own categories",
        body: "Replace any category or invent your own. For known categories the bots have real knowledge; for new ones they learn, and where they are guessing you will see the 🤖? mark.",
      },
      {
        title: "Solo and with friends",
        body: "Solo runs entirely on your device — no sign-up, no connection. For rounds with friends a name is enough: open a room, share the code, done.",
      },
    ],
  },

  errors: {
    NO_DB: "Online play is not connected right now.",
    ROOM_NOT_FOUND: "That room does not exist (any more).",
    ROOM_EXPIRED: "This room has expired.",
    ROOM_FULL: "The room is full (10 players).",
    GAME_RUNNING: "The game is already running — wait until it is over.",
    ROUND_RUNNING: "The round is still running.",
    NOT_IN_ROOM: "You are not in this room.",
    HOST_ONLY: "Only the host can do that.",
    LOBBY_ONLY: "That only works in the lobby.",
    NO_BOTS_LEFT: "No bots left.",
    CANT_KICK_HOST: "The host cannot kick themselves.",
    NEED_PLAYERS: "At least 2 players (bots count).",
    GAME_OVER: "The game is over.",
    NO_OWN_VETO: "You cannot strike your own answers.",
    CODE_FAILED: "Could not find a free room code. Try again.",
    NO_CONNECTION: "No connection. Give it another go.",
    GENERIC: "Something went wrong.",
  },
};
