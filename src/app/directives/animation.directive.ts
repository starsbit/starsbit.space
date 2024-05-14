import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

@Directive({
  selector: '[starsCoreAnimation]',
  standalone: true,
})
export class CoreAnimationDirective {
  @Input() duration = 1;
  @Input() delay = 0;

  @Output() complete = new EventEmitter<boolean>();
  @Output() reverseComplete = new EventEmitter<boolean>();
  protected timeline = gsap.timeline();

  constructor(protected element: ElementRef) {
    gsap.registerPlugin(Flip);

    this.timeline.eventCallback('onComplete', () => {
      this.complete.emit(true);
    });

    this.timeline.eventCallback('onReverseComplete', () => {
      this.reverseComplete.emit(true);
    });
  }

  protected animate() {
    if (this.timeline.isActive()) {
      this.timeline.kill();
    }
    this.timeline.play();
  }
}
