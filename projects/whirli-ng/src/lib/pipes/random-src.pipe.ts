import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'randomSrc',
  pure: true,
})
export class RandomSrcPipe implements PipeTransform {
  transform(w = 300, h = 200): string {
    return randomSrc(w, h);
  }
}

export function randomSrc(w: number, h: number) {
  const seed = Math.floor(Math.random() * 1000000);
  return `https://picsum.photos/${w}/${h}?cacheBust=${seed}`;
}
