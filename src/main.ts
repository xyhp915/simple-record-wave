import { BeatsObserver, renderWaveform } from './wave-record.ts'
import { Recorder } from './recorder.ts'

function formatMilliseconds(ms: number) {
  const minutes = Math.floor(ms / 60000)
  ms %= 60000
  const seconds = Math.floor(ms / 1000)
  const milliseconds = ms % 1000
  const pad = (num: number, size: number) => String(num).padStart(size, '0')
  return `${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(milliseconds, 3).slice(0, 2)}`
}

export function setupCounter(element: HTMLElement) {
  const container = document.createElement('div')
  container.classList.add('app-wave-container')

  const needle = document.createElement('div')
  needle.classList.add('app-wave-needle')

  const waveA = document.createElement('div')
  const waveB = document.createElement('div')
  waveB.classList.add('mirror')
  container.appendChild(waveA)
  container.appendChild(waveB)
  container.appendChild(needle)
  element.appendChild(container)

  const beatsObserver = new BeatsObserver()
  const w = renderWaveform(waveA, { beatsObserver })
  const w1 = renderWaveform(waveB, {})

  const ctrls = document.createElement('div')
  ctrls.style.paddingTop = '20px'

  ctrls.innerHTML = `
    <button id="start">Start wave</button>
    <button id="pause">Pause wave</button>
    <button id="beats">吱吱～</button>
  `

  element.appendChild(ctrls)

  const startBtn = document.getElementById('start')!
  const stopBtn = document.getElementById('pause')!
  const beatsBtn = document.getElementById('beats')!

  const start = () => {
    w.start()
    w1.start()
  }

  const pause = () => {
    w.pause()
    w1.pause()
  }

  const stop = () => {
    w.stop()
    w1.stop()
  }

  startBtn.onclick = start
  stopBtn.onclick = pause

  beatsBtn.onclick = () => {
    start()
    beatsObserver.notify(Math.max(Math.floor(Math.random() * 80), 10))
  }

  // audio recorder
  const recorder = Recorder.create({
    mimeType: 'audio/mp4',
  })
  const recorderCtrls = document.createElement('div')
  recorderCtrls.style.paddingTop = '20px'
  recorderCtrls.innerHTML = `
    <button id="recorder-start">🎙️ Start Record</button>
    <button id="recorder-stop">🛑 Stop Record</button>
  `

  element.appendChild(recorderCtrls)

  const recorderStartBtn = document.getElementById(
    'recorder-start',
  )! as HTMLButtonElement
  recorderStartBtn.style.width = '120px'
  const recorderStopBtn = document.getElementById(
    'recorder-stop',
  )! as HTMLButtonElement

  const downloadLink = document.getElementById(
    'download-link',
  ) as HTMLAnchorElement

  recorderStartBtn.onclick = async () => {
    if (recorder.isRecording()) return
    await recorder.startRecording()
  }

  recorderStopBtn.onclick = async () => {
    await recorder.stopRecording()
  }

  recorder.on('record-progress', (t) => {
    recorderStartBtn.textContent = `
      ⏱️ ${formatMilliseconds(t)}
    `
  })

  recorder.on('record-start', () => {
    start()
  })

  recorder.on('record-pause', () => {
    pause()
  })

  recorder.on('record-end', (blob: Blob) => {
    stop()
    addRecordAudioItem(blob)
    recorderStartBtn.textContent = '🎙️ Start Record'
  })

  recorder.on('record-beat', (value) => {
    if (value == 0) {
      value = 10
    } else if (value < 20) {
      value += 20
    } else if (value > 0 && value < 50) {
      value += 30
    }

    beatsObserver.notify(value)
  })

  // recordings audio list
  const recordingsList = document.createElement('div')
  recordingsList.style.paddingTop = '20px'
  element.appendChild(recordingsList)

  function addRecordAudioItem(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const item = document.createElement('div')
    item.style.paddingTop = '4px'
    item.innerHTML = `
      <audio controls src="${url}"></audio> <br>
      <small>Size: ${(blob.size / 1024).toFixed(2)}KB / type: ${blob.type}</small>
    `

    recordingsList.prepend(item)
  }
}

setupCounter(document.getElementById('app') as HTMLElement)
