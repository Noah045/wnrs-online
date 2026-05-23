const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const { LEVELS, buildDeck, getLevelMeta } = require("./questions");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, "public")));

// In-memory room store. Fine for a small game like this.
// room shape:
// { code, players: [{id, name, ready, levelUpVote}], levelIndex, deck, currentCard, turnIndex, started, finished }
const rooms = new Map();

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let code;
  do {
    code = "";
    for (let i = 0; i < 4; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  } while (rooms.has(code));
  return code;
}

function publicState(room) {
  return {
    code: room.code,
    players: room.players.map(p => ({ id: p.id, name: p.name, levelUpVote: !!p.levelUpVote })),
    levelIndex: room.levelIndex,
    level: getLevelMeta(room.levelIndex),
    totalLevels: LEVELS.length,
    currentCard: room.currentCard,
    turnPlayerId: room.players[room.turnIndex]?.id || null,
    cardsRemaining: room.deck.length,
    started: room.started,
    finished: room.finished
  };
}

function broadcast(room) {
  io.to(room.code).emit("state", publicState(room));
}

function nextTurn(room) {
  if (room.players.length === 0) return;
  room.turnIndex = (room.turnIndex + 1) % room.players.length;
}

io.on("connection", socket => {
  let currentRoom = null;

  socket.on("createRoom", ({ name }, cb) => {
    const code = makeCode();
    const room = {
      code,
      players: [{ id: socket.id, name: (name || "Player").slice(0, 24), levelUpVote: false }],
      levelIndex: 0,
      deck: buildDeck(0),
      currentCard: null,
      turnIndex: 0,
      started: false,
      finished: false
    };
    rooms.set(code, room);
    currentRoom = room;
    socket.join(code);
    cb && cb({ ok: true, code });
    broadcast(room);
  });

  socket.on("joinRoom", ({ code, name }, cb) => {
    code = (code || "").toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return cb && cb({ ok: false, error: "Room not found." });
    if (room.players.length >= 8) return cb && cb({ ok: false, error: "Room is full." });
    room.players.push({ id: socket.id, name: (name || "Player").slice(0, 24), levelUpVote: false });
    currentRoom = room;
    socket.join(code);
    cb && cb({ ok: true, code });
    broadcast(room);
  });

  socket.on("startGame", () => {
    if (!currentRoom) return;
    if (currentRoom.players.length < 2) {
      socket.emit("toast", "Wait for at least one more player to join.");
      return;
    }
    currentRoom.started = true;
    currentRoom.currentCard = null;
    currentRoom.turnIndex = 0;
    broadcast(currentRoom);
  });

  socket.on("drawCard", () => {
    if (!currentRoom || !currentRoom.started || currentRoom.finished) return;
    const turnPlayer = currentRoom.players[currentRoom.turnIndex];
    if (!turnPlayer || turnPlayer.id !== socket.id) return; // only current player can draw

    if (currentRoom.deck.length === 0) {
      // out of cards in this level
      currentRoom.currentCard = { type: "level-end", text: "You've finished this level." };
      broadcast(currentRoom);
      return;
    }
    const card = currentRoom.deck.shift();
    currentRoom.currentCard = card;
    // Wildcards do not consume the turn — the drawer continues. Questions: pass turn after.
    if (card.type === "wildcard") {
      // keep same turn
    }
    broadcast(currentRoom);
  });

  socket.on("nextTurn", () => {
    if (!currentRoom || !currentRoom.started || currentRoom.finished) return;
    const turnPlayer = currentRoom.players[currentRoom.turnIndex];
    if (!turnPlayer || turnPlayer.id !== socket.id) return;
    currentRoom.currentCard = null;
    nextTurn(currentRoom);
    broadcast(currentRoom);
  });

  socket.on("voteLevelUp", () => {
    if (!currentRoom) return;
    const me = currentRoom.players.find(p => p.id === socket.id);
    if (!me) return;
    me.levelUpVote = true;
    const allVoted = currentRoom.players.every(p => p.levelUpVote);
    if (allVoted) {
      if (currentRoom.levelIndex + 1 < LEVELS.length) {
        currentRoom.levelIndex += 1;
        currentRoom.deck = buildDeck(currentRoom.levelIndex);
        currentRoom.currentCard = null;
        currentRoom.players.forEach(p => (p.levelUpVote = false));
      } else {
        currentRoom.finished = true;
      }
    }
    broadcast(currentRoom);
  });

  socket.on("resetGame", () => {
    if (!currentRoom) return;
    currentRoom.levelIndex = 0;
    currentRoom.deck = buildDeck(0);
    currentRoom.currentCard = null;
    currentRoom.turnIndex = 0;
    currentRoom.started = false;
    currentRoom.finished = false;
    currentRoom.players.forEach(p => (p.levelUpVote = false));
    broadcast(currentRoom);
  });

  socket.on("disconnect", () => {
    if (!currentRoom) return;
    currentRoom.players = currentRoom.players.filter(p => p.id !== socket.id);
    if (currentRoom.players.length === 0) {
      rooms.delete(currentRoom.code);
      return;
    }
    if (currentRoom.turnIndex >= currentRoom.players.length) currentRoom.turnIndex = 0;
    broadcast(currentRoom);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WNRS-online running on http://localhost:${PORT}`);
});
