let seed = 0;

export class RecordWaveform {
  private id: string = `waveform-${++seed}`;
  private elContainer?: HTMLElement;
  private elBelt?: HTMLElement;
  private readonly opts: any;
  private timer: number = 0;

  private _start: () => void = () => {};
  private _pause: () => void = () => {};

  constructor(options: any = {}) {
    this.opts = options || {};
  }

  render(root: HTMLElement) {
    root.innerHTML = `
    <div id="xwaveform-${this.id}" class="waveform-container">
      <div class="waveform-belt"></div>  
    </div>`;

    const el = (this.elContainer = document.getElementById(
      `xwaveform-${this.id}`,
    )!);
    const belt = (this.elBelt = el.querySelector(
      '.waveform-belt',
    ) as HTMLElement);

    const elContainerWidth = this.opts.width || 200;
    const itemCount = this.opts.itemCount || 60;
    const itemWidth = this.opts.itemWidth || 3;
    const itemGap = this.opts.itemGap || 2;
    const beltWidth = itemCount * (itemWidth + itemGap) * 2000; // 2 for margin

    el.style.width = `${elContainerWidth}px`;
    belt.style.width = `${beltWidth}px`;

    const createItemsBlock = (
      blockBeltContainer: HTMLElement,
      initialStep: number = -1,
    ) => {
      const elBlock = document.createElement('div');

      elBlock.classList.add('waveform-items-block');

      for (let i = 0; i < itemCount; i++) {
        const item = document.createElement('span');
        item.className = 'waveform-item';
        item.style.width = `${itemWidth}px`;
        item.style.marginRight = `${itemGap}px`;
        elBlock.appendChild(item);
      }

      let step = initialStep;
      const resetItems = () => {};
      const renderNextStepOffset = () => {
        step += 2;
        elBlock.style.transform = `translateX(${step * 100}%)`;
      };

      // set default offset
      elBlock.style.transform = `translateX(${step * 100}%)`;
      blockBeltContainer.appendChild(elBlock);

      return {
        elBlock,
        resetItems,
        renderNextStepOffset,
      };
    };

    const block1 = createItemsBlock(belt, 0);
    const block2 = createItemsBlock(belt, 1);
    let nextInvalidateBlock = block1;

    const setBeltTranslateX = (x: number) => {
      belt.style.transform = `translateX(${x}px)`;
    };

    // start belt run
    setBeltTranslateX(0);

    let beltX = 0;
    const tickFrame = () => {
      beltX += 1;
      setBeltTranslateX(-beltX);

      // move next block
      const blockWidth = itemCount * (itemWidth + 2);
      if (beltX >= blockWidth && beltX % blockWidth === 0) {
        nextInvalidateBlock.renderNextStepOffset();
        nextInvalidateBlock = nextInvalidateBlock === block1 ? block2 : block1;
      }
    };

    this._start = () => {
      this.timer = setInterval(tickFrame, 1000 / 30);
    };

    this._pause = () => {
      clearInterval(this.timer);
      this.timer = 0;
    };
  }

  pause() {
    this._pause();
  }

  start() {
    if (this.timer > 0) return;
    this._start();
  }

  destroy() {
    this.pause();
    if (this.elContainer) {
      this.elContainer.innerHTML = '';
    }
  }
}

export function renderWaveform(container: HTMLElement, opts: any) {
  const waveform = new RecordWaveform(opts);
  waveform.render(container);
  return waveform;
}
