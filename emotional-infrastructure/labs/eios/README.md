# EIOS (lab notes)

EIOS ("Emotional Infrastructure Operating System" in the source material)
is treated in this reference implementation as the conceptual runtime
that `apps/api` + `labs/eios-gateway` together implement: a governance
API plus a gateway that enforces it at the routing layer.

This directory holds design notes rather than a separate running service,
since a second full "OS" layer beyond the governance API and gateway
would duplicate the same CTP/PDEV logic without adding anything testable.
See `labs/eios-gateway/` for the actual runnable prototype, and
`docs/ARCHITECTURE.md` for how the pieces fit together.

## Open questions for a future EIOS layer

- Would EIOS own signal ingestion (raw client-side instrumentation ->
  the `SignalFeatures` shape EGL expects), separate from governance?
- Should EIOS own session/device identity separately from CTP's `sub`
  claim, or reuse it?
- What's the right boundary between "gateway enforces CTP/PDEV" (current
  prototype) and "gateway also enforces TAR/Trajectory before forwarding"?

These are intentionally left open rather than answered with unvalidated
code.
