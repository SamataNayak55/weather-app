// Jest setup file for Vue 3 tests
global.CSS = {
  supports: () => false,
  escape: (value) => value,
};

Object.defineProperty(window, 'CSS', {
  value: {
    supports: () => false,
    escape: (value) => value,
  },
});
