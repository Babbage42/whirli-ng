import { ElementRef, Injectable, inject } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { CarouselNavigationService } from './carousel-navigation.service';

// Callbacks to trigger actions from the carousel component
type KeyboardActions = {
  slideToNext: () => void;
  slideToPrev: () => void;
  slideTo: (index: number) => void;
  initTouched: () => void;
};

@Injectable()
export class CarouselKeyboardService {
  private readonly store = inject(CarouselStore);
  private readonly navigationService = inject(CarouselNavigationService);

  handleKeyDown(
    event: KeyboardEvent,
    keyboardNavigation: boolean,
    slides: ReadonlyArray<ElementRef<HTMLElement>>,
    actions: KeyboardActions,
    debug = false,
  ): void {
    if (!keyboardNavigation) {
      return;
    }

    const handled = this.handleNavigationKey(event, actions);

    if (!handled) {
      return;
    }

    this.focusCurrentSlide(slides, debug);
    event.preventDefault();
    actions.initTouched();
  }

  private handleNavigationKey(
    event: KeyboardEvent,
    actions: KeyboardActions,
  ): boolean {
    const isRtl = this.store.isRtl();

    if (this.store.isVertical()) {
      if (event.key === 'ArrowDown') {
        actions.slideToNext();
        return true;
      }
      if (event.key === 'ArrowUp') {
        actions.slideToPrev();
        return true;
      }
      return false;
    }

    if (
      (event.key === 'ArrowRight' && !isRtl) ||
      (event.key === 'ArrowLeft' && isRtl)
    ) {
      actions.slideToNext();
      return true;
    }

    if (
      (event.key === 'ArrowLeft' && !isRtl) ||
      (event.key === 'ArrowRight' && isRtl)
    ) {
      actions.slideToPrev();
      return true;
    }

    if (event.key === 'Home') {
      const firstEnabled =
        this.navigationService.findNextEnabledIndex(-1, +1) ?? 0;
      actions.slideTo(firstEnabled);
      return true;
    }

    if (event.key === 'End') {
      const lastIndex = this.store.totalSlides() - 1;
      const lastEnabled =
        this.navigationService.findNextEnabledIndex(0, -1) ?? lastIndex;
      actions.slideTo(lastEnabled);
      return true;
    }

    return false;
  }

  private focusCurrentSlide(
    slides: ReadonlyArray<ElementRef<HTMLElement>>,
    debug: boolean,
  ): void {
    const pos = this.store.currentPosition();

    if (!slides || pos < 0 || pos >= slides.length) {
      if (debug) {
        console.warn('[Carousel] Cannot focus slide at invalid position', pos);
      }
      return;
    }

    slides[pos]?.nativeElement.focus?.();
  }
}
