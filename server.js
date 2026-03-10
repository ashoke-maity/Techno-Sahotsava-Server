// packages imports
const dotenv = require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./configs/db');
connectDB();
const cors = require('cors');
const corsOptions = require('./middlewares/corsMiddleware');

// routes imports
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');

// middleware
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions
});

app.set('io', io);

let onlineAdmins = new Set();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('admin:online', (email) => {
        if (email) {
            socket.adminEmail = email;
            onlineAdmins.add(email);
            io.emit('admin:status_update', Array.from(onlineAdmins));
            console.log(`Admin ${email} is online`);
        }
    });

    socket.on('disconnect', () => {
        if (socket.adminEmail) {
            onlineAdmins.delete(socket.adminEmail);
            io.emit('admin:status_update', Array.from(onlineAdmins));
            console.log(`Admin ${socket.adminEmail} went offline`);
        }
        console.log('User disconnected:', socket.id);
    });
});

app.use(express.json());
app.use(cors(corsOptions));

// Routes
app.use('/technoSahotsava2026/admin', adminRoutes);
app.use('/technoSahotsava2026/auth', authRoutes);
app.use('/technoSahotsava2026/public', publicRoutes);

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
});