const socket = io();

const $ = sel => document.querySelector(sel);
const els = {
  views: { landing: $("#view-landing"), game: $("#view-game") },
  name: $("#name-input"),
  code: $("#code-input"),
  btnCreate: $("#btn-create"),
  btnJoin: $("#btn-join"),
  err: $("#landing-error"),
  roomCode: $("#room-code"),
  btnCopy: $("#btn-copy"),
  players: $("#players-bar"),
  levelBanner: $("#level-banner"),
  levelName: $("#level-name"),
  levelTagline: $("#level-tagline"),
  levelProgress: $("#level-progress"),
  card: $("#card"),
  backLevel: $("#back-level"),
  turnIndicator: $("#turn-indicator"),
  btnDraw: $("#btn-draw"),
  btnNext: $("#btn-next"),
  btnLevelUp: $("#btn-levelup"),
  btnStart: $("#btn-start"),
  btnReset: $("#btn-reset"),
  hint: $("#hint"),
  toast: $("#toast")
};

let me = { id: null, name: "" };
let state = null;

function show(view) {
  Object.values(els.views).forEach(v => v.classList.add("hidden"));
  els.views[view].classList.remove("hidden");
}

function toast(msg, ms = 2200) {
  els.toast.textContent = msg;
  els.toast.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.add("hidden"), ms);
}

function persistName(n) { try { localStorage.setItem("wnrs-name", n); } catch {} }
function loadName() { try { return localStorage.getItem("wnrs-name") || ""; } catch { return ""; } }

els.name.value = loadName();

// Pre-fill code from URL ?room=ABCD
const urlParams = new URLSearchParams(location.search);
const presetRoom = (urlParams.get("room") || "").toUpperCase();
if (presetRoom) els.code.value = presetRoom;

els.btnCreate.addEventListener("click", () => {
  const name = els.name.value.trim();
  if (!name) { els.err.textContent = "name yourself first."; return; }
  persistName(name);
  me.name = name;
  socket.emit("createRoom", { name }, res => {
    if (res?.ok) {
      const url = new URL(location.href);
      url.searchParams.set("room", res.code);
      history.replaceState({}, "", url);
      show("game");
    } else {
      els.err.textContent = res?.error || "something went sideways.";
    }
  });
});

els.btnJoin.addEventListener("click", () => {
  const name = els.name.value.trim();
  const code = els.code.value.trim().toUpperCase();
  if (!name) { els.err.textContent = "name yourself first."; return; }
  if (!code) { els.err.textContent = "room code please."; return; }
  persistName(name);
  me.name = name;
  socket.emit("joinRoom", { name, code }, res => {
    if (res?.ok) {
      const url = new URL(location.href);
      url.searchParams.set("room", res.code);
      history.replaceState({}, "", url);
      show("game");
    } else {
      els.err.textContent = res?.error || "couldn't join.";
    }
  });
});

els.code.addEventListener("input", e => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
});

els.btnCopy.addEventListener("click", async () => {
  const url = new URL(location.href);
  url.searchParams.set("room", state?.code || "");
  try {
    await navigator.clipboard.writeText(url.toString());
    toast("invite link copied — send it to them.");
  } catch {
    prompt("Copy this link:", url.toString());
  }
});

els.btnStart.addEventListener("click", () => socket.emit("startGame"));
els.btnDraw.addEventListener("click", () => socket.emit("drawCard"));
els.btnNext.addEventListener("click", () => {
  socket.emit("nextTurn");
});
els.btnLevelUp.addEventListener("click", () => {
  socket.emit("voteLevelUp");
  els.btnLevelUp.disabled = true;
  els.btnLevelUp.textContent = "waiting for the others...";
});
els.btnReset.addEventListener("click", () => socket.emit("resetGame"));

socket.on("connect", () => { me.id = socket.id; });
socket.on("toast", msg => toast(msg));

socket.on("state", s => {
  const prev = state;
  state = s;
  render(prev, s);
});

