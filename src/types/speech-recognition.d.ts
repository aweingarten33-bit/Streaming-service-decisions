interface SpeechRecognitionResult {
  0: { transcript: string };
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResult[];
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
}

declare var SpeechRecognition: {
  new (): SpeechRecognition;
};
