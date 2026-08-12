// Shared between PageShell's header button and VerifyClient. Navigating to
// /dashboard/xobriqKYC/verify via <Link> is a no-op when you're already on
// that route — Next.js won't remount the page, so VerifyClient's local
// wizard state (which step you're on) never resets. When the header button
// is clicked while already on the verify page, it dispatches this event
// instead of relying on navigation, and VerifyClient listens for it to reset
// itself back to step 1.
export const NEW_VERIFICATION_EVENT = "xobriq-kyc:new-verification";
