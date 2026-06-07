import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[whirliNavLeft]',
  standalone: true,
})
export class CarouselNavLeftDirective {
  constructor(public templateRef: TemplateRef<any>) {}
}
