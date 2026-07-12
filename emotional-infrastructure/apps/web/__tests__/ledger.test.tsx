import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LedgerPage from "@/app/ledger/page";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LedgerPage", () => {
  it("loads and renders real ledger events from GET /ledger/events", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/ledger/events")) {
        return new Response(
          JSON.stringify([
            {
              event_id: "e1",
              sequence: 1,
              timestamp: new Date().toISOString(),
              decision: "allow",
              policy_version: "v1",
              previous_block_hash: "0".repeat(64),
              block_hash: "a".repeat(64),
              event_metadata: {},
              sub: "user-1",
              pdev_action: "ctp_issue",
            },
          ]),
          { status: 200 },
        );
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LedgerPage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/ledger/events"), expect.any(Object)));
    expect(await screen.findByText("user-1")).toBeInTheDocument();
    expect(await screen.findByText("ctp_issue")).toBeInTheDocument();
  });
});
