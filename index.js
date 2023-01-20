const express = require("express");
const dotenv = require('dotenv');
const connectDB = require("./server/config/db");
const userRoutes = require("./server/routes/userRoutes.js");
const chatRoutes = require("./server/routes/chatRoutes.js");
const messageRoutes = require("./server/routes/messageRoutes.js");
const { notFound, errorHandler } = require('./server/middleware/errorMiddleware')
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config();
connectDB();
const app = express();

app.use(express.json()); //to accept json data
app.use(cors());

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

// -------------Deployment--------------- //
__dirname = path.resolve();
const buildPath = path.join(__dirname, "/client/build");

app.use(express.static(buildPath))
app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"))
})
// -------------Deployment--------------- //

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, console.log(`Server started on PORT ${PORT}`));

const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
        origin: "*",
    },
});

io.on("connection", (socket) => {
    console.log("connected to socket.io");

    socket.on("setup", (userData) => {
        socket.join(userData._id);
        console.log(userData._id);
        socket.emit("connected");
    });

    socket.on("typing", (room) => socket.in(room).emit("typing"));

    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log("User Joined Room:" + room);
    });

    socket.on('new message', (newMessageReceived) => {
        var chat = newMessageReceived.chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach(user => {
            if (user._id == newMessageReceived.sender._id) return;

            socket.in(user._id).emit("message received", newMessageReceived);
        })
    });

    socket.off("setup", () => {
        console.log("user disconnected");
        socket.leave(userData._id);
    });
});