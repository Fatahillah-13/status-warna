const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// PIN bersama (diatur dari hosting via environment variable)
const OFFICE_PIN = process.env.OFFICE_PIN || "1234";

// status terakhir (biar user baru join langsung dapat status)
let current = { color: "green", label: "HIJAU" };
let userEmojiState = { 1: "🙂", 2: "🙂", 3: "🙂" }; // default bisa kamu ubah

io.on("connection", (socket) => {
  console.log("CONNECTED", socket.id);
  socket.data.authed = false;

  socket.on("auth:pin", (pin, cb) => {
    const ok = String(pin || "") === String(OFFICE_PIN);
    socket.data.authed = ok;

    console.log("AUTH", socket.id, ok);

    if (typeof cb === "function") cb({ ok });

    if (ok) {
      socket.emit("status:update", current);
      socket.emit("useremoji:state", userEmojiState);
    }
  });

  socket.on("status:set", (payload) => {
    if (!socket.data.authed) return;
    if (!payload || !payload.color || !payload.label) return;

    current = payload;
    io.emit("status:update", current);
  });

  socket.on("useremoji:set", ({ userId, emoji }) => {
    console.log(
      "useremoji:set",
      socket.id,
      userId,
      emoji,
      "authed=",
      socket.data.authed
    );

    if (!socket.data.authed) return;

    const id = Number(userId);
    if (![1, 2, 3].includes(id)) return;

    if (typeof emoji !== "string" || emoji.length > 8) return;

    userEmojiState[id] = emoji;
    io.emit("useremoji:state", userEmojiState);
  });

  socket.on("disconnect", () => {
    console.log("DISCONNECTED", socket.id);
  });

  socket.on("useremoji:get", () => {
    if (!socket.data.authed) return;
    socket.emit("useremoji:state", userEmojiState);
  });
});

// Render pakai PORT dari environment (default 10000 di Render web services) :contentReference[oaicite:1]{index=1}
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Running on port ${PORT}`));
