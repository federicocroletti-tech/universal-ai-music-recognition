/// <reference lib="webworker" />
import { RecognitionRequest, RecognitionReply } from './models';
import { recognize } from './recognizer';

addEventListener('message', ({ data }: MessageEvent<RecognitionRequest>) => {
  let reply: RecognitionReply;
  try {
    reply = { id: data.id, result: recognize(data.samples, data.sampleRate) };
  } catch (error) {
    reply = { id: data.id, error: error instanceof Error ? error.message : String(error) };
  }
  postMessage(reply);
});
