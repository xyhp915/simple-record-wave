import { BeatsObserver, renderWaveform } from './wave-record.ts';
import { Recorder } from './recorder.ts';

export function setupCounter(element: HTMLElement) {
  const container = document.createElement('div');
  container.classList.add('app-wave-container');

  const needle = document.createElement('div');
  needle.classList.add('app-wave-needle');

  const waveA = document.createElement('div');
  const waveB = document.createElement('div');
  waveB.classList.add('mirror');
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

  const start = () => {
    w.start();
    w1.start();
  };

  const pause = () => {
    w.pause();
    w1.pause();
  };

  startBtn.onclick = start;
  stopBtn.onclick = pause;

  beatsBtn.onclick = () => {
    start();
    beatsObserver.notify(Math.max(Math.floor(Math.random() * 80), 10));
  };

  // audio recorder
  const recorder = Recorder.create();
  const recorderCtrls = document.createElement('div');
  recorderCtrls.style.paddingTop = '20px';
  recorderCtrls.innerHTML = `
    <button id="recorder-start">🎙️ Start Record</button>
    <button id="recorder-stop">🛑 Stop Record</button>
    <a id="download-link" style="display:none" href="" download="recording.wav">
    Download Recording
    </a>
  `;

  element.appendChild(recorderCtrls);

  const recorderStartBtn = document.getElementById(
    'recorder-start',
  )! as HTMLButtonElement;
  const recorderStopBtn = document.getElementById(
    'recorder-stop',
  )! as HTMLButtonElement;

  const downloadLink = document.getElementById(
    'download-link',
  ) as HTMLAnchorElement;

  recorderStartBtn.onclick = async () => {
    await recorder.startRecording();
  };

  recorderStopBtn.onclick = async () => {
    await recorder.stopRecording();
  };

  recorder.on('record-start', () => {
    start();
  });

  recorder.on('record-pause', () => {
    pause();
  });

  recorder.on('record-end', () => {
    pause();
  });

  recorder.on('record-beat', (value) => {
    if (value == 0) {
      value = 10;
    } else if (value < 20) {
      value += 20;
    } else if (value > 0 && value < 50) {
      value += 30;
    }

    beatsObserver.notify(value);
  });
}

setupCounter(document.getElementById('app') as HTMLElement);
