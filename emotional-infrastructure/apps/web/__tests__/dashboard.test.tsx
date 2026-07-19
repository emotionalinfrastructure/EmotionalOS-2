import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/page";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DashboardPage", () => {
  it("renders and calls the health, ledger, and policy endpoints", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/health")) {
        return new Response(JSON.stringify({ status: "ok", service: "emotional-infrastructure" }), { status: 200 });
      }
      if (url.includes("/ledger/events")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes("/policy/rules")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardPage />);

    expect(await screen.findByText("Governance Dashboard")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/health"), expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/ledger/events"), expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/policy/rules"), expect.any(Object));
    });

    expect(await screen.findByText("ok")).toBeInTheDocument();
  });

  it("shows an error state when the API is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    render(<DashboardPage />);

    expect(await screen.findByText(/Could not reach the governance API/i)).toBeInTheDocument();
  });
});
