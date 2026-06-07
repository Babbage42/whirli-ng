import {
  clampBetween,
  extractVisibleSlides,
  getFixedSlideSize,
  getFixedSlideSizeCss,
} from './calculations.helper';
import { SnapDom } from '../models/carousel.model';

describe('extractVisibleSlides', () => {
  const makeSnap = (left: number, width: number): SnapDom =>
    ({
      domIndex: 0,
      logicalIndex: 0,
      left,
      width,
      translate: 0,
    } as SnapDom);

  it('mode normal: sélectionne les slides qui intersectent [0, fullWidth]', () => {
    const snaps: SnapDom[] = [
      makeSnap(-150, 100), // partiellement à gauche
      makeSnap(0, 100), // plein dedans
      makeSnap(250, 100), // partiellement à droite (si fullWidth=300)
      makeSnap(400, 100), // complètement dehors
    ];

    const visible = extractVisibleSlides(snaps, 0, 300);

    // -150..-50 → invisible
    // 0..100 → visible
    // 250..350 → visible (intersection 250..300)
    // 400..500 → invisible
    expect(visible).toEqual([snaps[1], snaps[2]]);
  });

  it('mode center: translate la fenêtre de fullWidth / 2', () => {
    // Imaginons que left=0 soit le "centre"
    const snaps: SnapDom[] = [
      makeSnap(-150, 100),
      makeSnap(-50, 100), // celui qu’on veut voir centré
      makeSnap(150, 100),
    ];

    // currentTranslate = 0, fullWidth = 300
    // en mode center, leftInView = left + 0 + 150
    // positions projetées : 0, 100, 300
    const visible = extractVisibleSlides(snaps, 0, 300, undefined, true);

    // -150 → 0..100
    // -50  → 100..200
    // 150  → 300..400 (touche pile le bord)
    // avec la condition >0 / <fullWidth, le dernier doit être exclu
    expect(visible).toEqual([snaps[0], snaps[1]]);
  });

  it('offset décale correctement la fenêtre en plus du center', () => {
    const snaps: SnapDom[] = [makeSnap(-50, 100)];

    // sans offset : leftInView = -50 + 0 + 150 = 100 → visible
    let visible = extractVisibleSlides(snaps, 0, 300, 0, true);
    expect(visible.length).toBe(1);

    // avec offset 200 : leftInView = -50 + 0 + 150 - 200 = -100
    // rightInView = 0 → ne passe plus le test > 0
    visible = extractVisibleSlides(snaps, 0, 300, 200, true);
    expect(visible.length).toBe(0);
  });
});

describe('clampBetween', () => {
  it('clamps with ordered bounds', () => {
    expect(clampBetween(12, 0, 10)).toBe(10);
    expect(clampBetween(-2, 0, 10)).toBe(0);
    expect(clampBetween(5, 0, 10)).toBe(5);
  });

  it('clamps with reversed bounds', () => {
    expect(clampBetween(12, 10, 0)).toBe(10);
    expect(clampBetween(-2, 10, 0)).toBe(0);
    expect(clampBetween(5, 10, 0)).toBe(5);
  });
});

describe('fixed slide size helpers', () => {
  it('computes the numeric slide size for fixed slidesPerView', () => {
    expect(getFixedSlideSize(700, 3.5, 10)).toBeCloseTo(
      (700 - 10 * 2.5) / 3.5,
    );
  });

  it('generates the matching CSS grid size for fixed slidesPerView', () => {
    expect(getFixedSlideSizeCss(3.5, 10)).toBe(
      'calc((100% - 25px) / 3.5)',
    );
  });
});
