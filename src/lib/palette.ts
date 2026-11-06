/** Lets any component (e.g. the navbar hint button) open the command palette. */
export const OPEN_PALETTE_EVENT = "palette:open";
export const openPalette = () => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
