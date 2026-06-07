import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[whirliNavRight]',
  standalone: true,
})
export class CarouselNavRightDirective {
  constructor(public templateRef: TemplateRef<any>) {}
}
