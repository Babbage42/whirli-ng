import { inject, Injectable, Injector, Renderer2 } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import {
  CAROUSEL_VIEW,
  CarouselViewActions,
} from '../components/carousel/view-adapter';
import { extractVisibleSlides } from '../helpers/calculations.helper';
import { CAROUSEL_SLIDE_CLASS, SnapDom } from '../models/carousel.model';
import { positiveModulo } from '../helpers/utils.helper';

@Injectable()
export class CarouselLoopService {
  private store = inject(CarouselStore);
  private renderer = inject(Renderer2);
  private injector = inject(Injector);

  private get view(): CarouselViewActions {
    return this.injector.get(CAROUSEL_VIEW);
  }

  private get firstVisibleSlide() {
    return this.store.visibleDom()?.[0];
  }
  private get lastVisibleSlide() {
    return this.store.visibleDom()?.[this.store.visibleDom().length - 1];
  }

  private insertElement(before = true) {
    const slides = this.store.domSlides();

    const container = this.store.allSlides()?.nativeElement;
    if (!container) {
      return undefined;
    }

    const indexToInsert = before ? this.store.totalSlides() - 1 : 0;
    const index = this.store.slidesIndexOrder()[indexToInsert];
    const width = this.store.slidesWidths()[index];
    const elementToInsert = slides[indexToInsert] as HTMLElement | undefined;

    if (!elementToInsert) {
      return undefined;
    }

    if (before) {
      const firstReal = container.querySelector(
        '.' + CAROUSEL_SLIDE_CLASS,
      ) as HTMLElement | null;
      if (!firstReal) {
        return undefined;
      }
      try {
        this.renderer.removeChild(container, elementToInsert);
      } catch (e) {
        // Element not in container, that's ok
        console.warn(
          '[Carousel] Element not in container during loop insertion',
          e,
        );
      }
      this.renderer.insertBefore(container, elementToInsert, firstReal);
    } else {
      this.renderer.appendChild(container, elementToInsert);
    }

    const slidesIndexOrder = this.store.slidesIndexOrder();

    const value = (
      before ? slidesIndexOrder.pop() : slidesIndexOrder.shift()
    ) as number;
    this.store.patch({
      slidesIndexOrder: before
        ? [value, ...slidesIndexOrder]
        : [...slidesIndexOrder, value],
    });

    const offset = before
      ? -this.store.slidesWidths()[value] - this.store.state().spaceBetween
      : this.store.slidesWidths()[value] + this.store.state().spaceBetween;

    this.applyTranslate(this.store.currentTranslate() + offset);

    this.store.patch({
      lastTranslate: this.store.lastTranslate() + offset,
    });

    return { width, offset };
  }

  /**
   * When moving slides manually.
   */
  public insertLoopSlidesByTranslation() {
    if (!this.isLooping()) {
      return;
    }

    const [leftEdge, rightEdge] = [
      this.store.currentTranslate(),
      this.store.currentTranslate() + this.store.scrollWidth(),
    ];

    const viewportWidth = this.store.fullWidth();

    const buffer = 50;

    if (leftEdge > -buffer) {
      this.insertElement(true);
    }

    if (rightEdge < viewportWidth + buffer) {
      this.insertElement(false);
    }
  }

  /**
   * By prev or next button. Handle stepslides.
   * @param before
   */
  public insertLoopSlidesByNavigation(before = true) {
    if (!this.isLooping()) {
      return;
    }

    const leftmostDom = this.firstVisibleSlide;
    const rightmostDom = this.lastVisibleSlide;
    const leftMostIndex = leftmostDom.domIndex;
    const rightMostIndex = rightmostDom.domIndex;
    const slidesAvailableBefore = leftMostIndex;
    const slidesAvailableAfter = this.store.totalSlides() - rightMostIndex - 1;

    if (
      before === true &&
      slidesAvailableBefore < this.store.state().stepSlides
    ) {
      const slidesToInsertBefore =
        this.store.state().stepSlides - slidesAvailableBefore;

      for (let i = 1; i <= slidesToInsertBefore; i++) {
        this.insertElement(before);
      }
    }
    if (
      before === false &&
      slidesAvailableAfter < this.store.state().stepSlides
    ) {
      const slidesToInsertAfter =
        this.store.state().stepSlides - slidesAvailableAfter;

      for (let i = 1; i <= slidesToInsertAfter; i++) {
        this.insertElement(before);
      }
    }
  }

