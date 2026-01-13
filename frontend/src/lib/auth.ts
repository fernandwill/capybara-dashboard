import bcrypt from 'bcryptjs';

// Environment variables - validated at runtime, not at module load
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

export async function authenticateAdmin(email: string, password: string) {
  try {
    // Validate environment variables at runtime
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
      console.error('ADMIN_EMAIL or ADMIN_PASSWORD_HASH not configured');
      return null;
    }

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
    if (!ADMIN_EMAIL) {
      throw new Error('ADMIN_EMAIL not configured');
    }

    if (email !== ADMIN_EMAIL) {
      throw new Error('Only the main admin can be created in this demo');
    }

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