/**
 * Login page tests — requires Jest + React Testing Library
 * Setup: npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
 * Run: npx jest --testPathPattern=LoginPage.test
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock AuthContext
const mockLogin = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isLoading: false,
  }),
}));

import LoginPage from "@/app/auth/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });

  it("shows email and password inputs", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("login.emailLabel")).toBeInTheDocument();
    expect(screen.getByLabelText("login.passwordLabel")).toBeInTheDocument();
  });

  it("shows validation error when submitting empty form", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /login.submitButton/i }));
    await waitFor(() => {
      expect(screen.getByText("validation.emailRequired")).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid email", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("login.emailLabel"), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText("login.passwordLabel"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login.submitButton/i }));
    await waitFor(() => {
      expect(screen.getByText("validation.emailInvalid")).toBeInTheDocument();
    });
  });

  it("calls login and redirects on success", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("login.emailLabel"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText("login.passwordLabel"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login.submitButton/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@test.com", "Password123!");
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows server error alert on login failure", async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { error: "Invalid email or password" } },
    });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("login.emailLabel"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText("login.passwordLabel"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login.submitButton/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("has proper ARIA attributes on inputs", () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText("login.emailLabel");
    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("autocomplete", "email");
  });

  it("disables submit button while submitting", async () => {
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText("login.emailLabel"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByLabelText("login.passwordLabel"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login.submitButton/i }));
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});
