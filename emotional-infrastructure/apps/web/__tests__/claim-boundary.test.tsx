import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ClaimBoundaryPage from "@/app/claim-boundary/page";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ClaimBoundaryPage", () => {
  it("calls POST /claim-boundary/scan and renders flagged terms", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("/claim-boundary/scan");
      return new Response(
        JSON.stringify({
          passed: false,
          flagged_terms: [
            { term: "certified", start: 20, end: 29, matched_text: "certified", suggested_replacement: "reference implementation" },
          ],
          suggestions: ["candidate architecture"],
          scan_id: "scan-1",
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ClaimBoundaryPage />);
    fireEvent.click(screen.getByRole("button", { name: /scan for restricted claims/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(await screen.findByText("reference implementation")).toBeInTheDocument();
  });
});
