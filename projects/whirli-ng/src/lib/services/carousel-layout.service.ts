import { ElementRef, Injectable } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { CarouselLoopService } from './carousel-loop.service';
import { CarouselVirtualService } from './carousel-virtual.service';
import { rafThrottle } from '../helpers/raf-throttle.helper';

@Injectable()
export class CarouselLayoutService {
  private containerResizeObserver?: ResizeObserver;
  private slideResizeObserver?: ResizeObserver;
  private resizeTimeout?: ReturnType<typeof setTimeout>;
  private lastResizeTime = 0;
  private readonly resizeThrottleMs = 250;

  constructor(
    private readonly store: CarouselStore,
    private readonly loopService: CarouselLoopService,
    private readonly virtualService: CarouselVirtualService,
  ) {}

  updateLayoutFromSlides(
    slidesEls: ReadonlyArray<ElementRef<HTMLElement>>,
  ): boolean {
    if (!slidesEls.length) {
      return false;
    }

    const firstSize = this.store
      .axisConf()
      .rectSize(slidesEls[0]?.nativeElement);
    if (!firstSize) {
      return false;
    }

    this.store.patch({
      slidesElements: [...slidesEls],
    });

    this.loopService.initializeLoopCenter();
    this.virtualService.initVirtualWindow();

    return true;
  }

  observeContainerResize(
    container: HTMLElement | undefined,
    refresh: () => void,
  ): void {
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.containerResizeObserver = new ResizeObserver((entries) => {
      const now = Date.now();

      // Ignore resize events if last resize was too recent
      if (now - this.lastResizeTime < this.resizeThrottleMs) {
        return;
      }

      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (Math.abs(newWidth - this.store.fullWidth()) <= 1) {
          continue;
        }

        this.lastResizeTime = now;
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          // Force a full slide-widths re-measure (covers cases where the
          // per-slide ResizeObserver doesn't fire
          this.store.bumpResizeTick();
          refresh();
        }, 120);
        break;
      }
    });

    this.containerResizeObserver.observe(container);
  }

  observeSlidesResize(
    slidesEls: ReadonlyArray<ElementRef<HTMLElement>>,
    canRefresh: () => boolean,
    refreshLayout: () => void,
  ): void {
    if (!slidesEls.length || typeof ResizeObserver === 'undefined') {
      return;
    }

    if (!this.slideResizeObserver) {
      const callback = rafThrottle(() => {
        if (canRefresh()) {
          refreshLayout();
        }
      });

      this.slideResizeObserver = new ResizeObserver(() => callback());
    }

    this.slideResizeObserver.disconnect();

    slidesEls.forEach((el) =>
      this.slideResizeObserver!.observe(el.nativeElement),
    );
  }

  disconnectObservers(): void {
    this.containerResizeObserver?.disconnect();
    this.slideResizeObserver?.disconnect();
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = undefined;
  }
}
