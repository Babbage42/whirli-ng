// carousel-physics.service.ts
import { inject, Injectable, DestroyRef } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import { clampBetween } from '../helpers/calculations.helper';

interface InertiaConfig {
  baseFriction: number;
  edgeFriction: number;
  minVelocity: number;
}

@Injectable()
export class CarouselPhysicsService {
  private readonly store = inject(CarouselStore);
  private readonly destroyRef = inject(DestroyRef);

  private animationFrameId?: number;

  private readonly DEFAULT_CONFIG: InertiaConfig = {
    baseFriction: 0.93,
    edgeFriction: 0.8,
    minVelocity: 0.5,
  };

  constructor() {
    this.destroyRef.onDestroy(() => this.cancel());
  }

  applyInertia(
    config: InertiaConfig = this.DEFAULT_CONFIG,
    onUpdate?: (translate: number) => void
  ) {
    this.cancel();

    const step = () => {
      const velocity = this.store.state().velocity;

      if (Math.abs(velocity) < config.minVelocity) {
        return;
      }

      const friction = this.isAtEdge()
        ? config.edgeFriction
        : config.baseFriction;
      const newVelocity = velocity * friction;
      const newTranslate = this.store.currentTranslate() + velocity;

      const clampedTranslate = clampBetween(
        newTranslate,
        this.store.state().maxTranslate,
        this.store.state().minTranslate
      );

      this.store.patch({
        currentTranslate: clampedTranslate,
        velocity: newVelocity,
      });

      onUpdate?.(clampedTranslate);

      this.animationFrameId = requestAnimationFrame(step);
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  cancel() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  private isAtEdge(): boolean {
    const translate = this.store.currentTranslate();
    return (
      translate <= this.store.state().maxTranslate ||
      translate >= this.store.state().minTranslate
    );
  }
}
