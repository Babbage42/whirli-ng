import { SnapDom } from '../models/carousel.model';

export function extractVisibleSlides(
  snapDom: SnapDom[],
  currentTranslate: number,
  fullWidth: number,
  offset?: number,
  center = false,
): SnapDom[] {
  return snapDom.filter((s) => {
    const leftInView =
      s.left + currentTranslate + (center ? fullWidth / 2 : 0) - (offset ?? 0);
    const rightInView = leftInView + s.width;
    return rightInView > 0 && leftInView < fullWidth;
  });
}

export function getFixedSlideSize(
  fullWidth: number,
  slidesPerView: number,
  spaceBetween: number,
): number {
  return (
    (fullWidth - spaceBetween * (slidesPerView - 1)) /
    Math.max(1, slidesPerView)
  );
}

export function getFixedSlideSizeCss(
  slidesPerView: number,
  spaceBetween: number,
): string {
  return `calc((100% - ${
    spaceBetween * (slidesPerView - 1)
  }px) / ${slidesPerView})`;
}

export function clampBetween(value: number, boundA: number, boundB: number) {
  const lower = Math.min(boundA, boundB);
  const upper = Math.max(boundA, boundB);
  return Math.min(upper, Math.max(lower, value));
}
