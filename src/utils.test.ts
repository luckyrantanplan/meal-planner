import { describe, it, expect } from 'vitest';
import { normalizeName, getMeasure } from './utils';

describe('normalizeName', () => {
  it('should return lowercase single word unchanged when not in dictionary', () => {
    const result = normalizeName('pomme');
    expect(result).toBe('pomme');
  });

  it('should convert plural to singular using the dictionary', () => {
    // 'abacas' -> 'abaca' is in dico.json
    const result = normalizeName('abacas');
    expect(result).toBe('abaca');
  });

  it('should handle multiple words', () => {
    const result = normalizeName('pomme de terre');
    expect(typeof result).toBe('string');
    expect(result.split(' ').length).toBe(3);
  });

  it('should replace œ with oe', () => {
    const result = normalizeName('bœuf');
    expect(result).not.toContain('œ');
    expect(result).toContain('oe');
  });

  it('should handle empty string', () => {
    const result = normalizeName('');
    expect(result).toBe('');
  });

  it('should convert to lowercase', () => {
    const result = normalizeName('Pomme');
    expect(result).toBe(result.toLowerCase());
  });
});

describe('getMeasure', () => {
  it('should return number directly when input is a number', () => {
    expect(getMeasure(42)).toBe(42);
    expect(getMeasure(3.5)).toBe(3.5);
    expect(getMeasure(0)).toBe(0);
  });

  it('should parse number from string', () => {
    expect(getMeasure('100&nbsp;g')).toBe(100);
  });

  it('should parse decimal numbers from string', () => {
    expect(getMeasure('2.5&nbsp;kg')).toBe(2.5);
  });

  it('should return 0 for non-numeric string', () => {
    expect(getMeasure('abc')).toBe(0);
  });

  it('should handle negative numbers', () => {
    expect(getMeasure('-5&nbsp;ml')).toBe(-5);
  });
});
