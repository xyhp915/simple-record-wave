let seed = 0

export class BeatsObserver {
  private subscribers: Array<(v: number) => void> = []

  subscribe(fn: (v: number) => void) {
    this.subscribers.push(fn)
  }

  notify(value: number) {
    this.subscribers.forEach((fn) => fn(value))
  }

  clear() {
    this.subscribers = []
  }
}

export class RecordWaveform {
  private id: string = `waveform-${++seed}`
  private elContainer?: HTMLElement
  private elBelt?: HTMLElement
  private readonly opts: any
  private timer: number = 0
  private beatsObserver?: BeatsObserver

  private _start: () => void = () => {}
  private _pause: () => void = () => {}
  private _reset: () => void = () => {}

  constructor(options: any = {}) {
    this.opts = options || {}
    this.beatsObserver = this.opts.beatsObserver
  }

  get isRunning() {
    return this.timer > 0
  }

  render(root: HTMLElement) {
    root.innerHTML = `
    <div id="xwaveform-${this.id}" class="waveform-container">
      <div class="waveform-belt"></div>  
    </div>`

    const el = (this.elContainer = document.getElementById(
      `xwaveform-${this.id}`,
    )!)
    const belt = (this.elBelt = el.querySelector(
      '.waveform-belt',
    ) as HTMLElement)

    const elContainerWidth = this.opts.width || 150
    const itemCount = this.opts.itemCount || 60
    const itemWidth = this.opts.itemWidth || 3
    const itemGap = this.opts.itemGap || 2
    const beltWidth = itemCount * (itemWidth + itemGap) * 2000 // 2 for margin

    el.style.width = `${elContainerWidth}px`
    belt.style.width = `${beltWidth}px`

    const createItemsBlock = (
      blockBeltContainer: HTMLElement,
      initialStep: number = -1,
    ) => {
      const elBlock = document.createElement('div')

      elBlock.classList.add('waveform-items-block')

      for (let i = 0; i < itemCount; i++) {
        const item = document.createElement('span')
        item.className = 'waveform-item'
        item.style.width = `${itemWidth}px`
        item.style.marginRight = `${itemGap}px`
        elBlock.appendChild(item)
      }

      let step = initialStep
      const resetItems = () => {
        for (let i = 0; i < itemCount; i++) {
          const item = elBlock.children[i] as HTMLElement
          item.style.removeProperty('height')
        }
      }

      const renderNextStepOffset = () => {
        step += 2
        elBlock.style.transform = `translateX(${step * 100}%)`
        resetItems()
      }

      const renderItemBeat = (index: number, percent: number) => {
        const item = elBlock.children[index] as HTMLElement
        item.style.height = `${percent}%`
      }

      // set default offset
      elBlock.style.transform = `translateX(${step * 100}%)`
      blockBeltContainer.appendChild(elBlock)

      return {
        elBlock,
        resetItems,
        renderNextStepOffset,
        renderItemBeat,
      }
    }

    const block1 = createItemsBlock(belt, 0)
    const block2 = createItemsBlock(belt, 1)
    let nextInvalidateBlock = block1

    const setBeltTranslateX = (x: number) => {
      belt.style.transform = `translateX(${x}px)`
    }

    // start belt run
    setBeltTranslateX(0)

    let beltX = 0
    const blockWidth = itemCount * (itemWidth + itemGap)

    const tickFrame = () => {
      beltX += 1
      setBeltTranslateX(-beltX)

      // move next block
      if (beltX >= blockWidth && beltX % blockWidth === 0) {
        nextInvalidateBlock.renderNextStepOffset()
        nextInvalidateBlock = nextInvalidateBlock === block1 ? block2 : block1
      }
    }

    // subscribe beats
    this.beatsObserver?.subscribe((value: number) => {
      if (value < 0) return
      if (!this.isRunning) return

      value = Math.min(Math.max(value, 0), 100)

      // right boundary block
      const currentBlock =
        Math.floor((beltX + elContainerWidth) / blockWidth) % 2 === 0
          ? block1
          : block2
      const itemIndex = Math.floor(
        ((beltX + elContainerWidth) % blockWidth) / (itemWidth + itemGap),
      )
      currentBlock.renderItemBeat(itemIndex, value)
    })

    this._start = () => {
      this.timer = setInterval(tickFrame, 1000 / 30)
    }

    this._pause = () => {
      clearInterval(this.timer)
      this.timer = 0
    }

    this._reset = () => {
      beltX = 0
      setBeltTranslateX(0)
      block1.resetItems()
      block2.resetItems()
      nextInvalidateBlock = block1
      block1.elBlock.style.transform = `translateX(0%)`
      block2.elBlock.style.transform = `translateX(100%)`
    }
  }

  pause() {
    this._pause()
  }

  start() {
    if (this.timer > 0) return
    this._start()
  }

  stop() {
    this.pause()
    // reset
    this._reset()
  }

  destroy() {
    this.pause()
    this.beatsObserver?.clear()

    if (this.elContainer) {
      this.elContainer.innerHTML = ''
    }
  }
}

export function renderWaveform(container: HTMLElement, opts: any) {
  const waveform = new RecordWaveform(opts)
  waveform.render(container)
  return waveform
}
