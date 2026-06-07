import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { CarouselComponent } from '../carousel/carousel.component';

@Component({
  selector: 'whirli-pagination',
  imports: [CommonModule],
  templateUrl: './pagination-external.component.html',
  styleUrl: './pagination-external.component.scss',
})
export class PaginationExternalComponent {
  readonly forCarousel = input<CarouselComponent | undefined>(undefined, {
    alias: 'for',
  });

  readonly targetCarousel = computed(() => this.forCarousel());
}
