import { NextResponse } from 'next/server';
import { createAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // Create admin
    const admin = await createAdmin(email, password, name);

    return NextResponse.json({ 
      success: true, 
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      }
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred during registration' 
    }, { status: 500 });
  }
}