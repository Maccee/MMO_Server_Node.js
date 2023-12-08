require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  perMessageDeflate :false,
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
const MAX_SPEED = 10;
const ROTATION_SPEED = 1.5;

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
    velocity: 0,
    rotation: 0, // Rotation angle in degrees
    rotationSpeed: ROTATION_SPEED, // Degrees rotated per frame; adjust as needed
  };

  socket.emit("playersUpdate", players);

  // Broadcast the new player to all other users
  socket.broadcast.emit("newPlayer", {
    id: socket.id,
    player: players[socket.id],
  });

  // WASD
  socket.on("playerInput", (input) => {
    const player = players[socket.id];
    if (player) {
      // Store the input state
      player.inputState = input;

      // Handle immediate rotation
      if (input.a) {
        player.rotation -= player.rotationSpeed;
      }
      if (input.d) {
        player.rotation += player.rotationSpeed;
      }
      // Handle immediate acceleration
      if (input.w && player.velocity < MAX_SPEED) {
        player.velocity += 0.01;
      } else if (player.velocity > MAX_SPEED) {
        player.velocity = MAX_SPEED;
      }
      if (input.s) {
        player.velocity -= 0.1;
      }
    }
  });

  // Handle player disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete players[socket.id];
    io.emit("playersUpdate", players);
  });
});

function gameLoop() {
  for (let id in players) {
    const player = players[id];
    if (!player) continue;

    // Deceleration logic
    if (!player.inputState?.w) {
      player.velocity *= 0.999;
      if (player.velocity < 0.5 && player.velocity > -0.5) {
        player.velocity = 0;
      }
    }

    // Boundary check using center coordinates
    const halfWidth = PLAYER_WIDTH / 2;
    const halfHeight = PLAYER_HEIGHT / 2;
    player.x = Math.max(halfWidth, Math.min(player.x, GAME_WIDTH - halfWidth));
    player.y = Math.max(
      halfHeight,
      Math.min(player.y, GAME_HEIGHT - halfHeight)
    );

    // Adjust rotation to align with the image orientation
    const adjustedRotation = player.rotation - 90; // Subtract 90 degrees
    // Update player position
    const radian = adjustedRotation * (Math.PI / 180);
    player.x += player.velocity * Math.cos(radian);
    player.y += player.velocity * Math.sin(radian);
  }

  // Emit updated state to all players
  io.emit("playersUpdate", players);

  // Schedule the next update
  setTimeout(gameLoop, 1000 / 60);
}

// Start the game loop
gameLoop();

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Server listening on port ${port}`));
