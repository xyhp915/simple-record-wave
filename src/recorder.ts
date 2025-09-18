import { EventEmitter, Timer } from './helpers.ts'

export type RecordEvents = {
  'record-start': []
  'record-pause': [blob: Blob]
  'record-resume': []
  'record-end': [blob: Blob]
  'record-progress': [duration: number]
  'record-data-available': [blob: Blob]
  'record-beat': [value: number]
  destroy: []
}

const DEFAULT_BITS_PER_SECOND = 128000
const FPS = 100

const MIME_TYPES = [
  'audio/webm',
  'audio/wav',
  'audio/mpeg',
  'audio/mp4',
  'audio/mp3',
]

const findSupportedMimeType = () =>
  MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType))

type MicStream = {
  onDestroy: () => void
  onEnd: () => void
}

export class Recorder extends EventEmitter<RecordEvents> {
  private stream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null

  private timer: Timer
  private lastStartTime = 0
  private lastDuration = 0
  private duration = 0
  private micStream: MicStream | null = null
  private unsubscribeDestroy?: () => void
  private unsubscribeRecordEnd?: () => void

  private options: any = {}
  private isDestroyed = false
  private subscriptions: (() => void)[] = []

  constructor(opts: any = {}) {
    super()
    this.timer = new Timer()
    this.options = opts

    this.subscriptions.push(
      this.timer.on('tick', () => {
        const currentTime = performance.now() - this.lastStartTime
        this.duration = this.isPaused()
          ? this.duration
          : this.lastDuration + currentTime
        this.emit('record-progress', this.duration)
      }),
    )
  }

  public static create(opts?: any) {
    return new Recorder(opts || {})
  }

  public renderMicStream(stream: MediaStream): MicStream {
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    source.connect(analyser)

    analyser.fftSize = 32

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const drawWaveform = () => {
      analyser.getByteTimeDomainData(dataArray)

      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        const sample = (dataArray[i] - 128) / 128 // 规范化到 -1 到 1
        sum += sample * sample // 平方和
      }
      const rms = Math.sqrt(sum / bufferLength) // RMS 值 (0-1)
      const value = Math.round(rms * 100) // 规范化到 0-100

      this.emit('record-beat', value)
    }

    const intervalId = setInterval(drawWaveform, 1000 / FPS)

    const cleanup = () => {
      clearInterval(intervalId)
      source?.disconnect()
      audioContext?.close()
    }

    return {
      onDestroy: cleanup,
      onEnd: () => {
        this.stopMic()
      },
    }
  }

  /** Request access to the microphone and start monitoring incoming audio */
  public async startMic(options?: any): Promise<MediaStream> {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: options ?? true,
      })
    } catch (err) {
      throw new Error(
        'Error accessing the microphone: ' + (err as Error).message,
      )
    }

    const micStream = this.renderMicStream(stream)
    this.micStream = micStream
    this.unsubscribeDestroy = this.once('destroy', micStream.onDestroy)
    this.unsubscribeRecordEnd = this.once('record-end', micStream.onEnd)
    this.stream = stream

    return stream
  }

  /** Stop monitoring incoming audio */
  public stopMic() {
    this.micStream?.onDestroy()
    this.unsubscribeDestroy?.()
    this.unsubscribeRecordEnd?.()
    this.micStream = null
    this.unsubscribeDestroy = undefined
    this.unsubscribeRecordEnd = undefined
    if (!this.stream) return
    this.stream.getTracks().forEach((track) => track.stop())
    this.stream = null
    this.mediaRecorder = null
  }

  /** Start recording audio from the microphone */
  public async startRecording(options?: any) {
    const stream = this.stream || (await this.startMic(options))
    const mediaRecorder =
      this.mediaRecorder ||
      new MediaRecorder(stream, {
        mimeType: this.options.mimeType || findSupportedMimeType(),
        audioBitsPerSecond:
          this.options.audioBitsPerSecond || DEFAULT_BITS_PER_SECOND,
      })
    this.mediaRecorder = mediaRecorder
    this.stopRecording()

    const recordedChunks: BlobPart[] = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data)
      }
      this.emit('record-data-available', event.data)
    }

    const emitWithBlob = (ev: 'record-pause' | 'record-end') => {
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType })
      this.emit(ev, blob)
    }

    mediaRecorder.onpause = () => emitWithBlob('record-pause')

    mediaRecorder.onstop = () => emitWithBlob('record-end')

    mediaRecorder.start(this.options.mediaRecorderTimeslice)
    this.lastStartTime = performance.now()
    this.lastDuration = 0
    this.duration = 0
    this.timer.start()

    this.emit('record-start')
  }

  public stopRecording() {
    if (this.isActive()) {
      this.mediaRecorder?.stop()
      this.timer.stop()
    }
  }

  public pauseRecording() {
    if (this.isRecording()) {
      this.mediaRecorder?.requestData()
      this.mediaRecorder?.pause()
      this.timer.stop()
      this.lastDuration = this.duration
    }
  }

  public resumeRecording() {
    if (this.isPaused()) {
      this.mediaRecorder?.resume()
      this.timer.start()
      this.lastStartTime = performance.now()
      this.emit('record-resume')
    }
  }

  public getDuration(): number {
    return this.duration
  }

  public isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }

  public isPaused(): boolean {
    return this.mediaRecorder?.state === 'paused'
  }

  public isActive(): boolean {
    return this.mediaRecorder?.state !== 'inactive'
  }

  public static async getAvailableAudioDevices() {
    return navigator.mediaDevices
      .enumerateDevices()
      .then((devices) =>
        devices.filter((device) => device.kind === 'audioinput'),
      )
  }

  public destroy() {
    this.emit('destroy')
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []
    this.isDestroyed = true

    this.stopRecording()
    this.stopMic()
  }
}
