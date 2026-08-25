// Authentication Service for HamzaPhone: Email/Password, OAuth (Google, Apple, Facebook), Session Management

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, UserType } from '@/types/database.types';

export interface RegisterUserInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  userType?: UserType;
  metadata?: Record<string, unknown>;
}

export interface RegisterBusinessInput extends RegisterUserInput {
  companyName: string;
  tradeName?: string;
  rcNumber?: string;
  nif?: string;
  nis?: string;
  wilayaCode: number;
  wilayaName: string;
  communeName: string;
  addressLine: string;
}

export class AuthService {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * Register a standard B2C consumer account
   */
  async registerB2C(input: RegisterUserInput) {
    const { data, error } = await this.supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          phone: input.phone,
          user_type: 'B2C',
          ...input.metadata,
        },
      },
    });

    if (error) throw new Error(`Registration failed: ${error.message}`);
    return data;
  }

  /**
   * Register a B2B repair shop / wholesale account and initiate business registration
   */
  async registerB2B(input: RegisterBusinessInput) {
    const { data, error } = await this.supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          phone: input.phone,
          user_type: 'B2B',
          company_name: input.companyName,
          rc_number: input.rcNumber,
          nif: input.nif,
          nis: input.nis,
          wilaya_code: input.wilayaCode,
          ...input.metadata,
        },
      },
    });

    if (error) throw new Error(`B2B Registration failed: ${error.message}`);
    return data;
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(`Sign in failed: ${error.message}`);
    return data;
  }

  /**
   * Initiate OAuth sign-in flow for Google, Facebook, or Apple
   */
  async signInWithOAuth(provider: 'google' | 'facebook' | 'apple', redirectTo?: string) {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw new Error(`OAuth sign-in failed with ${provider}: ${error.message}`);
    return data;
  }

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw new Error(`Sign out failed: ${error.message}`);
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string, redirectTo?: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    if (error) throw new Error(`Password reset request failed: ${error.message}`);
  }

  /**
   * Retrieve current authenticated user and linked profile
   */
  async getCurrentProfile() {
    const { data: { user }, error: userError } = await this.supabase.auth.getUser();
    if (userError || !user) return null;

    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) return null;
    return profile;
  }
}
