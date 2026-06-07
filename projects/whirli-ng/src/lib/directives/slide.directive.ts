import { Directive, input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[slide]',
})
export class SlideDirective {
  readonly slideId = input<string | undefined>(undefined, { alias: 'slide' });
  readonly slideDisabled = input(false);

  constructor(public templateRef: TemplateRef<any>) {}
}
