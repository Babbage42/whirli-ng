import { Injectable, Injector, inject } from '@angular/core';
import { CarouselStore } from '../carousel.store';
import {
  CAROUSEL_VIEW,
  CarouselViewActions,
} from '../components/carousel/view-adapter';
import { positiveModulo } from '../helpers/utils.helper';

type Range = { start: number; end: number };

@Injectable()
export class CarouselVirtualService {
  private readonly store = inject(CarouselStore);
  private readonly injector = inject(Injector);

  private get view(): CarouselViewActions {
    return this.injector.get(CAROUSEL_VIEW);
  }

  private isVirtualModeAllowed() {
    if (!this.store.virtual()) {
      return false;
    }
    return true;
  }

  initVirtualWindow() {
    const total = this.store.totalSlides();
    if (!this.isVirtualModeAllowed()) {
      this.store.patch({ virtualStart: 0, virtualEnd: Math.max(0, total - 1) });
      return;
    }

    if (this.store.loop()) {
      const slidesPerView =
        this.store.slidesPerView() === 'auto'
          ? Math.max(1, this.store.totalSlidesVisible() || 1)
          : (this.store.slidesPerView() as number);

      const buffer = this.store.virtualBuffer() ?? 1;
      const windowSize = Math.min(
        total,
        Math.ceil(slidesPerView * (1 + 2 * buffer)),
      );
      const half = Math.floor(windowSize / 2);

      const center = this.store.currentPosition();
      const start = center - half;

      this.store.patch({
        virtualLoopStart: positiveModulo(start, total),
      });
      return;
    }

    const target = this.clamp(this.store.virtualRange(), total);
    this.store.patch({
      virtualStart: target.start,
      virtualEnd: target.end,
    });
  }

  syncVirtualSlides(targetIndex?: number) {
    if (!this.isVirtualModeAllowed()) {
      return;
    }

    if (this.store.loop()) {
      this.rotateWindowIfNeeded(targetIndex);
      return;
    }

    const total = this.store.totalSlides();
    const target = this.clamp(this.store.virtualRange(), total);
    const current = this.store.currentVirtualRange();

    if (current.start <= target.start && current.end >= target.end) {
      return;
    }

    const finalTarget = this.clamp(target, total);
    this.recenterTo(finalTarget);
  }

  private recenterTo(target: Range) {
    const widths = this.store.slidesWidths();
    const gap = this.store.spaceBetween();

    const before = this.store.currentVirtualRange();
    const startDelta = target.start - before.start;

    if (startDelta !== 0) {
      const from = startDelta > 0 ? before.start : target.start;
      const to = startDelta > 0 ? target.start : before.start;

      let offset = 0;
      for (let i = from; i < to; i++) {
        offset += (widths[i] ?? 0) + gap;
      }

      this.store.patch({ virtualStart: target.start });

      const signedOffset = startDelta > 0 ? offset : -offset;
      this.applyTranslate(this.store.currentTranslate() + signedOffset);
    }

    // No translation impact for extra slide at end.
    const mid = this.store.currentVirtualRange();
    if (target.end !== mid.end) {
      this.store.patch({ virtualEnd: target.end });
    }

    const final = this.store.currentVirtualRange();
    if (final.start !== target.start || final.end !== target.end) {
      this.store.patch({ virtualStart: target.start, virtualEnd: target.end });
    }
  }

  private applyTranslate(translate: number) {
    this.view.disableTransition();
    this.view.updateTransform(translate, false, true, false);
    const rect = this.store
      .state()
      .allSlides?.nativeElement?.getBoundingClientRect?.();
    this.store.patch({
      lastTranslate: translate,
    });
  }

  private clamp(r: Range, total: number): Range {
    let start = Math.max(0, Math.min(r.start, total - 1));
    let end = Math.max(0, Math.min(r.end, total - 1));
    if (end < start) {
      end = start;
    }
    return { start, end };
  }

