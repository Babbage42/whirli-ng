import { inject, Injectable } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { positiveModulo } from '../helpers/utils.helper';
import { CarouselLoopService } from './carousel-loop.service';
import { CarouselVirtualService } from './carousel-virtual.service';

@Injectable()
export class CarouselNavigationService {
  private readonly loopService = inject(CarouselLoopService);
  private readonly store = inject(CarouselStore);
  private readonly virtualService = inject(CarouselVirtualService);

  /**
   * Calculate new index after prev or next action.
   * @param isSlidingNext
   * @returns
   */
  public calculateNewPositionAfterNavigation(isSlidingNext = true) {
    if (this.store.navigateSlideBySlide()) {
      const newIndex = isSlidingNext
        ? this.store.currentRealPosition() + this.store.state().stepSlides
        : this.store.currentRealPosition() - this.store.state().stepSlides;

      if (this.store.rewind()) {
        return newIndex;
      }

      return Math.max(0, Math.min(newIndex, this.store.totalSlides() - 1));
    }

    const newIndex = isSlidingNext
      ? this.store.currentPosition() + this.store.state().stepSlides
      : this.store.currentPosition() - this.store.state().stepSlides;

    if (this.store.loop()) {
      return positiveModulo(newIndex, this.store.totalSlides());
    }

    if (this.store.rewind()) {
      return newIndex;
    }

    // Only clamp when there's no loop and no rewind (hard stop at bounds)
    return Math.max(
      this.store.firstSlideAnchor(),
      Math.min(newIndex, this.store.lastSlideAnchor()),
    );
  }

  public isSlideDisabled(index: number): boolean {
    const slidesInput = this.store.slides();
    if (slidesInput && slidesInput.length) {
      return !!slidesInput[index]?.disabled;
    }

    const projected = this.store.state().projectedSlides ?? [];
    if (projected.length) {
      return !!projected[index]?.slideDisabled();
    }

    return false;
  }

  /**
   * Get next activated index from given index in given direction.
   */
  public findNextEnabledIndex(from: number, direction: 1 | -1): number {
    const total = this.store.totalSlides();
    if (!total) return from;

    const canWrap = this.store.loop() || this.store.rewind();

    let index = from;
    for (let i = 0; i < total; i++) {
      const nextRaw = index + direction;
      if (!canWrap && (nextRaw < 0 || nextRaw >= total)) {
        return from;
      }
      index = positiveModulo(nextRaw, total);
      if (!this.isSlideDisabled(index)) {
        return index;
      }
    }

    return from;
  }

  public getNextIndex() {
    this.loopService.insertLoopSlidesByNavigation(false);
    this.virtualService.syncVirtualSlides();

    // Calculate where we WOULD go
    const newPosition = this.calculateNewPositionAfterNavigation(true);

    // Check if this would exceed the bounds and we should rewind
    if (this.store.rewind() && !this.store.loop()) {
      const wouldExceedEnd = newPosition > this.store.lastSlideAnchor();
      if (wouldExceedEnd) {
        // Rewind to firstSlideAnchor (which is 0 for normal mode, or floor(spv/2) for notCenterBounds)
        const rewindIndex = this.store.firstSlideAnchor();
        return this.isSlideDisabled(rewindIndex)
          ? this.findNextEnabledIndex(rewindIndex, +1)
          : rewindIndex;
      }
    }

    return this.isSlideDisabled(newPosition)
      ? this.findNextEnabledIndex(this.store.currentPosition(), +1)
      : newPosition;
  }

  public getPrevIndex() {
    this.loopService.insertLoopSlidesByNavigation(true);
    this.virtualService.syncVirtualSlides();

    let indexSlided = undefined;
    if (this.store.state().stepSlides > 1) {
      indexSlided =
        this.store.state().currentPosition -
        (this.store.state().stepSlides - 1) -
        1;
      indexSlided = positiveModulo(indexSlided, this.store.totalSlides());
    }

    const hasReachedStart = this.store.hasReachedStart();
    let newPosition: number | undefined = undefined;
    if (hasReachedStart && this.store.rewind()) {
      newPosition = this.store.lastSlideAnchor();
    } else {
      newPosition = this.calculateNewPositionAfterNavigation(false);
    }

    newPosition = this.isSlideDisabled(newPosition)
      ? this.findNextEnabledIndex(this.store.currentPosition(), -1)
      : newPosition;

    return newPosition;
  }
}
