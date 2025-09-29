"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasSocketInstance = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let ioInstance = null;
const initSocket = (server) => {
    ioInstance = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    });
    return ioInstance;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!ioInstance) {
        throw new Error('Socket.io has not been initialised');
    }
    return ioInstance;
};
exports.getIO = getIO;
const hasSocketInstance = () => ioInstance !== null;
exports.hasSocketInstance = hasSocketInstance;
//# sourceMappingURL=socket.js.map