import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseGroupStorage } from '../SupabaseGroupStorage';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../../types';
import type { GroupInput } from '../IGroupStorage';
import type { Film } from '../../../../types';

// Mock film data
const createMockFilm = (id: number, title: string): Film => ({
  id,
  title,
  year: 2020,
  poster_path: undefined,
});

// Mock stored group data from database
const createMockDbRow = (
  id: string,
  connection: string,
  status: 'pending' | 'approved' | 'rejected' = 'pending'
): Database['public']['Tables']['connection_groups']['Row'] => ({
  id,
  created_at: '2024-01-01T00:00:00Z',
  items: [
    createMockFilm(1, 'Film 1'),
    createMockFilm(2, 'Film 2'),
    createMockFilm(3, 'Film 3'),
    createMockFilm(4, 'Film 4'),
  ] as unknown as Json,
  connection,
  connection_type: 'director',
  difficulty_score: 5000,
  color: 'green',
  difficulty: 'medium',
  status,
  usage_count: 0,
  last_used_at: null,
  metadata: null,
});

// Mock group input
const createMockGroupInput = (connection: string): GroupInput => ({
  films: [
    createMockFilm(1, 'Film 1'),
    createMockFilm(2, 'Film 2'),
    createMockFilm(3, 'Film 3'),
    createMockFilm(4, 'Film 4'),
  ],
  connection,
  connectionType: 'director',
  difficultyScore: 5000,
  color: 'green',
  difficulty: 'medium',
  status: 'pending',
});

// Create mock Supabase client
const createMockSupabase = () => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockIn = vi.fn();
  const mockSingle = vi.fn();
  const mockRange = vi.fn();
  const mockOrder = vi.fn();

  const chainableMock = {
    select: mockSelect,
    insert: mockInsert,
    upsert: mockUpsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    in: mockIn,
    single: mockSingle,
    range: mockRange,
    order: mockOrder,
  };

  // Make all methods return the chainable mock
  Object.values(chainableMock).forEach((mock) => {
    mock.mockReturnValue(chainableMock);
  });

  const mockFrom = vi.fn().mockReturnValue(chainableMock);
  const mockRpc = vi.fn();

  return {
    from: mockFrom,
    rpc: mockRpc,
    _mocks: {
      from: mockFrom,
      rpc: mockRpc,
      ...chainableMock,
    },
  } as unknown as SupabaseClient<Database> & {
    _mocks: Record<string, ReturnType<typeof vi.fn>>;
  };
};

describe('SupabaseGroupStorage', () => {
  let storage: SupabaseGroupStorage;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    storage = new SupabaseGroupStorage(mockSupabase);
  });

  describe('saveGroup', () => {
    it('should save a single group and return stored group', async () => {
      const input = createMockGroupInput('Directed by Spielberg');
      const dbRow = createMockDbRow('uuid-123', 'Directed by Spielberg');

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: dbRow,
        error: null,
      });

      const result = await storage.saveGroup(input);

      expect(mockSupabase.from).toHaveBeenCalledWith('connection_groups');
      expect(result.id).toBe('uuid-123');
      expect(result.connection).toBe('Directed by Spielberg');
      expect(result.status).toBe('pending');
    });

    it('should throw error when insert fails', async () => {
      const input = createMockGroupInput('Directed by Spielberg');

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Duplicate connection' },
      });

      await expect(storage.saveGroup(input)).rejects.toThrow(
        'Failed to save group'
      );
    });
  });

  describe('saveBatch', () => {
    it('should save multiple groups', async () => {
      const inputs = [
        createMockGroupInput('Directed by Spielberg'),
        createMockGroupInput('Directed by Nolan'),
      ];
      const dbRows = [
        createMockDbRow('uuid-1', 'Directed by Spielberg'),
        createMockDbRow('uuid-2', 'Directed by Nolan'),
      ];

      mockSupabase._mocks.select.mockResolvedValueOnce({
        data: dbRows,
        error: null,
      });

      const results = await storage.saveBatch(inputs);

      expect(results).toHaveLength(2);
      expect(results[0].connection).toBe('Directed by Spielberg');
      expect(results[1].connection).toBe('Directed by Nolan');
    });
  });

  describe('getGroup', () => {
    it('should return group when found', async () => {
      const dbRow = createMockDbRow('uuid-123', 'Directed by Spielberg');

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: dbRow,
        error: null,
      });

      const result = await storage.getGroup('uuid-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('uuid-123');
      expect(result?.connection).toBe('Directed by Spielberg');
    });

    it('should return null when not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });

      const result = await storage.getGroup('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getGroupsByIds', () => {
    it('should return groups in same order as input IDs', async () => {
      const dbRows = [
        createMockDbRow('uuid-2', 'Connection B'),
        createMockDbRow('uuid-1', 'Connection A'),
      ];

      mockSupabase._mocks.in.mockResolvedValueOnce({
        data: dbRows,
        error: null,
      });

      const results = await storage.getGroupsByIds(['uuid-1', 'uuid-2']);

      expect(results).toHaveLength(2);
      // Should be reordered to match input order
      expect(results[0].id).toBe('uuid-1');
      expect(results[1].id).toBe('uuid-2');
    });
  });

  describe('listGroups', () => {
    it('should list groups with pagination', async () => {
      const dbRows = [createMockDbRow('uuid-1', 'Connection A')];

      mockSupabase._mocks.order.mockResolvedValueOnce({
        data: dbRows,
        error: null,
        count: 1,
      });

      const result = await storage.listGroups({ limit: 10, offset: 0 });

      expect(result.groups).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockSupabase._mocks.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      });

      await storage.listGroups({ status: 'approved' });

      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('status', 'approved');
    });

    it('should filter by color', async () => {
      mockSupabase._mocks.order.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      });

      await storage.listGroups({ color: 'yellow' });

      expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('color', 'yellow');
    });
  });

  describe('updateGroup', () => {
    it('should update group and return updated data', async () => {
      const dbRow = createMockDbRow('uuid-123', 'Updated Connection', 'approved');

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: dbRow,
        error: null,
      });

      const result = await storage.updateGroup('uuid-123', {
        connection: 'Updated Connection',
        status: 'approved',
      });

      expect(result.connection).toBe('Updated Connection');
      expect(result.status).toBe('approved');
    });
  });

  describe('deleteGroup', () => {
    it('should delete group by id', async () => {
      mockSupabase._mocks.eq.mockResolvedValueOnce({
        error: null,
      });

      await expect(storage.deleteGroup('uuid-123')).resolves.not.toThrow();
      expect(mockSupabase._mocks.delete).toHaveBeenCalled();
    });
  });

  describe('incrementUsage', () => {
    it('should call RPC to increment usage', async () => {
      mockSupabase._mocks.rpc.mockResolvedValueOnce({
        error: null,
      });

      await storage.incrementUsage(['uuid-1', 'uuid-2']);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_group_usage', {
        group_ids: ['uuid-1', 'uuid-2'],
      });
    });
  });
});
