const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('./'));

const rooms = new Map();

io.on('connection', (socket) => {
    socket.on('create-room', (roomId) => {
        rooms.set(roomId, socket.id);
        socket.join(roomId);
    });

    socket.on('join-room', (roomId) => {
        if (rooms.has(roomId)) {
            socket.join(roomId);
            socket.to(roomId).emit('viewer-joined');
        }
    });

    socket.on('offer', (offer, roomId) => {
        socket.to(roomId).emit('offer', offer);
    });

    socket.on('answer', (answer, roomId) => {
        socket.to(roomId).emit('answer', answer);
    });

    socket.on('ice-candidate', (candidate, roomId) => {
        socket.to(roomId).emit('ice-candidate', candidate);
    });
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log(`A szerver fut a következő porton: ${port}`);
});