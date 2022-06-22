type Listener = () => void;
type ListenerMap = Map<string, Set<Listener>>;

function getListenerMap() {
  const global = (globalThis as unknown) as {
    listeners: ListenerMap | undefined;
  };
  if (!global.listeners) {
    global.listeners = new Map();
  }
  return global.listeners;
}

export function listen(spaceID: string, listener: Listener) {
  const map = getListenerMap();
  let set = map.get(spaceID);
  if (!set) {
    set = new Set();
    map.set(spaceID, set);
  }
  set.add(listener);
  return () => unlisten(spaceID, listener);
}

export function unlisten(spaceID: string, listener: Listener) {
  const map = getListenerMap();
  const set = map.get(spaceID);
  if (!set) {
    return;
  }
  set.delete(listener);
}

export function pokeSpace(spaceID: string) {
  const map = getListenerMap();
  const set = map.get(spaceID);
  if (!set) {
    return;
  }
  for (const listener of set) {
    listener();
  }
}
