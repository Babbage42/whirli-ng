import {
  ElementRef,
  Injectable,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { THUMBS_TRANSITION_DURATION_MS } from '../models/carousel.model';

@Injectable()
export class CarouselThumbsService {
  private readonly store = inject(CarouselStore);

  readonly indicatorLeft = signal(0);
  readonly indicatorWidth = signal(0);
  readonly transitionDuration = signal(0);

  readonly defaultThumbsState = {
    slidesPerView: 7,
    center: false,
    loop: false,
    draggable: true,
    canSwipe: true,
    showControls: true,
    pagination: undefined,
    slideOnClick: true,
    navigateSlideBySlide: true,
    resistance: false,
    peekEdges: {
      relativeOffset: 0.5,
    },
    thumbsOptions: {
      selectionBar: true,
    },
  };

  updateIndicator(
    index: number | undefined,
    slides: ReadonlyArray<ElementRef<HTMLElement>>,
    container?: HTMLElement,
  ): void {
    if (!this.store.thumbsOptions()?.selectionBar) {
      return;
    }
    if (index === undefined || index < 0) {
      return;
    }

    this.store.currentTranslate();

    const active = slides[index]?.nativeElement;
    if (!container || !active) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    const offset = untracked(
      () =>
        activeRect.left - containerRect.left + this.store.currentTranslate(),
    );

    untracked(() => {
      this.indicatorLeft.set(offset);
      this.indicatorWidth.set(activeRect.width);
    });
  }

  enableTransition(customTransition?: number): void {
    if (!this.store.thumbsOptions()?.selectionBar) {
      return;
    }

    const duration = customTransition ?? THUMBS_TRANSITION_DURATION_MS;
    this.transitionDuration.set(duration);
    setTimeout(() => this.disableTransition(), duration);
  }

  disableTransition(): void {
    this.transitionDuration.set(0);
  }
}
