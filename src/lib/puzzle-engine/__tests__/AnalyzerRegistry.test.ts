import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyzerRegistry, analyzerRegistry } from '../core/AnalyzerRegistry';
import { BaseAnalyzer } from '../core/BaseAnalyzer';
import type { AnalyzerResult, ConnectionType } from '../types';
import type { TMDBMovieDetails } from '../../../types';

// Mock analyzer for testing
class MockAnalyzer extends BaseAnalyzer {
  readonly name: string;
  readonly connectionType: ConnectionType;

  constructor(name: string, type: ConnectionType = 'director', enabled: boolean = true) {
    super();
    this.name = name;
    this.connectionType = type;
    this._config.enabled = enabled;
  }

  protected async findConnections(_movies: TMDBMovieDetails[]): Promise<AnalyzerResult[]> {
    return [];
  }
}

describe('AnalyzerRegistry', () => {
  let registry: AnalyzerRegistry;

  beforeEach(() => {
    // Get fresh instance and clear it
    registry = AnalyzerRegistry.getInstance();
    registry.clear();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AnalyzerRegistry.getInstance();
      const instance2 = AnalyzerRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('register', () => {
    it('should register an analyzer', () => {
      const analyzer = new MockAnalyzer('test-analyzer');
      registry.register(analyzer);

      expect(registry.get('test-analyzer')).toBe(analyzer);
      expect(registry.count()).toBe(1);
    });

    it('should not register duplicate analyzers', () => {
      const analyzer1 = new MockAnalyzer('duplicate');
      const analyzer2 = new MockAnalyzer('duplicate');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      registry.register(analyzer1);
      registry.register(analyzer2);

      expect(registry.count()).toBe(1);
      expect(registry.get('duplicate')).toBe(analyzer1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered')
      );

      consoleSpy.mockRestore();
    });

    it('should register multiple different analyzers', () => {
      const analyzer1 = new MockAnalyzer('analyzer-1');
      const analyzer2 = new MockAnalyzer('analyzer-2');

      registry.register(analyzer1);
      registry.register(analyzer2);

      expect(registry.count()).toBe(2);
      expect(registry.getNames()).toContain('analyzer-1');
      expect(registry.getNames()).toContain('analyzer-2');
    });
  });

  describe('unregister', () => {
    it('should unregister an analyzer', () => {
      const analyzer = new MockAnalyzer('test');
      registry.register(analyzer);

      expect(registry.has('test')).toBe(true);

      const removed = registry.unregister('test');

      expect(removed).toBe(true);
      expect(registry.has('test')).toBe(false);
      expect(registry.count()).toBe(0);
    });

    it('should return false when unregistering non-existent analyzer', () => {
      const removed = registry.unregister('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('get', () => {
    it('should return analyzer by name', () => {
      const analyzer = new MockAnalyzer('test');
      registry.register(analyzer);

      const retrieved = registry.get('test');
      expect(retrieved).toBe(analyzer);
    });

    it('should return undefined for non-existent analyzer', () => {
      const retrieved = registry.get('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return empty array when no analyzers registered', () => {
      expect(registry.getAll()).toEqual([]);
    });

    it('should return all registered analyzers', () => {
      const analyzer1 = new MockAnalyzer('a1');
      const analyzer2 = new MockAnalyzer('a2');
      const analyzer3 = new MockAnalyzer('a3');

      registry.register(analyzer1);
      registry.register(analyzer2);
      registry.register(analyzer3);

      const all = registry.getAll();
      expect(all).toHaveLength(3);
      expect(all).toContain(analyzer1);
      expect(all).toContain(analyzer2);
      expect(all).toContain(analyzer3);
    });
  });

  describe('getEnabled', () => {
    it('should return only enabled analyzers', () => {
      const enabled1 = new MockAnalyzer('enabled-1', 'director', true);
      const enabled2 = new MockAnalyzer('enabled-2', 'actor', true);
      const disabled = new MockAnalyzer('disabled', 'theme', false);

      registry.register(enabled1);
      registry.register(enabled2);
      registry.register(disabled);

      const enabledAnalyzers = registry.getEnabled();

      expect(enabledAnalyzers).toHaveLength(2);
      expect(enabledAnalyzers).toContain(enabled1);
      expect(enabledAnalyzers).toContain(enabled2);
      expect(enabledAnalyzers).not.toContain(disabled);
    });

    it('should return empty array when all analyzers are disabled', () => {
      const disabled1 = new MockAnalyzer('d1', 'director', false);
      const disabled2 = new MockAnalyzer('d2', 'actor', false);

      registry.register(disabled1);
      registry.register(disabled2);

      expect(registry.getEnabled()).toEqual([]);
    });
  });

  describe('getByType', () => {
    it('should return analyzers of specific type', () => {
      const director1 = new MockAnalyzer('d1', 'director');
      const director2 = new MockAnalyzer('d2', 'director');
      const actor = new MockAnalyzer('a1', 'actor');

      registry.register(director1);
      registry.register(director2);
      registry.register(actor);

      const directors = registry.getByType('director');

      expect(directors).toHaveLength(2);
      expect(directors).toContain(director1);
      expect(directors).toContain(director2);
      expect(directors).not.toContain(actor);
    });

    it('should return empty array for non-existent type', () => {
      const analyzer = new MockAnalyzer('test', 'director');
      registry.register(analyzer);

      const results = registry.getByType('actor');
      expect(results).toEqual([]);
    });
  });

  describe('has', () => {
    it('should return true for registered analyzer', () => {
      const analyzer = new MockAnalyzer('test');
      registry.register(analyzer);

      expect(registry.has('test')).toBe(true);
    });

    it('should return false for non-existent analyzer', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('count', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.count()).toBe(0);
    });

    it('should return correct count', () => {
      registry.register(new MockAnalyzer('a1'));
      registry.register(new MockAnalyzer('a2'));
      registry.register(new MockAnalyzer('a3'));

      expect(registry.count()).toBe(3);
    });
  });

  describe('clear', () => {
    it('should remove all analyzers', () => {
      registry.register(new MockAnalyzer('a1'));
      registry.register(new MockAnalyzer('a2'));

      expect(registry.count()).toBe(2);

      registry.clear();

      expect(registry.count()).toBe(0);
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('getNames', () => {
    it('should return array of analyzer names', () => {
      registry.register(new MockAnalyzer('analyzer-1'));
      registry.register(new MockAnalyzer('analyzer-2'));
      registry.register(new MockAnalyzer('analyzer-3'));

      const names = registry.getNames();

      expect(names).toHaveLength(3);
      expect(names).toContain('analyzer-1');
      expect(names).toContain('analyzer-2');
      expect(names).toContain('analyzer-3');
    });

    it('should return empty array for empty registry', () => {
      expect(registry.getNames()).toEqual([]);
    });
  });
});

describe('analyzerRegistry singleton', () => {
  it('should be an instance of AnalyzerRegistry', () => {
    expect(analyzerRegistry).toBeInstanceOf(AnalyzerRegistry);
  });

  it('should be the same as getInstance()', () => {
    expect(analyzerRegistry).toBe(AnalyzerRegistry.getInstance());
  });
});
