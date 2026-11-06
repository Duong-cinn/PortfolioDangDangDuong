/**
 * Projects grid (3 columns on desktop): the first card spans 2 columns only when
 * that fills the grid exactly — 2, 5, 8… projects. Otherwise every card is equal.
 */
export const hasFeaturedProject = (count: number) => count >= 2 && (count + 1) % 3 === 0;
