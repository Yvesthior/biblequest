// __mocks__/next-auth/react.ts
import React from 'react';

const mockUseSession = jest.fn(() => ({ data: null, status: 'unauthenticated' }));
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();

export const useSession = mockUseSession;
export const signIn = mockSignIn;
export const signOut = mockSignOut;

// You might also need to mock SessionProvider if it's used directly in tests
export const SessionProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
