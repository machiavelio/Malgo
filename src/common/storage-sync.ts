/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

async function get(key: string | Array<string> | Object | null = null): Promise<{ [key: string]: any }> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(items);
    });
  });
}

async function set(key: Object): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(key, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

async function remove(key: string | Array<string>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, () => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

async function clear(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

const storage = { get, set, remove, clear };

export default storage;
