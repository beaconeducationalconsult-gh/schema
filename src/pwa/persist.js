export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false;
  const already = await navigator.storage.persisted();
  if (already) return true;
  return navigator.storage.persist();
}
