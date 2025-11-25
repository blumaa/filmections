import { describe, it, expect } from 'vitest';
import { shuffleArray, shuffleArraysInSync } from '../utils/shuffle';

describe('shuffle utilities', () => {
  describe('shuffleArray', () => {
    it('should return array with same length', () => {
      const input = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(input);

      expect(shuffled).toHaveLength(input.length);
    });

    it('should contain same elements', () => {
      const input = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(input);

      expect(shuffled).toEqual(expect.arrayContaining(input));
      expect(input).toEqual(expect.arrayContaining(shuffled));
    });

    it('should not mutate original array', () => {
      const input = [1, 2, 3, 4, 5];
      const original = [...input];
      shuffleArray(input);

      expect(input).toEqual(original);
    });

    it('should handle empty array', () => {
      const input: number[] = [];
      const shuffled = shuffleArray(input);

      expect(shuffled).toEqual([]);
    });

    it('should handle single element', () => {
      const input = [1];
      const shuffled = shuffleArray(input);

      expect(shuffled).toEqual([1]);
    });

    it('should produce different order (probabilistic)', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      let diffCount = 0;

      // Run multiple times to check randomness
      for (let i = 0; i < 10; i++) {
        const shuffled = shuffleArray(input);
        if (JSON.stringify(shuffled) !== JSON.stringify(input)) {
          diffCount++;
        }
      }

      // At least some shuffles should produce different order
      expect(diffCount).toBeGreaterThan(0);
    });

    it('should work with different types', () => {
      const strings = ['a', 'b', 'c'];
      const shuffledStrings = shuffleArray(strings);
      expect(shuffledStrings).toHaveLength(3);
      expect(shuffledStrings).toEqual(expect.arrayContaining(strings));

      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const shuffledObjects = shuffleArray(objects);
      expect(shuffledObjects).toHaveLength(3);
      expect(shuffledObjects).toEqual(expect.arrayContaining(objects));
    });
  });

  describe('shuffleArraysInSync', () => {
    it('should shuffle multiple arrays with same pattern', () => {
      const arr1 = [1, 2, 3, 4, 5];
      const arr2 = ['a', 'b', 'c', 'd', 'e'];

      const [shuffled1, shuffled2] = shuffleArraysInSync(arr1, arr2);

      // Check lengths
      expect(shuffled1).toHaveLength(5);
      expect(shuffled2).toHaveLength(5);

      // Check correspondence is maintained
      for (let i = 0; i < arr1.length; i++) {
        const originalIndex = arr1.indexOf(shuffled1[i]);
        expect(shuffled2[i]).toBe(arr2[originalIndex]);
      }
    });

    it('should not mutate original arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = ['a', 'b', 'c'];
      const original1 = [...arr1];
      const original2 = [...arr2];

      shuffleArraysInSync(arr1, arr2);

      expect(arr1).toEqual(original1);
      expect(arr2).toEqual(original2);
    });

    it('should throw error for arrays of different lengths', () => {
      const arr1 = [1, 2, 3];
      const arr2 = ['a', 'b'];

      expect(() => shuffleArraysInSync(arr1, arr2)).toThrow(
        'All arrays must have the same length'
      );
    });

    it('should handle empty arrays', () => {
      const arr1: number[] = [];
      const arr2: string[] = [];

      const [shuffled1, shuffled2] = shuffleArraysInSync(arr1, arr2);

      expect(shuffled1).toEqual([]);
      expect(shuffled2).toEqual([]);
    });

    it('should work with three or more arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = ['a', 'b', 'c'];
      const arr3 = [true, false, true];

      const [shuffled1, shuffled2, shuffled3] = shuffleArraysInSync(arr1, arr2, arr3);

      // Verify correspondence
      for (let i = 0; i < arr1.length; i++) {
        const originalIndex = arr1.indexOf(shuffled1[i]);
        expect(shuffled2[i]).toBe(arr2[originalIndex]);
        expect(shuffled3[i]).toBe(arr3[originalIndex]);
      }
    });
  });
});
