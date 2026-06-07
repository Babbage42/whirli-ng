import { CommonModule } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  output,
} from '@angular/core';
import { CarouselStore } from '../../carousel.store';

@Component({
  imports: [CommonModule],
  selector: 'whirli-pagination-ui',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  host: {
    '[class.vertical]': 'this.store.isVertical()',
    '[class.external-pagination]': 'this.store.pagination()?.external',
    '[class.track-pagination]': 'this.isTrackPagination()',
    '[class.carousel__pagination--dot]':
      'this.store.pagination()?.type === "dot"',
    '[class.carousel__pagination--dynamic-dot]':
      'this.store.pagination()?.type === "dynamic_dot"',
    '[class.carousel__pagination--fraction]':
      'this.store.pagination()?.type === "fraction"',
    '[class.carousel__pagination--progress]':
      'this.store.pagination()?.type === "progress"',
    '[class.carousel__pagination--scrollbar]':
      'this.store.pagination()?.type === "scrollbar"',
    '[class.track-position-top]':
      'this.isTrackPagination() && this.paginationPosition() === "top"',
    '[class.track-position-bottom]':
      'this.isTrackPagination() && this.paginationPosition() === "bottom"',
    '[class.track-position-left]':
      'this.isTrackPagination() && this.paginationPosition() === "left"',
    '[class.track-position-right]':
      'this.isTrackPagination() && this.paginationPosition() === "right"',
  },
})
export class PaginationComponent {
  public readonly store = inject(CarouselStore);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  goToSlide = output<number>();

  private readonly dynamicDotWidth = signal(8);
  private readonly dynamicDotGap = signal(16);
  private scrollbarPointerActive = false;

  constructor() {
    afterRenderEffect(() => {
      this.updateDynamicDotMetrics();
    });
  }

  public readonly maxSpan = computed(() => {
    if (this.store.totalSlidesVisible() >= 5) {
      return 5 * this.dynamicDotWidth() + 4 * this.dynamicDotGap();
    }

    if (this.store.totalSlidesVisible() === 4) {
      return 4 * this.dynamicDotWidth() + 3 * this.dynamicDotGap();
    }

    return 3 * this.dynamicDotWidth() + 2 * this.dynamicDotGap();
  });

  public slideTo(slide: number) {
    if (!Number.isFinite(slide) || slide < 0) {
      return;
    }
    const clampedSlide = Math.floor(slide);
    this.goToSlide.emit(clampedSlide);
  }

  public readonly range = computed(() =>
    Array.from({ length: this.store.totalSlidesVisible() }, (_, i) => i + 1),
  );
  public readonly currentPositionVisible = computed(() => {
    const realPaginationPosition = Math.max(
      0,
      this.store.perceivedIndex() - this.store.firstSlideAnchor(),
    );
    return Math.min(
      realPaginationPosition,
      this.store.totalSlidesVisible() - 1,
    );
  });
  public readonly progressPercent = computed(() => {
    const totalSteps = this.store.totalSlidesVisible();

    if (totalSteps <= 1) {
      return 100;
    }

    const progress = ((this.currentPositionVisible() + 1) / totalSteps) * 100;
    return Math.max(0, Math.min(100, progress));
  });

  public readonly scrollbarThumbPercent = computed(() => {
    const totalSteps = this.store.totalSlidesVisible();
    if (totalSteps <= 1) {
      return 100;
    }
    return 100 / totalSteps;
  });

  public readonly scrollbarThumbOffsetPercent = computed(() => {
    const totalSteps = this.store.totalSlidesVisible();
    if (totalSteps <= 1) {
      return 0;
    }

    const travel = 100 - this.scrollbarThumbPercent();
    return (this.currentPositionVisible() / (totalSteps - 1)) * travel;
  });

  public readonly isTrackPagination = computed(() => {
    const type = this.store.pagination()?.type;
    return type === 'progress' || type === 'scrollbar';
  });

  public readonly paginationPosition = computed(() => {
    const pagination = this.store.pagination();
    return pagination?.type === 'progress' || pagination?.type === 'scrollbar'
      ? (pagination.position ?? 'bottom')
      : 'bottom';
  });

  public readonly isTrackVertical = computed(
    () =>
      this.store.isVertical() ||
      this.paginationPosition() === 'left' ||
      this.paginationPosition() === 'right',
  );

  public bulletLabel(index: number): string {
    return this.store
      .a11y()
      .paginationBulletLabel?.({
        index,
        total: this.store.totalSlidesVisible(),
      }) ?? `Go to slide ${index + 1}`;
  }

