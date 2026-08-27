import { describe, expect, it } from 'vitest';
import { emptyFormState, toPayload } from './motorcycleForm';

/**
 * Additional specs cannot pollute Object.prototype. `Object.fromEntries` creates own data properties, not reassignments. */
describe('SEC: additional specs cannot pollute Object.prototype', () => {
  it('a "__proto__" key becomes a harmless own property instead of touching the prototype', () => {
    const state = emptyFormState();
    state.brand = 'Yamaha';
    state.additionalSpecs = [
      { key: '__proto__', value: 'polluted' },
      { key: 'constructor', value: 'polluted' },
    ];

    const payload = toPayload(state);

    expect({}.polluted).toBeUndefined();
    expect(Object.prototype.polluted).toBeUndefined();
    expect(Object.getPrototypeOf(payload.additionalSpecs)).toBe(Object.prototype);
  });
});
