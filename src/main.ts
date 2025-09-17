import { BeatsObserver, renderWaveform } from './wave-record.ts';

export function setupCounter(element: HTMLElement) {
  const beatsObserver = new BeatsObserver();
  const w = renderWaveform(element, {
    beatsObserver,
  });

  const ctrls = document.createElement('div');
  ctrls.style.paddingTop = '20px';

  ctrls.innerHTML = `
    <button id="start">Start</button>
    <button id="pause">Pause</button>
    <button id="beats">吱吱～</button>
  `;

  element.appendChild(ctrls);

  const startBtn = document.getElementById('start')!;
  const stopBtn = document.getElementById('pause')!;
  const beatsBtn = document.getElementById('beats')!;

  startBtn.onclick = () => w.start();
  stopBtn.onclick = () => w.pause();

  beatsBtn.onclick = () => {
    w.start()
    beatsObserver.notify(Math.max(Math.floor(Math.random() * 80), 10));
  };
}

setupCounter(document.getElementById('app') as HTMLElement);