  private rotateWindowIfNeeded(targetIndex?: number) {
    if (targetIndex === this.store.currentPosition()) {
      return;
    }

    const total = this.store.totalSlides();
    if (!total) {
      return;
    }

    if (
      targetIndex !== undefined &&
      (targetIndex < 0 || targetIndex >= total)
    ) {
      console.error(
        `[Carousel] Invalid targetIndex: ${targetIndex}, total: ${total}`,
      );
      return;
    }

    const currentPos = this.store.currentPosition();
    const rendered = this.store.renderedIndices();
    if (!rendered.length) {
      return;
    }
    let domDelta: number | null = null;
    if (targetIndex !== undefined) {
      const domCurrentIndex = rendered.indexOf(currentPos);
      const domTargetIndex = rendered.indexOf(targetIndex);

      if (domCurrentIndex !== -1 && domTargetIndex !== -1) {
        domDelta = domTargetIndex - domCurrentIndex;
      }
    }

    const edgeAdjust = this.store.marginStart() - this.store.peekOffset();
    const leftEdge = this.store.currentTranslate();
    const rightEdge = this.store.currentTranslate() + this.store.scrollWidth();
    const viewport = this.store.fullWidth();

    const widths = this.store.slidesWidths();
    const gap = this.store.spaceBetween();

    const avgWidth = (() => {
      const w = widths.filter(
        (x) => typeof x === 'number' && x > 0,
      ) as number[];
      if (w.length) return w.reduce((a, b) => a + b, 0) / w.length;
      return viewport;
    })();

    const spv =
      this.store.slidesPerView() === 'auto'
        ? Math.max(1, this.store.totalSlidesVisible() || 1)
        : (this.store.slidesPerView() as number);

    const desiredPerSide =
      this.store.slidesPerView() === 'auto' ? 3 : Math.max(2, Math.ceil(spv));

    const maxPerSide = Math.max(1, Math.floor((rendered.length - 1) / 2));
    const B = Math.min(desiredPerSide, maxPerSide);

    const sumSidePx = (fromDomIndex: number, count: number, step: 1 | -1) => {
      let sum = 0;
      for (let i = 0; i < count; i++) {
        const domIndex = fromDomIndex + step * i;
        const logical = rendered[domIndex];
        const w = widths[logical];
        sum += (typeof w === 'number' && w > 0 ? w : avgWidth) + gap;
      }
      return sum;
    };

    const leftBufferPx = sumSidePx(0, B, 1);
    const rightBufferPx = sumSidePx(rendered.length - 1, B, -1);

    const start = this.store.virtualLoopStart();

    const apply = (newStart: number, offset: number) => {
      this.store.patch({ virtualLoopStart: newStart });
      const nextTranslate = this.store.currentTranslate() + offset;
      this.applyTranslate(nextTranslate);
    };

    const maxSteps = Math.max(1, rendered.length - 1);

    const sumOutgoing = (direction: -1 | 1, steps: number) => {
      steps = Math.max(1, Math.min(steps, maxSteps));
      let w = 0;

      if (direction === -1) {
        const domIndexOutgoing = this.store.slidesElements().length - 1;
        for (let i = 0; i < steps; i++) {
          const logical = rendered[domIndexOutgoing - i];
          const lw = widths[logical];
          w += (typeof lw === 'number' && lw > 0 ? lw : avgWidth) + gap;
        }
        return w;
      }

      const domIndexOutgoing = 0;
      for (let i = 0; i < steps; i++) {
        const logical = rendered[domIndexOutgoing + i];
        const lw = widths[logical];
        w += (typeof lw === 'number' && lw > 0 ? lw : avgWidth) + gap;
      }
      return w;
    };

    if (targetIndex !== undefined && domDelta !== null) {
      const steps = Math.min(Math.abs(domDelta), maxSteps);
      if (steps === 0) return;

      if (domDelta > 0) {
        const newStart = positiveModulo(start + steps, total);
        const w = sumOutgoing(1, steps);
        apply(newStart, w - edgeAdjust);
        return;
      } else {
        const newStart = positiveModulo(start - steps, total);
        const w = sumOutgoing(-1, steps);
        apply(newStart, -w + edgeAdjust);
        return;
      }
    }

    if (leftEdge > -leftBufferPx) {
      const steps = 1;
      const newStart = positiveModulo(start - steps, total);
      const w = sumOutgoing(-1, steps);
      apply(newStart, -w + edgeAdjust);
      return;
    }

    if (rightEdge < viewport + rightBufferPx) {
      const steps = 1;
      const newStart = positiveModulo(start + steps, total);
      const w = sumOutgoing(1, steps);
      apply(newStart, w - edgeAdjust);
      return;
    }
  }
}
