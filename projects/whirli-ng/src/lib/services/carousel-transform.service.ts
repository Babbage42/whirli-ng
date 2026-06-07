import { inject, Injectable, Injector, Renderer2 } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import {
  CAROUSEL_VIEW,
  CarouselViewActions,
} from '../components/carousel/view-adapter';
import { clampBetween } from '../helpers/calculations.helper';

@Injectable()
export class CarouselTransformService {
  private store = inject(CarouselStore, { self: true });
  private injector = inject(Injector);

  private get view(): CarouselViewActions {
    return this.injector.get(CAROUSEL_VIEW);
  }

  public getNewPositionFromTranslate() {
    const currentTranslate = this.store.currentTranslate();
    let closestIndex = 0;

    if (
      !this.store.loop() &&
      ((this.store.currentPosition() >= this.store.lastSlideAnchor() &&
        currentTranslate <= this.store.maxTranslate()) ||
        (this.store.currentPosition() <= this.store.firstSlideAnchor() &&
          currentTranslate >= this.store.minTranslate()))
    ) {
      // We have extra translation to left or right.
      closestIndex = this.store.currentPosition();
    } else {
      let smallestDiff = Infinity;
      const snapPoints = this.store.slideTranslates();

      let base = 0;
      if (this.store.virtual()) {
        const startIndex = this.store.loop()
          ? this.store.virtualLoopStart()
          : this.store.currentVirtualRange().start;
        base = snapPoints[startIndex] ?? 0;
      }

      for (let i = 0; i < snapPoints.length; i++) {
        const snap = (snapPoints[i] ?? 0) - base;
        const diff = Math.abs(currentTranslate - snap);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestIndex = i;
        }
      }
      closestIndex = this.getRealPositionFromExactPosition(closestIndex);
    }

    const isNewPosition =
      Math.abs(this.store.currentPosition() - closestIndex) >
      this.store.state().dragThresholdRatio;

    return {
      exactPosition: closestIndex,
      position: isNewPosition ? Math.round(closestIndex) : undefined,
    };
  }

  public getRealPositionFromExactPosition(position: number) {
    const roundPosition = Math.round(position);
    const realPosition = this.store.slidesIndexOrder()[roundPosition];

    if (realPosition === undefined) {
      return Math.round(position);
    }

    // We keep exact decimal part of position and add it to real position.
    const decimalPart = position - roundPosition;
    position = realPosition + decimalPart;
    return position;
  }

  /**
   * Get posX from slide index position.
   * @param index
   * @returns
   */
  public getTranslateFromPosition(
    index = this.store.currentRealPosition(),
  ): number {
    const snaps = this.store.slideTranslates();
    let posX = snaps[index];

    if (this.store.virtual()) {
      const startIndex = this.store.loop()
        ? this.store.virtualLoopStart()
        : this.store.currentVirtualRange().start;

      const base = snaps[startIndex] ?? 0;
      posX = (posX ?? 0) - base;
    }

    if (this.store.loop()) {
      // Authorize any translation without restriction.
      return posX;
    }

    // If not loop, we restrict translation to min and max.
    return this.clampTranslateValue(posX);
  }

  private clampTranslateValue(posX: number) {
    return clampBetween(
      posX,
      this.store.maxTranslate(),
      this.store.minTranslate(),
    );
  }

  public calculateInitialTranslations() {
    const realInitialSlide = this.store.state().initialSlide;
    const currentIndex =
      this.store.currentPosition() != -1 &&
      this.store.currentPosition() !== realInitialSlide
        ? this.store.currentPosition()
        : realInitialSlide;
    if (this.store.center()) {
      //@todo issue with initialslide
      const translateToApply = currentIndex
        ? this.getTranslateFromPosition(currentIndex)
        : this.store.minTranslate();
      this.view.updateTransform(translateToApply, false, false, false);
    } else {
      this.view.updateTransform(
        this.getTranslateFromPosition(currentIndex),
        false,
        false,
        false,
      );
    }
  }

  public calculateTargetPositionAfterTranslation(
    isReachEnd: boolean,
    isReachStart: boolean,
  ): { position: number; exactPosition: number } {
    const { position, exactPosition } = this.getNewPositionFromTranslate();

    const realPosition = this.getVirtualPositionFromExactPosition(
      position ?? this.store.currentPosition(),
    );

    const virtualPosition =
      this.getVirtualPositionFromExactPosition(exactPosition);
    const currentVirtualPosition = this.getVirtualPositionFromExactPosition(
      this.store.currentPosition(),
    );

    if (isReachEnd) {
      return this.handleEndReached(
        realPosition,
        exactPosition,
        virtualPosition,
        currentVirtualPosition,
      );
    }

    if (isReachStart) {
      return this.handleStartReached(
        realPosition,
        exactPosition,
        virtualPosition,
        currentVirtualPosition,
      );
    }

    return {
      position: realPosition,
      exactPosition: realPosition,
    };
  }

  private handleEndReached(
    position: number | undefined,
    exactPosition: number,
    virtualPosition: number,
    currentVirtualPosition: number,
  ): { position: number; exactPosition: number } {
    if (virtualPosition > currentVirtualPosition) {
      // Maximum reached.
      if (this.store.state().rewind) {
        return {
          position: 0,
          exactPosition: 0,
        };
      }
      return {
        position: Math.ceil(exactPosition),
        exactPosition: this.store.currentRealPosition(),
      };
    }
    return {
      position: position ?? this.store.currentPosition(),
      exactPosition: this.store.currentRealPosition(),
    };
  }

  private handleStartReached(
    position: number | undefined,
    exactPosition: number,
    virtualPosition: number,
    currentVirtualPosition: number,
  ): { position: number; exactPosition: number } {
    if (virtualPosition < currentVirtualPosition) {
      // Minimum reached.
      if (this.store.state().rewind) {
        return {
          position: this.store.totalSlides() - 1,
          exactPosition: this.store.totalSlides() - 1,
        };
      }
      return {
        position: Math.floor(exactPosition),
        exactPosition: this.store.currentRealPosition(),
      };
    }
    return {
      position: position ?? this.store.currentPosition(),
      exactPosition: this.store.currentRealPosition(),
    };
  }

  private getVirtualPositionFromExactPosition(position: number) {
    const roundPosition = Math.round(position);
    const virtualPosition = this.store
      .slidesIndexOrder()
      .indexOf(roundPosition);
    // We keep exact decimal part of position and add it to real position.
    const decimalPart = position - roundPosition;
    position = virtualPosition + decimalPart;
    return position;
  }
}
