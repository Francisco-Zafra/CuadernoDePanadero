/** Step size that grows with the value: 0.1 up to 5, 1 above. */
export const adaptiveStep = (v: number, dir: 1 | -1) =>
  dir === 1 ? (v >= 5 ? 1 : 0.1) : v > 5 ? 1 : 0.1;
