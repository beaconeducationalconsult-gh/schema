import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, getDefaultSettings } from '../db/settings';

export const DEFAULT_PREFS = getDefaultSettings().prefs;

const loadPrefs = async () => (await getSettings()).prefs;

/** Live preferences (merged with defaults). `undefined` until the first read finishes. */
export function usePrefs() {
  return useLiveQuery(loadPrefs, []);
}
