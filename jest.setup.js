/* eslint-env jest */
// MMKV swaps in an in-memory store under Jest, but importing it still loads
// nitro-modules, which asks for its native module at import time.
jest.mock('react-native-nitro-modules', () => ({}));
