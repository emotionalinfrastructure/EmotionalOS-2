import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ValidateTokenPage from "@/app/ctp/validate/page";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ValidateTokenPage", () => {
  it("calls POST /ctp/validate and renders the decision", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toContain("/ctp/validate");
      expect(init.method).toBe("POST");
      return new Response(JSON.stringify({ decision: "allow", reason: "ok", claims: { jti: "jti-123" } }), {
        status: 200,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<ValidateTokenPage />);
    const tokenField = container.querySelectorAll("textarea")[0];
    fireEvent.change(tokenField, { target: { value: "some.jwt.token" } });
    fireEvent.click(screen.getByRole("button", { name: /validate token/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(await screen.findByText("allow")).toBeInTheDocument();
  });
});
