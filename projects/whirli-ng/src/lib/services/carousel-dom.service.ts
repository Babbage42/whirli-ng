import { inject, Injectable, Renderer2 } from '@angular/core';
import { CarouselStore } from '../carousel.store';

export const DEFAULT_IMAGES_TO_LOAD = 6;

@Injectable()
export class CarouselDomService {
  private store = inject(CarouselStore);
  constructor(private renderer: Renderer2) {}

  /**
   * Add class to identify slides roles and states.
   * @returns
   */
  updateSlides() {
    if (!this.store.allSlides()) {
      return;
    }

    const domSlides = this.store.domSlides();
    const slides =
      domSlides.length > 0
        ? domSlides
        : (this.store.slidesElements()?.map((slide) => slide.nativeElement) ??
          []);

    if (slides.length) {
      slides.forEach((slide: HTMLElement, index: number) => {
        const logicalIndex = this.getLogicalIndex(index);
        this.resetPositions(slide, logicalIndex);
        this.setPositionState(slide, logicalIndex);
        this.setAccessibility(slide, logicalIndex);
        this.setLazyLoading(slide, logicalIndex);
      });
    }
  }

  private setLazyLoading(slide: HTMLElement, index: number) {
    const state = this.store.state();

    if (!state.lazyLoading) {
      return;
    }

    const images = Array.from(slide.querySelectorAll('img'));
    if (!images?.length) {
      return;
    }

    const total = this.store.totalSlides();
    if (!total) {
      return;
    }

    const current = this.store.currentPosition();
    const loop = state.loop;
    const center = state.center;

    const slidesPerView = this.store.slidesPerView();
    const windowSize =
      typeof slidesPerView === 'number'
        ? Math.max(1, Math.ceil(slidesPerView))
        : DEFAULT_IMAGES_TO_LOAD;

    let isEager = false;

    if (!center) {
      if (!loop) {
        const minIndex = current;
        const maxIndex = Math.min(current + windowSize - 1, total - 1);
        isEager = index >= minIndex && index <= maxIndex;
      } else {
        const diff = (index - current + total) % total;
        isEager = diff >= 0 && diff <= windowSize - 1;
      }
    } else {
      const radius = Math.floor(windowSize / 2);
      let diff = Math.abs(index - current);

      if (loop) {
        diff = Math.min(diff, total - diff);
      }

      isEager = diff <= radius;
    }

    images.forEach((image) => {
      this.renderer.setProperty(image, 'loading', isEager ? 'eager' : 'lazy');
    });
  }

  private resetPositions(slide: HTMLElement, index: number) {
    // Remove any existing position-* class before setting the new one
    slide.classList.forEach((cls) => {
      if (cls.startsWith('position-')) {
        this.renderer.removeClass(slide, cls);
      }
    });
    this.renderer.removeClass(slide, 'prev');
    this.renderer.removeClass(slide, 'curr');
    this.renderer.removeClass(slide, 'next');
    this.renderer.addClass(slide, 'position-' + (index + 1));
  }

  private setPositionState(slide: HTMLElement, index: number) {
    const total = this.store.totalSlides();
    const current = this.store.currentPosition();
    if (!total || current < 0) {
      return;
    }

    if (index === current) {
      this.renderer.addClass(slide, 'curr');
      return;
    }

    const loop = this.store.loop();
    const previous = current > 0 ? current - 1 : loop ? total - 1 : -1;
    const next = current < total - 1 ? current + 1 : loop ? 0 : -1;

    if (index === previous) {
      this.renderer.addClass(slide, 'prev');
    }
    if (index === next) {
      this.renderer.addClass(slide, 'next');
    }
  }

  private setAccessibility(slide: HTMLElement, index: number) {
    this.renderer.setAttribute(slide, 'role', 'group');
    this.renderer.setAttribute(slide, 'aria-roledescription', 'slide');
    const total = this.store.totalSlides();
    this.renderer.setAttribute(
      slide,
      'aria-label',
      this.store.a11y().slideLabel?.({ index, total }) ??
        `${index + 1} of ${total}`,
    );
    this.renderer.setAttribute(
      slide,
      'tabindex',
      index === this.store.currentPosition() ? '0' : '-1',
    );
  }

  private getLogicalIndex(domIndex: number): number {
    if (this.store.virtual()) {
      return this.store.renderedIndices()?.[domIndex] ?? domIndex;
    }
    return this.store.slidesIndexOrder()?.[domIndex] ?? domIndex;
  }
}
