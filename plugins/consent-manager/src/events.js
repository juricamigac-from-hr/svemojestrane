export default function createEmitter() {
  const handlers = new Map();
  return {
    on(eventName, handler) {
      const list = handlers.get(eventName) || [];
      list.push(handler);
      handlers.set(eventName, list);
      return () => {
        const nextHandlers = (handlers.get(eventName) || [])
          .filter((entry) => entry !== handler);
        handlers.set(eventName, nextHandlers);
      };
    },
    emit(eventName, payload) {
      (handlers.get(eventName) || []).forEach((handler) => handler(payload));
    },
  };
}
