export function storageKey(key: string): string {
  return `${import.meta.env.VITE_APP_STORAGE_PREFIX ?? 'runlume.'}${key}`
}
