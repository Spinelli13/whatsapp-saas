// Manual mock for @react-native-async-storage/async-storage
const storage = {};

module.exports = {
  setItem: jest.fn((key, value) => {
    storage[key] = value;
    return Promise.resolve();
  }),
  getItem: jest.fn((key) => Promise.resolve(storage[key] ?? null)),
  removeItem: jest.fn((key) => {
    delete storage[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    return Promise.resolve();
  }),
  multiGet: jest.fn((keys) => Promise.resolve(keys.map((k) => [k, storage[k] ?? null]))),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([k, v]) => { storage[k] = v; });
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(storage))),
  _storage: storage,
  _reset: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
};
