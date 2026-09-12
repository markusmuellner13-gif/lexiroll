import type { Strings } from "./de";

export const it: Strings = {
  tagline: "Nomi · Cose · Città",
  heroWords: ["Nomi.", "Cose.", "Città."],

  common: {
    back: "Indietro",
    round: (n, total) => `Turno ${n}/${total}`,
    roundLong: (n, total) => `Turno ${n} di ${total}`,
    you: "Tu",
    host: "Host",
    bot: "Bot",
    offline: "offline",
    letter: "Lettera",
    rolling: "Sto tirando la lettera…",
    syncing: "Sincronizzo…",
    cancel: "Annulla",
    language: "Lingua",
  },

  home: {
    intro:
      "Il classico, tirato a sorte. Categorie tue, un dado delle lettere e bot che ragionano davvero — oppure gli amici, ovunque si trovino.",
    soloTitle: "Da solo contro i bot",
    soloDesc: "Si gioca subito. Niente account, niente registrazione, niente internet.",
    soloCta: "Gioca",
    friendsTitle: "Con gli amici",
    friendsDesc: "Apri una stanza, condividi il codice, giocate insieme — ovunque, su qualsiasi dispositivo.",
    friendsCta: "Crea una stanza",
    wins: (wins, games) => `${wins}/${games} vinte`,
    ruleDice: { title: "Decide il dado", body: "Ogni turno l'app tira una lettera nuova — mai due volte la stessa." },
    ruleCategories: { title: "Categorie come vuoi tu", body: "Nomi, cose, città … o condimento della pizza. I bot si adattano." },
    ruleScoring: { title: "Punteggio classico", body: "20 / 10 / 5 punti — e tutti possono cancellare le risposte furbe." },
    footer: "Da solo funziona completamente offline sul tuo dispositivo.",
    rulesLink: "Regole",
  },

  solo: {
    title: "Da solo contro i bot",
    opponents: "Avversari",
    opponentsHint: "Quanti bot giocano con te.",
    start: "Si parte 🎲",
  },

  categories: {
    title: (n, max) => `Categorie (${n}/${max})`,
    classic: "Classiche",
    placeholder: "Categoria tua, es. condimento pizza",
    add: "Aggiungi",
    quickAdd: "Aggiunta rapida",
    remove: (name) => `Rimuovi ${name}`,
    legend: "significa che i bot hanno conoscenze vere per questa categoria.",
    legendGuess: "significa che tirano a indovinare — e nella verifica puoi cancellare le loro risposte.",
    knownTitle: "I bot conoscono questa categoria",
    guessTitle: "Qui i bot tirano a indovinare",
  },

  settings: {
    title: "Regole di gioco",
    rounds: "Turni",
    timePerRound: "Tempo per turno",
    botStrength: "Forza dei bot",
    chill: "Tranquilla",
    normal: "Normale",
    brutal: "Brutale",
    stopButton: "Pulsante Stop",
    stopHint: "Chi riempie tutto per primo chiude il turno per tutti.",
    stopHintForced: "Indispensabile senza limite di tempo — altrimenti il turno non finisce mai.",
    soloBonus: "20 punti se sei l'unico",
    soloBonusHint: "Essere l'unico con una risposta vale il doppio.",
    hardLetters: "Via le lettere scomode",
    hardLettersHint: (letters) => `Senza ${letters}.`,
    summaryRounds: (n) => `${n} turni`,
    summaryTime: (s) => `${s}s per turno`,
    summaryNoTime: "senza limite di tempo",
    summaryStop: "stop permesso",
    summaryNoStop: "niente stop",
    less: "meno",
    more: "più",
  },

  play: {
    filled: (n, total) => `${n}/${total} compilate`,
    submit: "Consegna",
    stop: "STOP!",
    submitted: "Consegnato — aspetta gli altri…",
    stoppedBy: (who) => `${who} ha fatto stop — penne giù!`,
    wrongLetter: (letter) => `non inizia per ${letter}`,
  },

  review: {
    title: "Verifica le risposte",
    hint: "Tocca una risposta che non accetti. Viene cancellata solo se la maggioranza degli altri è d'accordo.",
    strike: "cancella",
    struck: "cancellata",
    wrongLetter: "lettera sbagliata",
    done: "Per me va bene",
    waiting: "Aspetto gli altri…",
    progress: (done, total) => `${done}/${total} pronti`,
  },

  results: {
    roundPoints: "Punti di questo turno",
    category: "Categoria",
    total: "Classifica",
    next: "Prossimo turno 🎲",
    waitHost: "L'host avvia il prossimo turno…",
    waitGeneric: "Aspetto l'host…",
  },

  final: {
    youWin: "Hai vinto!",
    someoneWins: (who) => `Vince ${who}`,
    points: (n) => `${n} punti`,
    lead: (n) => `${n} di vantaggio`,
    rematch: "Rivincita",
    toStart: "Torna all'inizio",
    summary: (letter, rounds, cats) => `Ultima lettera: ${letter} · ${rounds} turni · ${cats} categorie`,
    roomStays: (code) => `La stanza ${code} resta aperta — l'host può avviare la rivincita.`,
  },

  playhub: {
    title: "Con gli amici",
    offlineTitle: "La modalità online non è collegata al momento.",
    offlineBody:
      "Per giocare con gli amici serve un database (Turso). Da solo contro i bot funziona comunque, sempre.",
    profileTitle: "Il tuo profilo ospite",
    profileHint:
      "Niente account, niente password — solo un nome, così gli amici sanno chi sta giocando. Resta su questo dispositivo.",
    namePlaceholder: "Il tuo nome",
    createRoom: "Crea una stanza",
    creating: "Apro la stanza…",
    joinTitle: "Entra in una stanza",
    codePlaceholder: "CODICE",
    go: "Vai",
    needName: "Scrivi prima il tuo nome qui sopra.",
    avatar: (emoji) => `Avatar ${emoji}`,
  },

  room: {
    lobby: "Sala d'attesa",
    code: "Codice stanza",
    invite: "Invita gli amici",
    copied: "Link copiato ✓",
    shareText: (code) => `Gioca a Lexiroll con me! Codice stanza: ${code}`,
    players: (n) => `Giocatori (${n})`,
    addBot: "+ Bot",
    removeBot: "− Bot",
    kick: "espelli",
    leave: "Esci dalla stanza",
    start: "Inizia la partita 🎲",
    needPlayers: "Aspetto altri giocatori…",
    waitHost: "Aspetto l'host…",
    you: "(tu)",
  },

  install: {
    iosHint: ["Tocca", "Condividi", "e poi", "Aggiungi a Home", "— così Lexiroll parte come una vera app."],
    question: "Installare Lexiroll sulla schermata Home?",
    install: "Installa",
    dismiss: "Nascondi",
  },

  rules: {
    title: "Regole",
    items: [
      {
        title: "Decide il dado",
        body: "Ogni turno l'app tira una lettera. Le lettere già uscite non tornano — e quelle scomode puoi toglierle del tutto.",
      },
      {
        title: "Si scrive tutti insieme",
        body: "Una parola per categoria, che inizi con quella lettera. Gli accenti non contano.",
      },
      {
        title: "Lo stop chiude il turno",
        body: "Chi riempie tutto per primo può premere STOP. Gli altri hanno ancora tre secondi.",
      },
      {
        title: "Punti",
        body: "20 punti se sei l'unico ad avere una risposta. 10 punti per una risposta che non ha nessun altro. 5 punti se avete scritto la stessa cosa. 0 se è vuota, con la lettera sbagliata o cancellata.",
      },
      {
        title: "Verifica",
        body: "Dopo ogni turno tutti vedono tutte le risposte e possono cancellare quelle dubbie. Viene tolta solo se la maggioranza degli altri la cancella — bot compresi.",
      },
      {
        title: "Categorie tue",
        body: "Puoi sostituire ogni categoria o inventarne di nuove. Per quelle note i bot hanno conoscenze vere; per le nuove imparano, e dove tirano a indovinare lo vedi dal simbolo 🤖?.",
      },
      {
        title: "Da solo e con gli amici",
        body: "Da solo gira tutto sul tuo dispositivo — senza registrazione, senza internet. Per giocare con gli amici basta un nome: apri una stanza, condividi il codice, fine.",
      },
    ],
  },

  errors: {
    NO_DB: "La modalità online non è collegata al momento.",
    ROOM_NOT_FOUND: "Questa stanza non esiste (più).",
    ROOM_EXPIRED: "Questa stanza è scaduta.",
    ROOM_FULL: "La stanza è piena (10 giocatori).",
    GAME_RUNNING: "La partita è già iniziata — aspetta che finisca.",
    ROUND_RUNNING: "Il turno è ancora in corso.",
    NOT_IN_ROOM: "Non sei in questa stanza.",
    HOST_ONLY: "Solo l'host può farlo.",
    LOBBY_ONLY: "Si può fare solo nella sala d'attesa.",
    NO_BOTS_LEFT: "Non ci sono altri bot.",
    CANT_KICK_HOST: "L'host non può espellere sé stesso.",
    NEED_PLAYERS: "Servono almeno 2 giocatori (i bot contano).",
    GAME_OVER: "La partita è finita.",
    NO_OWN_VETO: "Non puoi cancellare le tue risposte.",
    CODE_FAILED: "Non ho trovato un codice libero. Riprova.",
    NO_CONNECTION: "Nessuna connessione. Riprova.",
    GENERIC: "Qualcosa è andato storto.",
  },
};
