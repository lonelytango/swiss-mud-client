/**
 * Saves a value to localStorage
 * @param key The key to save the value to
 * @param value The value to save
 */
export function saveValueToLocalStorage(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Gets a value from localStorage
 * @param key The key to get the value from
 * @returns The value from localStorage
 */
export function getValueFromLocalStorage(key: string) {
  return JSON.parse(localStorage.getItem(key) || '{}');
}

/**
 * Saves a value to sessionStorage
 * @param key The key to save the value to
 * @param value The value to save
 */
export function saveValueToSessionStorage(key: string, value: any) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

/**
 * Gets a value from sessionStorage
 * @param key The key to get the value from
 * @returns The value from sessionStorage
 */
export function getValueFromSessionStorage(key: string) {
  return JSON.parse(sessionStorage.getItem(key) || '{}');
}
