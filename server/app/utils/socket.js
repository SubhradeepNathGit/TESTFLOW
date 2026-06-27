const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

exports.initSocket = (server) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()) 
        : ["http://localhost:5173", "http://localhost:5174"];

    io = socketIo(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication error'));

            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) return next(new Error('User not found'));

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        

        
        if (socket.user.role === 'super_admin') {
            socket.join('super_admin');
        } else if (socket.user.institutionId) {
            socket.join(socket.user.institutionId.toString());
        }
        
        
        socket.join(socket.user._id.toString());

        socket.on('disconnect', () => {
            
        });
    });

    return io;
};

exports.getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

exports.emitToInstitution = (institutionId, event, data) => {
    if (io) {
        if (institutionId) {
            io.to(institutionId.toString()).emit(event, data);
        }
        io.to('super_admin').emit(event, data); 
    }
};

exports.emitToUser = (userId, event, data) => {
    if (io) {
        io.to(userId.toString()).emit(event, data);
    }
};

exports.emitToSuperAdmin = (event, data) => {
    if (io) {
        io.to('super_admin').emit(event, data);
    }
};
