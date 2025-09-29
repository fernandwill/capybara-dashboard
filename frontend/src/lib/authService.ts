import { supabase } from '@/lib/supabaseClient'
import { AuthResponse, UserResponse, AuthError } from '@supabase/supabase-js'

export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; data?: AuthResponse['data']; error?: string }> {
  try {
    const { data, error }: AuthResponse = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Error signing in:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error }: { error: AuthError | null } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: unknown) {
    console.error('Error signing out:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getCurrentUser(): Promise<{ success: boolean; data?: UserResponse['data']['user']; error?: string }> {
  try {
    const { data, error }: UserResponse = await supabase.auth.getUser()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data.user }
  } catch (error: unknown) {
    console.error('Error getting current user:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
