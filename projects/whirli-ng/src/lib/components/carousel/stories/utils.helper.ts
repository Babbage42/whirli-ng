export const img = (i: number, w = 300, h = 200) =>
  `https://picsum.photos/${w}/${h}?random=${1000 + i}`;

export const buildSlides = (n: number) =>
  Array.from({ length: n }, (_, i) => img(i));