  /**
   * Direct click on slide.
   * @param indexSlided
   */
  public insertLoopSlidesBySlidingTo(indexSlided: number) {
    if (!this.isLooping()) {
      return;
    }

    const state = this.store.state();
    const futureTranslate = this.store.slideTranslates()[indexSlided];
    const currentTranslate = this.store.currentTranslate();
    const translateDiff = currentTranslate - futureTranslate;

    if (Math.abs(translateDiff) < 1) {
      return;
    }

    const modifiedVisibleDoms = extractVisibleSlides(
      this.store.snapsDom(),
      currentTranslate,
      state.fullWidth,
      translateDiff,
      this.store.center(),
    );

    if (!modifiedVisibleDoms.length) {
      return;
    }

    const leftmostDom = modifiedVisibleDoms[0];
    const rightmostDom = modifiedVisibleDoms[modifiedVisibleDoms.length - 1];

    const leftEdge = leftmostDom.translate;
    const rightEdge = rightmostDom.translate + rightmostDom.width;
    const visibleSpan = Math.abs(rightEdge - leftEdge);

    const offset = state.fullWidth - visibleSpan;
    if (offset <= 0) {
      return;
    }

    const insertElement = (before = true) => {
      let mainOffset = offset;
      const firstInserted = this.insertElement(before);

      if (firstInserted) {
        mainOffset -= firstInserted.width + state.spaceBetween;

        let stop = false;
        while (mainOffset > 0 && !stop) {
          const inserted = this.insertElement(before);
          if (!inserted) {
            stop = true;
            continue;
          }
          mainOffset -= inserted.width + state.spaceBetween;
        }
      }
    };

    const shouldInsertBefore = leftmostDom.domIndex === 0;
    const shouldInsertAfter =
      rightmostDom.domIndex >= this.store.totalSlides() - 1;

    if (shouldInsertBefore) {
      insertElement(true);
    }

    if (shouldInsertAfter) {
      insertElement(false);
    }
  }

  private isLooping() {
    if (!this.store.loop()) {
      return false;
    }

    if (this.store.visibleDom().length === 0) {
      return false;
    }

    if (this.store.virtual()) {
      return false;
    }

    return true;
  }

  private forceReflow() {
    this.store.allSlides()?.nativeElement?.getBoundingClientRect?.();
  }

  private applyTranslate(translate: number) {
    this.view.disableTransition();
    this.view.updateTransform(translate, false, true, false);
    this.forceReflow();
  }

  /**
   * Pre-populates the DOM for loop mode on initialization.
   * This is crucial for modes like 'center' to work from the start,
   * by ensuring the initial slide has slides before it in the DOM.
   */
  public initializeLoopCenter(): void {
    const state = this.store.state();

    if (!this.store.loop() || !this.store.center()) {
      return;
    }

    const totalSlides = this.store.totalSlides();
    if (totalSlides === 0 || !state.allSlides) {
      return;
    }

    const initialSlideWidth =
      this.store.slidesWidths()[state.initialSlide] ?? 0;
    const spaceToFill =
      state.fullWidth / 2 - initialSlideWidth / 2 - state.marginStart;

    if (spaceToFill <= 0) {
      return;
    }

    let widthFilled = 0;
    let slidesInserted = 0;

    while (widthFilled < spaceToFill && slidesInserted < totalSlides - 1) {
      const inserted = this.insertElement(true);

      if (inserted) {
        widthFilled += inserted.width + state.spaceBetween;
      }
      slidesInserted++;
    }
  }
}
