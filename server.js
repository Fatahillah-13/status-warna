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

io.on("connection", (socket) => {
  socket.data.authed = false;

  socket.on("auth:pin", (pin, cb) => {
    const ok = String(pin || "") === String(OFFICE_PIN);
    socket.data.authed = ok;

    if (typeof cb === "function") cb({ ok });

    if (ok) socket.emit("status:update", current);
  });

  socket.on("status:set", (payload) => {
    if (!socket.data.authed) return;
    if (!payload || !payload.color || !payload.label) return;

    current = payload;
    io.emit("status:update", current);
  });
});

// Render pakai PORT dari environment (default 10000 di Render web services) :contentReference[oaicite:1]{index=1}
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Running on port ${PORT}`));
