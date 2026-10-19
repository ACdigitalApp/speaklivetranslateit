import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ signUp: vi.fn(), signIn: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: {
    signUp: mocks.signUp,
    signInWithPassword: mocks.signIn,
    getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    onAuthStateChange: vi.fn(),
  },
} }));
import { useAuthStore } from './useAuthStore';

describe('registered accounts', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ currentUser: null, isAuthenticated: false });
    vi.clearAllMocks();
  });
  it('registers remotely and requires email confirmation before authenticating', async () => {
    mocks.signUp.mockResolvedValue({ data: { user: { id: 'registered-id' }, session: null }, error: null });
    expect(await useAuthStore.getState().register({ name: 'Test', email: 'test@example.com', password: 'test-password' })).toBe(true);
    expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com', options: expect.objectContaining({ data: { name: 'Test', whatsapp: undefined } }) }));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem('speakeasy_admin_users')).toBeNull();
  });
  it('does not grant admin access for an invalid password', async () => {
    mocks.signIn.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid credentials' } });
    expect(await useAuthStore.getState().login('acdigital.app@gmail.com', 'wrong-password')).toBe(false);
    expect(useAuthStore.getState().currentUser).toBeNull();
  });
});