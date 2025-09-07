"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
async function testConnection() {
    try {
        await prisma.$connect();
        console.log('Database connected.');
    }
    catch (error) {
        console.log('Database connection failed.', error);
        process.exit(1);
    }
}
testConnection();
exports.default = prisma;
//# sourceMappingURL=database.js.map