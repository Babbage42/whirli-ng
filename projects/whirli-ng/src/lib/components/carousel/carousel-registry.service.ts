import {
  computed,
  Injectable,
  signal,
  TemplateRef,
  WritableSignal,
} from '@angular/core';

@Injectable()
export class CarouselRegistryService {
  public carouselNavigationLeftSignal: WritableSignal<
    TemplateRef<any> | undefined
  > = signal(undefined);

  public carouselNavigationRightSignal: WritableSignal<
    TemplateRef<any> | undefined
  > = signal(undefined);

  private readonly externalControlsCount = signal(0);
  public readonly hasExternalControls = computed(
    () => this.externalControlsCount() > 0,
  );

  public registerExternalControl(): void {
    this.externalControlsCount.update((count) => count + 1);
  }

  public unregisterExternalControl(): void {
    this.externalControlsCount.update((count) => Math.max(0, count - 1));
  }
}
