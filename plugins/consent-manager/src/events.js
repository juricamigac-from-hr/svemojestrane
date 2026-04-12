export function createEmitter() {
  const handlers = new Map();
  return {
    on(eventName, handler) {
      const list = handlers.get(eventName) || [];
      list.push(handler);
      handlers.set(eventName, list);
      return () => {
        handlers.set(eventName, (handlers.get(eventName) || []).filter((entry) => entry !== handler));
      };
    },
    emit(eventName, payload) {
      (handlers.get(eventName) || []).forEach((handler) => handler(payload));
    },
  };
}
