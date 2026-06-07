import { Injectable, inject } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import {
  AutoplayOptions,
  DEFAULT_AUTOPLAY_OPTIONS,
} from '../models/carousel.model';

// The callbacks to trigger actions in the carousel component
type AutoplayCallbacks = {
  slideToNext: () => void;
  autoplayStart: () => void;
  autoplayStop: () => void;
  autoplayPause: () => void;
};

@Injectable()
export class CarouselAutoplayService {
  private readonly store = inject(CarouselStore);

  private timer?: ReturnType<typeof setInterval>;
  private stopped = false;
  private autoplayTick = false;

  get isAutoplayTick(): boolean {
    return this.autoplayTick;
  }

  start(callbacks: AutoplayCallbacks): void {
    if (this.stopped) {
      return;
    }

    const autoplay = this.getAutoplayOptions();
    if (!autoplay) {
      return;
    }

    this.clearTimer();
    this.timer = setInterval(() => {
      this.autoplayTick = true;
      try {
        callbacks.slideToNext();
      } finally {
        this.autoplayTick = false;
      }
    }, autoplay.delay);
    callbacks.autoplayStart();
  }

  pauseOnHover(callbacks: Pick<AutoplayCallbacks, 'autoplayPause'>): void {
    const autoplay = this.getAutoplayOptions();
    if (!autoplay || !autoplay.pauseOnHover || !this.timer) {
      return;
    }

    this.clearTimer();
    callbacks.autoplayPause();
  }

  resumeOnMouseLeave(callbacks: AutoplayCallbacks): void {
    const autoplay = this.getAutoplayOptions();
    if (!autoplay || !autoplay.resumeOnMouseLeave || this.timer) {
      return;
    }

    this.start(callbacks);
  }

  stop(callbacks: Pick<AutoplayCallbacks, 'autoplayStop'>): void {
    this.clearTimer();
    callbacks.autoplayStop();
  }

  stopOnInteraction(callbacks: Pick<AutoplayCallbacks, 'autoplayStop'>): void {
    const autoplay = this.getAutoplayOptions();
    if (!autoplay || !autoplay.stopOnInteraction || this.stopped) {
      return;
    }

    this.stopped = true;
    this.stop(callbacks);
  }

  destroy(callbacks: Pick<AutoplayCallbacks, 'autoplayStop'>): void {
    this.stop(callbacks);
  }

  private clearTimer(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = undefined;
  }

  private getAutoplayOptions(): AutoplayOptions | false {
    const autoplay = this.store.state().autoplay;
    if (!autoplay) {
      return false;
    }

    if (autoplay === true) {
      return DEFAULT_AUTOPLAY_OPTIONS;
    }

    return autoplay;
  }
}
