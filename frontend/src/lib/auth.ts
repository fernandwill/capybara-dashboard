import bcrypt from 'bcryptjs';

// In a production environment, these values should come from environment variables
// and never be committed to version control
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
  throw new Error("Unknown error.")
}

export async function authenticateAdmin(email: string, password: string) {
  try {
    // In a real application, you would:
    // 1. Query your database for the admin user
    // 2. Compare the provided password with the stored hash
    
    // For demo purposes, we're using environment variables or fallback values
    if (email === ADMIN_EMAIL && await bcrypt.compare(password, ADMIN_PASSWORD_HASH)) {
      return {
        id: 'admin-1',
        email: ADMIN_EMAIL,
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
    // In a real application, you would:
    // 1. Check if admin already exists
    // 2. Hash the password
    // 3. Store in database
    
    // For demo purposes, we're just validating against our environment variable
    if (email !== ADMIN_EMAIL) {
      throw new Error('Only the main admin can be created in this demo');
    }

    // In a real application, you would hash and store the password
    // For demo, we're just validating
    console.log('Admin creation requested for:', email);
    
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