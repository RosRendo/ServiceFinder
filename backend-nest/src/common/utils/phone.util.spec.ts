import { normalizePhone, isValidPhone } from './phone.util';

describe('normalizePhone', () => {
  it('normalizes local Cambodian numbers to E.164', () => {
    expect(normalizePhone('012345678')).toBe('+85512345678');
    expect(normalizePhone('012 345 678')).toBe('+85512345678');
    expect(normalizePhone('010123456')).toBe('+85510123456');
  });

  it('normalizes bare country-code digits', () => {
    expect(normalizePhone('85512345678')).toBe('+85512345678');
  });

  it('keeps valid international numbers', () => {
    expect(normalizePhone('+85512345678')).toBe('+85512345678');
    expect(normalizePhone('+84123456789')).toBe('+84123456789');
    expect(normalizePhone('+1 202 555 0100')).toBe('+12025550100');
  });

  it('strips separators', () => {
    expect(normalizePhone('+855-12-345-678')).toBe('+85512345678');
    expect(normalizePhone('+855 (12) 345 678')).toBe('+85512345678');
  });

  it('rejects garbage that would otherwise be charged', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('abc')).toBeNull();
    expect(normalizePhone('123')).toBeNull(); // too short
    expect(normalizePhone('+123')).toBeNull(); // too short
    expect(normalizePhone('12345678901234567890')).toBeNull(); // too long
    expect(normalizePhone('+85512345678901234567')).toBeNull(); // too long
    expect(normalizePhone('not-a-phone')).toBeNull();
    expect(normalizePhone(null as any)).toBeNull();
    expect(normalizePhone(undefined as any)).toBeNull();
  });

  it('exposes isValidPhone as a boolean convenience', () => {
    expect(isValidPhone('012345678')).toBe(true);
    expect(isValidPhone('+85512345678')).toBe(true);
    expect(isValidPhone('garbage')).toBe(false);
  });
});
