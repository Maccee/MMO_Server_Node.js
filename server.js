require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Create the server
const server = http.createServer(app);

// Setup Socket.io with CORS configuration
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173", // Adjust the port to match your client app's URL
        methods: ["GET", "POST"]
    }
});

const balls = {};

io.on('connection', (socket) => {
    // Initialize ball position, color, and name for new connection
    balls[socket.id] = { 
        x: 100, 
        y: 100, 
        color: getRandomColor(), // Function to get random color
        name: '' 
    };

    io.emit('ballsUpdate', balls);

    socket.on('moveBall', (data) => {
        if (balls[socket.id]) {
            balls[socket.id].x = data.x;
            balls[socket.id].y = data.y;
            io.emit('ballsUpdate', balls);
        }
    });

    socket.on('updateName', (name) => {
        if (balls[socket.id]) {
            balls[socket.id].name = name;
            io.emit('ballsUpdate', balls);
        }
    });

    socket.on('disconnect', () => {
        delete balls[socket.id];
        io.emit('ballsUpdate', balls);
    });
});

function getRandomColor() {
    const colors = ['#FF5733', '#33FF57', '#3357FF', /* add 13 more colors */];
    return colors[Math.floor(Math.random() * colors.length)];
}




const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server listening on port ${port}`));
