import type {
  KernelClock,
  KernelEvent,
  KernelEventEmitter,
  KernelEventListener,
  KernelEventName,
  KernelMetadata,
} from "./types";

/** In-memory synchronous event bus. No networking, no persistence. */
export class KernelEventBus implements KernelEventEmitter {
  private readonly listeners = new Map<KernelEventName, Set<KernelEventListener>>();
  private readonly globalListeners = new Set<KernelEventListener>();

  constructor(private readonly clock: KernelClock) {}

  emit(name: KernelEventName, payload?: KernelMetadata): void {
    const event: KernelEvent = { name, at: this.clock.now(), payload };
    for (const listener of this.listeners.get(name) ?? []) listener(event);
    for (const listener of this.globalListeners) listener(event);
  }

  on(name: KernelEventName, listener: KernelEventListener): () => void {
    const bucket = this.listeners.get(name) ?? new Set<KernelEventListener>();
    bucket.add(listener);
    this.listeners.set(name, bucket);
    return () => bucket.delete(listener);
  }

  onAny(listener: KernelEventListener): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }
}
