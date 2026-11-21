import { RecognitionResult } from '../recognition/models';

export interface AssistantReply {
  readonly text: string;
  readonly items?: readonly string[];
  readonly link?: { readonly label: string; readonly path: string };
}

export type ChatMessage =
  | { readonly id: number; readonly role: 'user'; readonly kind: 'text'; readonly text: string }
  | { readonly id: number; readonly role: 'user'; readonly kind: 'recording'; readonly seconds: number }
  | { readonly id: number; readonly role: 'assistant'; readonly kind: 'text'; readonly reply: AssistantReply }
  | {
      readonly id: number;
      readonly role: 'assistant';
      readonly kind: 'result';
      readonly reply: AssistantReply;
      readonly result: RecognitionResult;
    };

export type NewChatMessage = ChatMessage extends infer M ? (M extends ChatMessage ? Omit<M, 'id'> : never) : never;

export type ChatStatus = 'idle' | 'starting' | 'recording' | 'analyzing';
