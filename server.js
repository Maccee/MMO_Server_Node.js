require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

const balls = {};

io.on('connection', (socket) => {
    
    balls[socket.id] = { 
        x: 100, 
        y: 100, 
        color: getRandomColor(), 
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
    const colors = ['#FF5733', '#33FF57', '#3357FF'];
    return colors[Math.floor(Math.random() * colors.length)];
}

const port = process.env.PORT || 443;
server.listen(port, () => console.log(`Server listening on port ${port}`));
