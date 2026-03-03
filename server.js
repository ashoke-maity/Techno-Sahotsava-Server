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

// middleware
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.use(express.json());
app.use(cors(corsOptions));

// Routes
app.use('/technoSahotsava2026/admin', adminRoutes);
app.use('/technoSahotsava2026/auth', authRoutes);

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
});