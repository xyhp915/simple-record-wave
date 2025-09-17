import { renderWaveform } from './wave-record.ts';

export function setupCounter(element: HTMLElement) {
  const w = renderWaveform(element, null);

  const ctrls = document.createElement('div');
  ctrls.style.paddingTop = '20px';

  ctrls.innerHTML = `
    <button id="start">Start</button>
    <button id="pause">Pause</button>
  `;

  element.appendChild(ctrls);

  const startBtn = document.getElementById('start')!;
  const stopBtn = document.getElementById('pause')!;

  startBtn.onclick = () => w.start();
  stopBtn.onclick = () => w.pause();
}

setupCounter(document.getElementById('app') as HTMLElement);
