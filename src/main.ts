import { BeatsObserver, renderWaveform } from './wave-record.ts';

export function setupCounter(element: HTMLElement) {
  const container = document.createElement('div');
  container.classList.add('app-wave-container');

  const needle = document.createElement('div');
  needle.classList.add('app-wave-needle');

  const waveA = document.createElement('div');
  const waveB = document.createElement('div');
  waveB.classList.add('mirror')
  container.appendChild(waveA);
  container.appendChild(waveB);
  container.appendChild(needle);
  element.appendChild(container);

  const beatsObserver = new BeatsObserver();
  const w = renderWaveform(waveA, { beatsObserver });
  const w1 = renderWaveform(waveB, {});

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

  startBtn.onclick = () => {
    w.start();
    w1.start();
  };
  stopBtn.onclick = () => {
    w.pause();
    w1.pause();
  };

  beatsBtn.onclick = () => {
    w.start();
    w1.start();
    beatsObserver.notify(Math.max(Math.floor(Math.random() * 80), 10));
  };
}

setupCounter(document.getElementById('app') as HTMLElement);
