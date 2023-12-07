require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Function to generate a random number between min and max
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Function to generate a random color
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const players = {}; // Store the state of all players
const GAME_WIDTH = 2000;
const GAME_HEIGHT = 2000;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const MOVEMENT_SPEED = 4;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  // Emit gamearea
  socket.emit("gameArea", { width: GAME_WIDTH, height: GAME_HEIGHT });

  // Initialize the player
  players[socket.id] = {
    x: getRandomNumber(100, 1900),
    y: getRandomNumber(100, 1900),
    color: getRandomColor(),
    isNew: true,
    size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
  };

  // Emit the current state of all players to the newly connected user
  socket.emit("playersUpdate", players);

  // Broadcast the new player to all other users
  socket.broadcast.emit("newPlayer", {
    id: socket.id,
    player: players[socket.id],
  });

  // WASD
  socket.on("playerMove", (direction) => {
    if (players[socket.id]) {
      // Update player position with clamping
      players[socket.id].x = Math.max(
        PLAYER_WIDTH / 2,
        Math.min(
          GAME_WIDTH - PLAYER_WIDTH / 2,
          players[socket.id].x + direction.x * MOVEMENT_SPEED
        )
      );
      players[socket.id].y = Math.max(
        PLAYER_HEIGHT / 2,
        Math.min(
          GAME_HEIGHT - PLAYER_HEIGHT / 2,
          players[socket.id].y + direction.y * MOVEMENT_SPEED
        )
      );
      players[socket.id].isNew = false;

      // Broadcast the updated position
      io.emit("playersUpdate", players);
    }
  });

  // Handle player disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete players[socket.id];
    io.emit("playersUpdate", players);
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Server listening on port ${port}`));
