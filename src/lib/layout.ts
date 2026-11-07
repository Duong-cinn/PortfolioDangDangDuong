/**
 * Project grid columns (desktop): never leave a lonely card on the last row.
 * 3 per row when it divides evenly, else 2 for even counts, else 3.
 */
export const projectColumns = (count: number) => (count <= 1 ? 1 : count % 3 === 0 ? 3 : count % 2 === 0 ? 2 : 3);

/**
 * Journey staircase (desktop, design units on a 1440 frame): cards climb from bottom-left to top-right.
 * Returns each card's left/top plus the container height. `rise` = vertical step between holds.
 */
export function staircase(count: number, { width = 1312, card = 300, rise = 150, cardHeight = 400 } = {}) {
  const run = count > 1 ? (width - card) / (count - 1) : 0;
  const height = cardHeight + rise * Math.max(0, count - 1);
  const cards = Array.from({ length: count }, (_, i) => ({ left: Math.round(i * run), top: (count - 1 - i) * rise }));
  return { cards, height };
}
