import {
  AfterViewInit,
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  inject,
  output,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { rafThrottle } from '../helpers/raf-throttle.helper';

@Directive({
  selector: '[whirliImagesReady]',
})
export class ImagesReadyDirective implements AfterViewInit, OnDestroy {
  imagesReady = output<void>();
  imagesChanged = output<void>();

  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  private ro?: ResizeObserver;
  private mo?: MutationObserver;

  ngOnDestroy(): void {
    this.ro?.disconnect();
    this.mo?.disconnect();
  }

  private async waitAllCurrentImages(): Promise<void> {
    const root = this.host.nativeElement;
    const imgs = Array.from(root.querySelectorAll('img'));

    const visibleOrEagerImages = imgs.filter((img) => {
      const loading = img.getAttribute('loading');
      if (loading === 'eager') {
        return true;
      }

      const rect = img.getBoundingClientRect();
      return (
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0
      );
    });

    if (visibleOrEagerImages.length === 0) {
      // No visible images, emit ready immediately
      return;
    }

    const results = await Promise.allSettled(
      visibleOrEagerImages.map(async (img) => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve();
        }
        try {
          if ('decode' in img && typeof img.decode === 'function') {
            await img.decode();
            return Promise.resolve();
          }
        } catch (e) {
          return Promise.reject(e);
        }

        return new Promise<void>((resolve) => {
          const onLoad = () => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            resolve();
          };
          const onError = () => {
            resolve();
          };
          img.addEventListener('load', onLoad, { once: true });
          img.addEventListener('error', onError, { once: true });
        });
      }),
    );

    const failedCount = results.filter((r) => r.status === "rejected").length;
    if (failedCount > 0) {
      console.warn(`[Carousel] ${failedCount} image(s) failed to load`);
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.waitAllCurrentImages().then(() => {
      this.zone.run(() => this.imagesReady.emit());
      this.observeChanges();
    });
  }

  private lastSize = new WeakMap<Element, { w: number; h: number }>();
  private static readonly EPS = 0.5;

  private observeChanges(): void {
    const root = this.host.nativeElement;

    const onResize = rafThrottle((entries?: ResizeObserverEntry[]) => {
      let changed = false;
      if (entries) {
        for (const e of entries) {
          const cr = e.contentRect;
          const prev = this.lastSize.get(e.target);
          const now = { w: cr.width, h: cr.height };

          if (!prev) {
            this.lastSize.set(e.target, now);
            continue;
          }
          if (
            Math.abs(prev.w - now.w) > ImagesReadyDirective.EPS ||
            Math.abs(prev.h - now.h) > ImagesReadyDirective.EPS
          ) {
            this.lastSize.set(e.target, now);
            changed = true;
          }
        }
      }
      if (changed) {
        this.zone.run(() => this.imagesChanged.emit());
      }
    });

    this.ro = new ResizeObserver((entries) => onResize(entries));

    const imgsNow = Array.from(root.querySelectorAll('img'));
    for (const img of imgsNow) {
      const r = img.getBoundingClientRect();
      this.lastSize.set(img, { w: r.width, h: r.height });
    }
    for (const img of imgsNow) {
      this.ro.observe(img);
    }

    this.mo = new MutationObserver(async (records) => {
      const addedImgs: HTMLImageElement[] = [];
      for (const rec of records) {
        rec.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            addedImgs.push(node);
          } else if (node instanceof HTMLElement) {
            node
              .querySelectorAll?.('img')
              .forEach((img) => addedImgs.push(img));
          }
        });
      }
      if (addedImgs.length) {
        await this.waitAllCurrentImages();

        for (const img of addedImgs) {
          const r = img.getBoundingClientRect();
          this.lastSize.set(img, { w: r.width, h: r.height });
          this.ro!.observe(img);
        }

        this.zone.run(() => this.imagesChanged.emit());
      }
    });
    this.mo.observe(root, { childList: true, subtree: true });
  }
}
