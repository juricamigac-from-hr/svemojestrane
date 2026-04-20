function parseJSON(value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

function cookieStorage(key) {
  return {
    get() {
      const value = document.cookie.split('; ').find((entry) => entry.startsWith(`${key}=`));
      if (!value) return null;
      return parseJSON(decodeURIComponent(value.split('=').slice(1).join('=')));
    },
    set(payload) {
      const encoded = encodeURIComponent(JSON.stringify(payload));
      document.cookie = `${key}=${encoded}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`;
    },
    clear() {
      document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
    },
  };
}

function localStorageBackend(key) {
  return {
    get() {
      return parseJSON(window.localStorage.getItem(key));
    },
    set(payload) {
      window.localStorage.setItem(key, JSON.stringify(payload));
    },
    clear() {
      window.localStorage.removeItem(key);
    },
  };
}

export default function createStorage(config) {
  const key = config?.key || 'site_consent';
  return config?.type === 'cookie' ? cookieStorage(key) : localStorageBackend(key);
}
