import { describe, it, expect } from 'vitest';
import { gamma, factorial, multinomialGamma } from '../src/main/gamma';

describe('gamma function (Lanczos approximation)', () => {
  it('Γ(1) = 1', () => {
    expect(gamma(1)).toBeCloseTo(1, 6);
  });
  it('Γ(2) = 1', () => {
    expect(gamma(2)).toBeCloseTo(1, 6);
  });
  it('Γ(3) = 2', () => {
    expect(gamma(3)).toBeCloseTo(2, 6);
  });
  it('Γ(4) = 6', () => {
    expect(gamma(4)).toBeCloseTo(6, 6);
  });
  it('Γ(5) = 24', () => {
    expect(gamma(5)).toBeCloseTo(24, 6);
  });
  it('Γ(5.5) ≈ 52.3428', () => {
    expect(gamma(5.5)).toBeCloseTo(52.3428, 3);
  });
  it('Γ(0.5) = √π', () => {
    expect(gamma(0.5)).toBeCloseTo(Math.sqrt(Math.PI), 6);
  });
});

describe('factorial via gamma', () => {
  it('0! = 1', () => {
    expect(factorial(0)).toBeCloseTo(1, 6);
  });
  it('1! = 1', () => {
    expect(factorial(1)).toBeCloseTo(1, 6);
  });
  it('5! = 120', () => {
    expect(factorial(5)).toBeCloseTo(120, 6);
  });
  it('6! = 720', () => {
    expect(factorial(6)).toBeCloseTo(720, 6);
  });
  it('throws on negative', () => {
    expect(() => factorial(-1)).toThrow();
  });
});

describe('multinomialGamma', () => {
  it('C(2;1,1) = 2', () => {
    expect(multinomialGamma(2, [1, 1])).toBeCloseTo(2, 6);
  });
  it('C(5;2,3) = 10', () => {
    expect(multinomialGamma(5, [2, 3])).toBeCloseTo(10, 6);
  });
  it('C(6;2,2,2) = 90', () => {
    expect(multinomialGamma(6, [2, 2, 2])).toBeCloseTo(90, 6);
  });
  it('sum mismatch → 0', () => {
    expect(multinomialGamma(5, [2, 2])).toBe(0);
  });
});
