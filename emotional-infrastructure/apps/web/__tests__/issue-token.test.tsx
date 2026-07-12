import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import IssueTokenPage from "@/app/ctp/issue/page";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("IssueTokenPage", () => {
  it("calls POST /ctp/issue and renders the response", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toContain("/ctp/issue");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.sub).toBe("user-42");
      return new Response(
        JSON.stringify({
          token: "eyJhbGciOi...",
          jti: "jti-123",
          sub: "user-42",
          scope: "signal.process",
          purpose: "wellbeing_support",
          context_hash: "abc",
          policy_uri: "https://x/policy",
          consent_level: "standard",
          consent_version: "ctp-0.1",
          issued_at: new Date().toISOString(),
          expires_at: new Date().toISOString(),
          ledger_event_id: "evt-1",
        }),
        { status: 201 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<IssueTokenPage />);
    fireEvent.click(screen.getByRole("button", { name: /issue token/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(await screen.findByText(/jti-123/)).toBeInTheDocument();
  });
});
