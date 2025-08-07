import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function testConnection() {
    try {
        await prisma.$connect()
        console.log('Database connected.')
    } catch (error) {
        console.log('Database connection failed.', error)
        process.exit(1)
    }
}

testConnection()

export default prisma
