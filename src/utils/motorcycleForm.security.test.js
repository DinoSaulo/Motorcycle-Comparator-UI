import { describe, expect, it } from 'vitest';
import { emptyFormState, toPayload } from './motorcycleForm';

/**
 * The additional-specs editor lets an admin type arbitrary key/value pairs
 * (`AdditionalSpecsEditor.jsx`), which `toPayload` collapses with
 * `Object.fromEntries`. This locks in that a key like `__proto__` or `constructor`
 * cannot pollute `Object.prototype` — `Object.fromEntries` creates a normal own data
 * property named `__proto__` rather than reassigning the object's prototype, which is
 * exactly the property it needs for this to stay safe.
 */
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
