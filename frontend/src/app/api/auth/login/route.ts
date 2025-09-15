import { NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Authenticate admin
    const admin = await authenticateAdmin(email, password);

    if (admin) {
      return NextResponse.json({ 
        success: true, 
        message: 'Login successful',
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email or password' 
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred during login' 
    }, { status: 500 });
  }
}