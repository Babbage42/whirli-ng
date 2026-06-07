import { CommonModule } from '@angular/common';
import { Component, computed, input, OnDestroy, OnInit } from '@angular/core';
import { CarouselComponent } from '../carousel/carousel.component';

@Component({
  selector: 'whirli-navigation-next',
  imports: [CommonModule],
  templateUrl: './navigation-right-external.component.html',
  styleUrl: './navigation-right-external.component.scss',
})
export class NavigationRightExternalComponent implements OnInit, OnDestroy {
  readonly forCarousel = input<CarouselComponent | undefined>(undefined, {
    alias: 'for',
  });

  readonly targetCarousel = computed(() => this.forCarousel());

  private registeredCarousel?: CarouselComponent;

  ngOnInit(): void {
    const carousel = this.targetCarousel();
    if (carousel) {
      this.registeredCarousel = carousel;
      carousel.carouselRegistry.registerExternalControl();
    }
  }

  ngOnDestroy(): void {
    this.registeredCarousel?.carouselRegistry.unregisterExternalControl();
  }
}
