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

const players = {}; // Store the state of all balls
const MOVEMENT_SPEED = 4;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  

  // Initialize the player with a random position and lastMove timestamp
  players[socket.id] = {
    x: getRandomNumber(0, 1880),
    y: getRandomNumber(0, 980),
    color: getRandomColor(),
    
  };

  // Emit the current state of all players to the newly connected user
  socket.emit("playersUpdate", players);

  // Broadcast the new player to all other users
  socket.broadcast.emit("newPlayer", {
    id: socket.id,
    player: players[socket.id],
  });

  // Update the lastMove timestamp when the player moves
  socket.on("movePlayer", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      
      io.emit("playersUpdate", players);
    }
  });

  // WASD
  socket.on("playerMove", (direction) => {
    if (players[socket.id]) {
      // Update player position based on direction and speed
      players[socket.id].x += direction.x * MOVEMENT_SPEED;
      players[socket.id].y += direction.y * MOVEMENT_SPEED;
  
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
