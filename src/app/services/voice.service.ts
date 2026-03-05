import { Injectable, computed, signal } from '@angular/core';

export type VoicePermission = 'unknown' | 'granted' | 'denied';

export interface VoiceConfig {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  silenceTimeoutMs: number;
  autoStopOnSilence: boolean;
  restartOnEnd: boolean;
}

export interface VoiceState {
  supported: boolean;
  listening: boolean;
  transcript: string;
  finalTranscript: string;
  interimTranscript: string;
  permission: VoicePermission;
  error: string | null;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

interface VoiceWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  lang: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
  continuous: true,
  interimResults: true,
  maxAlternatives: 1,
  silenceTimeoutMs: 3500,
  autoStopOnSilence: true,
  restartOnEnd: true,
};

@Injectable({
  providedIn: 'root',
})
export class VoiceService {
  private readonly _supported = signal(false);
  private readonly _listening = signal(false);
  private readonly _finalTranscript = signal('');
  private readonly _interimTranscript = signal('');
  private readonly _permission = signal<VoicePermission>('unknown');
  private readonly _error = signal<string | null>(null);
  private readonly _config = signal<VoiceConfig>(DEFAULT_VOICE_CONFIG);

  readonly supported = this._supported.asReadonly();
  readonly listening = this._listening.asReadonly();
  readonly finalTranscript = this._finalTranscript.asReadonly();
  readonly interimTranscript = this._interimTranscript.asReadonly();
  readonly permission = this._permission.asReadonly();
  readonly error = this._error.asReadonly();

  readonly transcript = computed(() => {
    const final = this._finalTranscript().trim();
    const interim = this._interimTranscript().trim();
    return [final, interim].filter(Boolean).join(' ').trim();
  });

  readonly state = computed<VoiceState>(() => ({
    supported: this._supported(),
    listening: this._listening(),
    transcript: this.transcript(),
    finalTranscript: this._finalTranscript(),
    interimTranscript: this._interimTranscript(),
    permission: this._permission(),
    error: this._error(),
  }));

  private recognition: SpeechRecognitionLike | null = null;
  private initialized = false;
  private shouldKeepListening = false;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;

  initialize(config?: Partial<VoiceConfig>): void {
    if (config) {
      this.configure(config);
    }

    if (this.initialized) {
      this.applyConfigToRecognition();
      return;
    }

    const RecognitionCtor = this.getRecognitionCtor();
    if (!RecognitionCtor) {
      this._supported.set(false);
      this.initialized = true;
      return;
    }

    this.recognition = new RecognitionCtor();
    this.wireRecognitionCallbacks(this.recognition);
    this.applyConfigToRecognition();

    this._supported.set(true);
    this.initialized = true;
  }

  configure(config: Partial<VoiceConfig>): void {
    this._config.set({ ...this._config(), ...config });
    this.applyConfigToRecognition();
  }

  start(config?: Partial<VoiceConfig>): void {
    if (config) {
      this.configure(config);
    }

    this.initialize();

    if (!this.recognition || !this._supported()) {
      return;
    }

    if (this._listening()) {
      return;
    }

    this.shouldKeepListening = true;
    this._error.set(null);
    this._finalTranscript.set('');
    this._interimTranscript.set('');

    this.safeStart();
  }

  stop(): void {
    this.shouldKeepListening = false;
    this.clearSilenceTimer();
    this._listening.set(false);
    this._interimTranscript.set('');

    if (!this.recognition) {
      return;
    }

    try {
      this.recognition.stop();
    } catch {
      try {
        this.recognition.abort();
      } catch {
        // Ignore repeated stop/abort calls when engine is already inactive.
      }
    }
  }

  toggle(config?: Partial<VoiceConfig>): void {
    if (this._listening()) {
      this.stop();
      return;
    }

    this.start(config);
  }

  resetTranscript(): void {
    this._finalTranscript.set('');
    this._interimTranscript.set('');
  }

  destroy(): void {
    this.shouldKeepListening = false;
    this.clearSilenceTimer();
    this._listening.set(false);
    this._interimTranscript.set('');

    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;

      try {
        this.recognition.abort();
      } catch {
        // No-op.
      }
    }

    this.recognition = null;
    this.initialized = false;
  }

  private wireRecognitionCallbacks(recognition: SpeechRecognitionLike): void {
    recognition.onstart = () => {
      this._listening.set(true);
      this._error.set(null);
      this.restartSilenceTimer();
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let nextFinal = this._finalTranscript();
      let nextInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result || result.length < 1) {
          continue;
        }

        const chunk = result[0]?.transcript?.trim();
        if (!chunk) {
          continue;
        }

        if (result.isFinal) {
          nextFinal = `${nextFinal} ${chunk}`.trim();
        } else {
          nextInterim = `${nextInterim} ${chunk}`.trim();
        }
      }

      this._finalTranscript.set(nextFinal);
      this._interimTranscript.set(nextInterim);
      this._permission.set('granted');
      this.restartSilenceTimer();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      this._error.set(this.mapRecognitionError(event.error));

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this._permission.set('denied');
        this.shouldKeepListening = false;
      }
    };

    recognition.onend = () => {
      const shouldRestart = this.shouldKeepListening && this._config().restartOnEnd;
      this._listening.set(false);
      this._interimTranscript.set('');
      this.clearSilenceTimer();

      if (!shouldRestart || !this._supported()) {
        return;
      }

      setTimeout(() => {
        this.safeStart();
      }, 140);
    };
  }

  private safeStart(): void {
    if (!this.recognition) {
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        return;
      }

      this.shouldKeepListening = false;
      this._listening.set(false);
      this._error.set('Unable to start voice recognition.');
    }
  }

  private restartSilenceTimer(): void {
    const { autoStopOnSilence, silenceTimeoutMs } = this._config();
    if (!autoStopOnSilence || silenceTimeoutMs <= 0) {
      return;
    }

    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      this.shouldKeepListening = false;
      this.stop();
    }, silenceTimeoutMs);
  }

  private clearSilenceTimer(): void {
    if (!this.silenceTimer) {
      return;
    }

    clearTimeout(this.silenceTimer);
    this.silenceTimer = null;
  }

  private applyConfigToRecognition(): void {
    if (!this.recognition) {
      return;
    }

    const config = this._config();
    this.recognition.lang = config.lang;
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;
    this.recognition.maxAlternatives = config.maxAlternatives;
  }

  private getRecognitionCtor(): SpeechRecognitionConstructor | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const voiceWindow = window as VoiceWindow;
    return voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition ?? null;
  }

  private mapRecognitionError(code: string): string {
    switch (code) {
      case 'not-allowed':
      case 'service-not-allowed':
        return 'Microphone access was blocked by the browser.';
      case 'audio-capture':
        return 'No microphone was detected on this device.';
      case 'network':
        return 'Network error while processing voice input.';
      case 'no-speech':
        return 'No speech detected. Try speaking a bit louder.';
      default:
        return 'Voice recognition failed. Please try again.';
    }
  }
}
