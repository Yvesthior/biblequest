import React from "react";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/header";

// Mock the next-auth/react module
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock the ThemeToggle component as it's not relevant to the header's logic
jest.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle-mock" />,
}));

describe("Header Component", () => {
  const { useSession }: { useSession: jest.Mock } = require("next-auth/react");

  test("renders login button when unauthenticated", () => {
    useSession.mockReturnValue({ data: null, status: "unauthenticated" });
    render(<Header />);
    expect(screen.getByText("Connexion")).toBeInTheDocument();
  });

  test("renders profile and logout buttons when authenticated as a user", () => {
    useSession.mockReturnValue({
      data: { user: { name: "Test User", role: "USER" } },
      status: "authenticated",
    });
    render(<Header />);
    expect(screen.getByText(/Profil/i)).toBeInTheDocument();
    expect(screen.getByText(/Déconnexion/i)).toBeInTheDocument();
    expect(screen.queryByText(/Admin/i)).not.toBeInTheDocument();
  });

  test("renders admin button when authenticated as an admin", () => {
    useSession.mockReturnValue({
      data: { user: { name: "Admin User", role: "ADMIN" } },
      status: "authenticated",
    });
    render(<Header />);
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });

  test("renders loading state", () => {
    useSession.mockReturnValue({ data: null, status: "loading" });
    render(<Header />);
    // Check for the pulsing div
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });
});
