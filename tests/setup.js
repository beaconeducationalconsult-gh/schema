import 'fake-indexeddb/auto';

// jsdom lacks these browser APIs that some components touch on mount.
if (typeof window !== 'undefined') {
  window.matchMedia ||= (query) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  });
  window.scrollTo ||= () => {};
}