function render(prev, s) {
  els.roomCode.textContent = s.code;

  // Players bar
  els.players.innerHTML = "";
  s.players.forEach(p => {
    const chip = document.createElement("div");
    chip.className = "player-chip";
    if (p.id === s.turnPlayerId) chip.classList.add("turn");
    if (p.levelUpVote) chip.classList.add("voted");
    chip.textContent = p.id === me.id ? `${p.name} (you)` : p.name;
    els.players.appendChild(chip);
  });

  // Level banner + theme
  const lvl = s.level;
  els.levelName.textContent = `level 0${lvl.id} · ${lvl.name.toLowerCase()}`;
  els.levelTagline.textContent = lvl.tagline;
  els.levelProgress.textContent = `${s.cardsRemaining} cards left`;
  els.levelBanner.style.background = lvl.color;
  els.backLevel.textContent = `level 0${lvl.id} — ${lvl.name.toLowerCase()}`;

  // Card state
  const myTurn = s.turnPlayerId === me.id;
  const showStart = !s.started;
  const showReset = s.finished;

  els.btnStart.classList.toggle("hidden", !showStart || s.finished);
  els.btnReset.classList.toggle("hidden", !showReset);
  els.btnDraw.classList.toggle("hidden", !s.started || s.finished || !!s.currentCard);
  els.btnNext.classList.toggle("hidden", !(s.started && s.currentCard && s.currentCard.type === "question" && myTurn));
  els.btnLevelUp.classList.toggle("hidden", !(s.started && !s.finished && s.cardsRemaining === 0));

  // Reset levelup button text on level change
  if (prev && prev.levelIndex !== s.levelIndex) {
    els.btnLevelUp.disabled = false;
    els.btnLevelUp.textContent = "i'm ready for the next level";
  }
  // If level not done, reset the levelup button as well
  if (s.cardsRemaining > 0) {
    els.btnLevelUp.disabled = false;
    els.btnLevelUp.textContent = "i'm ready for the next level";
  }

  // Turn indicator + draw enable
  if (s.finished) {
    els.turnIndicator.textContent = "you made it through all three levels. you're not really strangers anymore.";
    els.hint.textContent = "";
    setCard({ type: "level-end", text: "you're not really strangers anymore." }, lvl);
  } else if (!s.started) {
    els.turnIndicator.textContent = s.players.length < 2
      ? `share the invite link — waiting for someone to join.`
      : `everyone's here. ${s.players[0].name} can start when you're ready.`;
    els.hint.textContent = s.players.length < 2 ? "" : "";
    setCard(null, lvl);
  } else {
    const turnPlayer = s.players.find(p => p.id === s.turnPlayerId);
    if (s.currentCard) {
      if (s.currentCard.type === "wildcard") {
        els.turnIndicator.textContent = `wildcard — for ${turnPlayer?.name || "the room"}.`;
        els.hint.textContent = myTurn ? "do the wildcard, then draw your real card." : "";
      } else if (s.cardsRemaining === 0 && s.currentCard.type !== "wildcard") {
        els.turnIndicator.textContent = `last card of ${lvl.name.toLowerCase()}.`;
        els.hint.textContent = myTurn ? "answer, then ready up for the next level." : "";
      } else {
        els.turnIndicator.textContent = `${turnPlayer?.name || "someone"}'s card.`;
        els.hint.textContent = myTurn ? "take your time. answer honestly." : "listen.";
      }
      setCard(s.currentCard, lvl);
    } else if (s.cardsRemaining === 0) {
      els.turnIndicator.textContent = `level ${lvl.id} complete.`;
      els.hint.textContent = "ready up when you're ready to go deeper.";
      setCard({ type: "level-end", text: `you finished level 0${lvl.id}.` }, lvl);
    } else {
      els.turnIndicator.textContent = myTurn ? `your turn.` : `${turnPlayer?.name || "someone"}'s turn.`;
      els.hint.textContent = myTurn ? "draw a card." : "";
      setCard(null, lvl);
    }
  }

  // Enable/disable draw based on whose turn
  els.btnDraw.disabled = !myTurn;
  els.btnDraw.style.opacity = myTurn ? "1" : "0.5";
  els.btnDraw.style.cursor = myTurn ? "pointer" : "not-allowed";
}

function setCard(card, lvl) {
  // Rebuild card faces fresh each render to allow animation
  els.card.classList.remove("flipped");
  els.card.innerHTML = `
    <div class="card-face card-back">
      <div class="back-label">we're not<br/>really strangers</div>
      <div class="back-level">level 0${lvl.id} — ${lvl.name.toLowerCase()}</div>
    </div>
  `;
  if (!card) return;

  const front = document.createElement("div");
  front.className = "card-face card-front";
  if (card.type === "question") front.classList.add(`q-level-${lvl.id}`);
  if (card.type === "wildcard") front.classList.add("wildcard");
  if (card.type === "level-end") front.classList.add("level-end");

  const tag = document.createElement("div");
  tag.className = "card-tag";
  tag.textContent = card.type === "wildcard"
    ? "wildcard"
    : card.type === "level-end"
      ? `level 0${lvl.id}`
      : `level 0${lvl.id} · ${lvl.name.toLowerCase()}`;
  const text = document.createElement("div");
  text.className = "card-text";
  text.textContent = card.text;

  front.appendChild(tag);
  front.appendChild(text);
  els.card.appendChild(front);

  requestAnimationFrame(() => {
    els.card.classList.add("flipped");
  });
}

// allow Enter to submit on landing
[els.name, els.code].forEach(input => {
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      if (input === els.code) els.btnJoin.click();
      else if (els.code.value) els.btnJoin.click();
      else els.btnCreate.click();
    }
  });
});
