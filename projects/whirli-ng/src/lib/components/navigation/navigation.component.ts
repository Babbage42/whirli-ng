import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { CarouselRegistryService } from '../carousel/carousel-registry.service';
import { CarouselStore } from '../../carousel.store';

@Component({
  selector: 'whirli-navigation-ui',
  imports: [CommonModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  public readonly store = inject(CarouselStore);
  public readonly carouselRegistry = inject(CarouselRegistryService);

  readonly customLeftArrow = input<TemplateRef<unknown>>();
  readonly customRightArrow = input<TemplateRef<unknown>>();

  slidePrev = output<void>();
  slideNext = output<void>();
  slideTo = output<number>();

  readonly alwaysShowControls = input(false);
  readonly loop = input(false);
  readonly rewind = input(false);
  readonly currentPosition = input(0);
  readonly totalSlides = input(0);
  readonly iconSize = input(0);
  readonly previousSlideLabel = input('Previous slide');
  readonly nextSlideLabel = input('Next slide');

  public readonly hasReachedStart = computed(() => {
    if (this.store.navigateSlideBySlide()) {
      return this.store.currentRealPosition() === 0;
    }
    return this.store.hasReachedStart();
  });

  public readonly hasReachedEnd = computed(() => {
    if (this.store.navigateSlideBySlide()) {
      return this.store.currentRealPosition() === this.store.totalSlides() - 1;
    }
    return this.store.hasReachedEnd();
  });

  public readonly showPrevControl = computed(() => {
    return this.store.currentPosition() > 0 && !this.hasReachedStart();
  });
  public readonly showNextControl = computed(() => {
    return (
      this.store.currentPosition() < this.store.totalSlides() - 1 &&
      !this.hasReachedEnd()
    );
  });

  public readonly showLeftControl = computed(() => {
    return this.store.isRtl() ? this.showNextControl() : this.showPrevControl();
  });
  public readonly showRightControl = computed(() => {
    return this.store.isRtl() ? this.showPrevControl() : this.showNextControl();
  });

  private readonly forceControlsVisible = computed(
    () => this.alwaysShowControls() || this.loop() || this.rewind(),
  );
  public readonly leftControlVisible = computed(
    () => this.forceControlsVisible() || this.showLeftControl(),
  );
  public readonly rightControlVisible = computed(
    () => this.forceControlsVisible() || this.showRightControl(),
  );

  // Uses the measured store value in CSR. During the SSR relative-peek fallback,
  // the carousel host provides this CSS variable so controls do not jump on hydration.
  private readonly effectivePeekOffset = computed(
    () => `var(--whirli-internal-peek-offset, ${this.store.peekOffset()}px)`,
  );
  private readonly inlineControlOffset = computed(
    () =>
      `calc(var(--whirli-nav-inline-offset, 0px) - ${this.effectivePeekOffset()})`,
  );
  private readonly blockStartControlOffset = computed(
    () =>
      `calc(var(--whirli-nav-block-offset, 0px) - ${this.effectivePeekOffset()})`,
  );
  private readonly blockEndControlOffset = computed(
    () =>
      `calc(100% - ${this.iconSize()}px - var(--whirli-nav-block-offset, 0px) + ${this.effectivePeekOffset()})`,
  );
  private readonly centeredControlOffset = computed(
    () =>
      `calc(50% - ${this.iconSize() / 2}px + var(--whirli-nav-block-offset, 0px))`,
  );

  public readonly topLeftControl = computed(() => {
    if (this.carouselRegistry.hasExternalControls()) {
      return null;
    }
    if (this.store.isVertical()) {
      return this.blockStartControlOffset();
    }
    return this.centeredControlOffset();
  });
  public readonly topRightControl = computed(() => {
    if (!this.store.isVertical()) {
      return this.topLeftControl();
    }
    if (this.carouselRegistry.hasExternalControls()) {
      return null;
    }
    return this.blockEndControlOffset();
  });
  public readonly leftLeftControl = computed(() => {
    if (this.carouselRegistry.hasExternalControls()) {
      return null;
    }
    if (this.store.isVertical()) {
      return this.centeredControlOffset();
    }
    return this.inlineControlOffset();
  });
  public readonly rightRightControl = computed(() => {
    if (this.carouselRegistry.hasExternalControls()) {
      return null;
    }
    if (this.store.isVertical()) {
      return this.centeredControlOffset();
    }
    return this.inlineControlOffset();
  });

  public leftControl = viewChild<TemplateRef<unknown>>('leftControl');
  public rightControl = viewChild<TemplateRef<unknown>>('rightControl');

  public slideToPrev() {
    this.store.isRtl() ? this.slideNext.emit() : this.slidePrev.emit();
  }

  public slideToNext() {
    this.store.isRtl() ? this.slidePrev.emit() : this.slideNext.emit();
  }
}
