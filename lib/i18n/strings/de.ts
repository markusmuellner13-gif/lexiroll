export const de = {
  tagline: "Stadt · Land · Fluss",
  heroWords: ["Stadt.", "Land.", "Fluss."],

  common: {
    back: "Zurück",
    round: (n: number, total: number) => `Runde ${n}/${total}`,
    roundLong: (n: number, total: number) => `Runde ${n} von ${total}`,
    you: "Du",
    host: "Host",
    bot: "Bot",
    offline: "offline",
    letter: "Buchstabe",
    rolling: "Buchstabe wird gewürfelt…",
    syncing: "Synchronisiere…",
    cancel: "Abbrechen",
    language: "Sprache",
  },

  home: {
    intro:
      "Der Klassiker, neu gewürfelt. Eigene Kategorien, ein Buchstabenwürfel und Bots, die wirklich mitdenken — oder Freunde, egal wo sie gerade sind.",
    soloTitle: "Solo gegen Bots",
    soloDesc: "Sofort losspielen. Kein Account, keine Anmeldung, kein Internet nötig.",
    soloCta: "Spielen",
    friendsTitle: "Mit Freunden",
    friendsDesc: "Raum aufmachen, Code teilen, zusammen spielen — von überall, auf jedem Gerät.",
    friendsCta: "Raum erstellen",
    wins: (wins: number, games: number) => `${wins}/${games} gewonnen`,
    ruleDice: { title: "Würfel entscheidet", body: "Jede Runde würfelt die App einen neuen Buchstaben — keine Wiederholungen." },
    ruleCategories: { title: "Kategorien nach Wunsch", body: "Stadt, Land, Fluss … oder Pizzabelag. Die Bots stellen sich darauf ein." },
    ruleScoring: { title: "Klassische Wertung", body: "20 / 10 / 5 Punkte — und alle dürfen faule Antworten streichen." },
    footer: "Solo läuft komplett offline auf deinem Gerät.",
    rulesLink: "Regeln",
  },

  solo: {
    title: "Solo gegen Bots",
    opponents: "Gegner",
    opponentsHint: "So viele Bots spielen mit.",
    start: "Los geht's 🎲",
  },

  categories: {
    title: (n: number, max: number) => `Kategorien (${n}/${max})`,
    classic: "Klassiker",
    placeholder: "Eigene Kategorie, z.B. Pizzabelag",
    add: "Add",
    quickAdd: "Schnell hinzufügen",
    remove: (name: string) => `${name} entfernen`,
    legend: "heißt: die Bots haben echtes Wissen für diese Kategorie.",
    legendGuess: "heißt: sie raten — und du darfst ihre Antworten in der Prüfrunde streichen.",
    knownTitle: "Die Bots kennen diese Kategorie",
    guessTitle: "Die Bots raten hier",
  },

  settings: {
    title: "Spielregeln",
    rounds: "Runden",
    timePerRound: "Zeit pro Runde",
    botStrength: "Bot-Stärke",
    chill: "Chillig",
    normal: "Normal",
    brutal: "Brutal",
    stopButton: "Stopp-Knopf",
    stopHint: "Wer zuerst alles ausfüllt, beendet die Runde für alle.",
    stopHintForced: "Ohne Zeitlimit unverzichtbar — sonst endet die Runde nie.",
    soloBonus: "20 Punkte für Einzelkämpfer",
    soloBonusHint: "Als Einzige(r) mit einer Antwort gibt es doppelt.",
    hardLetters: "Fiese Buchstaben raus",
    hardLettersHint: (letters: string) => `Ohne ${letters}.`,
    summaryRounds: (n: number) => `${n} Runden`,
    summaryTime: (s: number) => `${s}s pro Runde`,
    summaryNoTime: "ohne Zeitlimit",
    summaryStop: "Stopp erlaubt",
    summaryNoStop: "kein Stopp",
    less: "weniger",
    more: "mehr",
  },

  play: {
    filled: (n: number, total: number) => `${n}/${total} ausgefüllt`,
    submit: "Abgeben",
    stop: "STOPP!",
    submitted: "Abgegeben — warte auf die anderen…",
    stoppedBy: (who: string) => `${who} hat gestoppt — Stifte fallen lassen!`,
    wrongLetter: (letter: string) => `beginnt nicht mit ${letter}`,
  },

  review: {
    title: "Antworten prüfen",
    hint: "Tippe auf eine Antwort, die du nicht gelten lässt. Gestrichen wird sie, wenn die Mehrheit der Mitspieler zustimmt.",
    strike: "streichen",
    struck: "gestrichen",
    wrongLetter: "falscher Buchstabe",
    done: "Passt so",
    waiting: "Warte auf die anderen…",
    progress: (done: number, total: number) => `${done}/${total} fertig`,
  },

  results: {
    roundPoints: "Punkte diese Runde",
    category: "Kategorie",
    total: "Gesamtstand",
    next: "Nächste Runde 🎲",
    waitHost: "Der Host startet die nächste Runde…",
    waitGeneric: "Warte auf den Host…",
  },

  final: {
    youWin: "Gewonnen!",
    someoneWins: (who: string) => `${who} gewinnt`,
    points: (n: number) => `${n} Punkte`,
    lead: (n: number) => `${n} Vorsprung`,
    rematch: "Revanche",
    toStart: "Zum Start",
    summary: (letter: string, rounds: number, cats: number) =>
      `Letzter Buchstabe: ${letter} · ${rounds} Runden · ${cats} Kategorien`,
    roomStays: (code: string) => `Raum ${code} bleibt offen — der Host kann eine Revanche starten.`,
  },

  playhub: {
    title: "Mit Freunden",
    offlineTitle: "Online-Modus ist gerade nicht verbunden.",
    offlineBody:
      "Für Runden mit Freunden braucht die App eine Datenbank (Turso). Solo gegen Bots funktioniert trotzdem jederzeit.",
    profileTitle: "Dein Gastprofil",
    profileHint:
      "Kein Account, kein Passwort — nur ein Name, damit deine Freunde wissen, wer da mitspielt. Er bleibt auf diesem Gerät gespeichert.",
    namePlaceholder: "Dein Name",
    createRoom: "Raum erstellen",
    creating: "Raum wird geöffnet…",
    joinTitle: "Raum beitreten",
    codePlaceholder: "CODE",
    go: "Los",
    needName: "Trag oben zuerst deinen Namen ein.",
    avatar: (emoji: string) => `Avatar ${emoji}`,
  },

  room: {
    lobby: "Lobby",
    code: "Raum-Code",
    invite: "Freunde einladen",
    copied: "Link kopiert ✓",
    shareText: (code: string) => `Spiel Lexiroll mit mir! Raum-Code: ${code}`,
    players: (n: number) => `Spieler (${n})`,
    addBot: "+ Bot",
    removeBot: "− Bot",
    kick: "kick",
    leave: "Raum verlassen",
    start: "Spiel starten 🎲",
    needPlayers: "Warte auf Mitspieler…",
    waitHost: "Warte auf den Host…",
    you: "(du)",
  },

  install: {
    iosHint: ["Tippe auf", "Teilen", "und dann", "Zum Home-Bildschirm", "— dann startet Lexiroll wie eine echte App."],
    question: "Lexiroll auf dem Homescreen installieren?",
    install: "Installieren",
    dismiss: "Hinweis ausblenden",
  },

  rules: {
    title: "Regeln",
    items: [
      {
        title: "Der Würfel bestimmt",
        body: "Jede Runde würfelt die App einen Buchstaben. Buchstaben, die schon dran waren, kommen nicht nochmal — und fiese Buchstaben kannst du komplett rauswerfen.",
      },
      {
        title: "Alle schreiben gleichzeitig",
        body: "Zu jeder Kategorie ein Wort, das mit dem Buchstaben beginnt. Ä zählt als A, Ö als O, Ü als U.",
      },
      {
        title: "Stopp beendet die Runde",
        body: "Wer als Erster alles ausgefüllt hat, darf STOPP drücken. Alle anderen haben dann noch drei Sekunden.",
      },
      {
        title: "Punkte",
        body: "20 Punkte, wenn du als Einzige(r) etwas hast. 10 Punkte für eine Antwort, die sonst niemand hatte. 5 Punkte, wenn ihr dasselbe geschrieben habt. 0 für leer, falschen Buchstaben oder gestrichen.",
      },
      {
        title: "Prüfrunde",
        body: "Nach jeder Runde sieht jeder alle Antworten und darf zweifelhafte streichen. Gestrichen wird, was die Mehrheit der Mitspieler streicht — auch bei Bots.",
      },
      {
        title: "Eigene Kategorien",
        body: "Du kannst jede Kategorie ersetzen oder eigene erfinden. Für bekannte Kategorien haben die Bots echtes Wissen; für neue lernen sie dazu, und wo sie raten, erkennst du das am 🤖?-Symbol.",
      },
      {
        title: "Solo und mit Freunden",
        body: "Solo läuft komplett auf deinem Gerät — ohne Anmeldung, ohne Internet. Für Runden mit Freunden reicht ein Name: Raum aufmachen, Code teilen, fertig.",
      },
    ],
  },

  errors: {
    NO_DB: "Der Online-Modus ist gerade nicht verbunden.",
    ROOM_NOT_FOUND: "Diesen Raum gibt es nicht (mehr).",
    ROOM_EXPIRED: "Dieser Raum ist abgelaufen.",
    ROOM_FULL: "Der Raum ist voll (10 Spieler).",
    GAME_RUNNING: "Die Runde läuft schon — warte, bis sie vorbei ist.",
    ROUND_RUNNING: "Die Runde läuft noch.",
    NOT_IN_ROOM: "Du bist nicht in diesem Raum.",
    HOST_ONLY: "Nur der Host darf das.",
    LOBBY_ONLY: "Das geht nur in der Lobby.",
    NO_BOTS_LEFT: "Keine Bots mehr übrig.",
    CANT_KICK_HOST: "Der Host kann sich nicht selbst kicken.",
    NEED_PLAYERS: "Mindestens 2 Spieler (Bots zählen mit).",
    GAME_OVER: "Das Spiel ist vorbei.",
    NO_OWN_VETO: "Eigene Antworten kannst du nicht streichen.",
    CODE_FAILED: "Konnte keinen freien Raumcode finden. Nochmal versuchen.",
    NO_CONNECTION: "Keine Verbindung. Versuche es nochmal.",
    GENERIC: "Da ist etwas schiefgelaufen.",
  },
};

export type Strings = typeof de;