  private computedMainOffset() {
    const dotWidth = this.dynamicDotWidth();
    const dotGap = this.dynamicDotGap();

    // Default case : totalSlides >= 5
    // * - -   - * - -   - - * - -   - - * -  - - *
    if (this.store.totalSlidesVisible() >= 5) {
      return (
        (this.maxSpan() -
          (this.currentPositionVisible() * (this.maxSpan() - dotWidth)) / 2 -
          dotWidth) /
        2
      );
    }

    if (this.store.totalSlidesVisible() === 4) {
      const middle = this.maxSpan() / 2;
      const firstLeft = middle - dotWidth / 2;
      const step = dotWidth + dotGap;
      return firstLeft - step * this.currentPositionVisible();
    }

    if (this.store.totalSlidesVisible() === 3) {
      return (
        (this.maxSpan() -
          this.currentPositionVisible() * (this.maxSpan() - dotWidth) -
          dotWidth) /
        2
      );
    }

    return 0;
  }

  public readonly dotMainOffset = computed(() => {
    const offset = this.computedMainOffset();
    return this.store.isRtl() ? -offset : offset;
  });

  public onScrollbarPointerDown(event: PointerEvent): void {
    if (!this.store.pagination()?.clickable) {
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }

    event.preventDefault();
    this.scrollbarPointerActive = true;
    target.setPointerCapture?.(event.pointerId);
    this.slideScrollbarToPointer(event, target);
  }

  public onScrollbarPointerMove(event: PointerEvent): void {
    if (!this.scrollbarPointerActive) {
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }

    event.preventDefault();
    this.slideScrollbarToPointer(event, target);
  }

  public onScrollbarPointerEnd(event: PointerEvent): void {
    if (!this.scrollbarPointerActive) {
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    target?.releasePointerCapture?.(event.pointerId);
    this.scrollbarPointerActive = false;
  }

  private slideScrollbarToPointer(
    event: PointerEvent,
    target: HTMLElement,
  ): void {
    const rect = target.getBoundingClientRect();
    const isVertical = this.isTrackVertical();
    const size = isVertical ? rect.height : rect.width;
    if (size <= 0) {
      return;
    }

    const rawOffset = isVertical
      ? event.clientY - rect.top
      : this.store.isRtl()
        ? rect.right - event.clientX
        : event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, rawOffset / size));
    const totalSteps = this.store.totalSlidesVisible();
    const targetIndex = Math.round(ratio * Math.max(0, totalSteps - 1));
    this.slideTo(targetIndex);
  }

  public onScrollbarKeydown(event: KeyboardEvent): void {
    if (!this.store.pagination()?.clickable) {
      return;
    }

    const totalSteps = this.store.totalSlidesVisible();
    const current = this.currentPositionVisible();
    const isVertical = this.isTrackVertical();
    const forwardKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const backwardKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
    const rtlFactor = !isVertical && this.store.isRtl() ? -1 : 1;

    let target: number | undefined;
    if (event.key === 'Home') {
      target = 0;
    } else if (event.key === 'End') {
      target = totalSteps - 1;
    } else if (event.key === forwardKey) {
      target = current + rtlFactor;
    } else if (event.key === backwardKey) {
      target = current - rtlFactor;
    }

    if (target === undefined) {
      return;
    }

    event.preventDefault();
    this.slideTo(Math.max(0, Math.min(totalSteps - 1, target)));
  }

  private updateDynamicDotMetrics(): void {
    const style = getComputedStyle(this.elementRef.nativeElement);
    this.dynamicDotWidth.set(
      this.readCssLength(style, '--whirli-pagination-dot-width') ??
        this.readCssLength(style, '--whirli-pagination-dot-size') ??
        8,
    );
    this.dynamicDotGap.set(
      this.readCssLength(style, '--whirli-pagination-gap') ?? 16,
    );
  }

  private readCssLength(
    style: CSSStyleDeclaration,
    name: string,
  ): number | undefined {
    const raw = style.getPropertyValue(name).trim();
    if (!raw) {
      return undefined;
    }
    const numeric = Number.parseFloat(raw);
    if (!Number.isFinite(numeric)) {
      return undefined;
    }
    if (raw.endsWith('rem')) {
      const rootFontSize = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      return numeric * (Number.isFinite(rootFontSize) ? rootFontSize : 16);
    }
    return numeric;
  }
}
