import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function authenticateAdmin(email: string, password: string) {
  try {
    // For now, we'll check against a fixed email and password
    // In a real application, you would store admins in the database
    const storedEmail = 'capybara389@gmail.com';
    const storedHash = '$2a$12$MrcqahlPcaiCf9mO71kTLeUv/JABy0N41K0IaRWFW4uXqLSg3nmu6'; // Hash of 'your_password_here'

    if (email === storedEmail && await bcrypt.compare(password, storedHash)) {
      return {
        id: 'admin-1',
        email: storedEmail,
        name: 'Capybara Admin',
      };
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function createAdmin(email: string, password: string, name: string) {
  try {
    // For now, we'll just check if this is the same admin we already have
    const storedEmail = 'capybara389@gmail.com';
    
    if (email !== storedEmail) {
      throw new Error('Only the main admin can be created in this demo');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // In a real application, you would store this in the database
    console.log('Admin created with email:', email);
    console.log('Password hash:', hashedPassword);
    
    return {
      id: 'admin-1',
      email,
      name,
    };
  } catch (error) {
    console.error('Admin creation error:', error);
    throw error;
  }
}