import { Injectable, NgZone, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CarouselStore } from '../carousel.store';
import { Carousel } from '../models/carousel.model';
import { getFixedSlideSizeCss } from '../helpers/calculations.helper';

type CarouselBreakpoints = Record<string, Partial<Carousel>>;

@Injectable()
export class CarouselBreakpointService {
  private readonly store = inject(CarouselStore);
  private readonly ngZone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private readonly window: Window | null = this.document?.defaultView ?? null;

  private mediaQueryListeners: {
    mql: MediaQueryList;
    listener: (e: MediaQueryListEvent) => void;
  }[] = [];

  /**
   * Generate CSS to apply breakpoints on SSR.
   */
  generateCss(
    breakpoints: CarouselBreakpoints | undefined,
    uniqueCarouselId: string
  ): string {
    if (!breakpoints || this.store.slidesPerView() === 'auto') {
      return '';
    }

    let css = '<style>';
    const baseSlidesPerView = this.store.slidesPerView() as number;
    const baseSpaceBetween = this.store.spaceBetween();

    Object.keys(breakpoints).forEach((query) => {
      // Validate media query contains only safe characters
      if (!/^[\w\s():\-,\.]+$/.test(query)) {
        console.warn('[Carousel] Invalid media query skipped:', query);
        return;
      }

      const config = breakpoints[query] ?? {};
      const slidesPerView: number =
        (typeof config.slidesPerView === 'number'
          ? config.slidesPerView
          : baseSlidesPerView) as number;
      const spaceBetween: number = config.spaceBetween ?? baseSpaceBetween;

      const columns = this.getGridColumnsValue(slidesPerView, spaceBetween);

      css += `
        @media ${query} {
          .slides.${uniqueCarouselId} {
            grid-auto-columns: ${columns} !important;
            gap: ${spaceBetween}px !important;
          }
        }
      `;
    });

    css += '</style>';
    return css;
  }

  /**
   * Create matchMedia listeners for each breakpoint.
   */
  setupMediaQueryListeners(
    breakpoints: CarouselBreakpoints | undefined,
    onMatch: (config: Partial<Carousel>) => void
  ): void {
    if (!this.window || !breakpoints) {
      return;
    }

    this.clear();

    Object.keys(breakpoints).forEach((query) => {
      const mql = this.window!.matchMedia(query);
      const config = breakpoints[query];

      const listener = (e: MediaQueryListEvent) => {
        this.ngZone.run(() => {
          if (e.matches) {
            onMatch(config);
          }
        });
      };

      mql.addEventListener('change', listener);
      this.mediaQueryListeners.push({ mql, listener });
    });
  }

  /**
   * Remove listeners.
   */
  clear(): void {
    this.mediaQueryListeners.forEach(({ mql, listener }) => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', listener);
      }
    });
    this.mediaQueryListeners = [];
  }

  private getGridColumnsValue(
    slidesPerView: number,
    spaceBetween: number
  ): string {
    return getFixedSlideSizeCss(slidesPerView, spaceBetween);
  }
}
