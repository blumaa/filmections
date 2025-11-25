/**
 * Group Generator Admin Page
 *
 * Generates connection groups for the curated pool.
 * Uses the GroupGenerator service with configurable quality controls.
 */

import { useState } from 'react';
import { Box, Heading, Text, Button } from '@mond-design-system/theme';
import { GroupGenerator, type GroupGeneratorConfig, type GeneratedGroup } from '../../services/GroupGenerator';
import type { TMDBMovieDetails } from '../../types';
import { TMDBService } from '../../services/tmdb';
import { SupabaseGroupStorage } from '../../lib/supabase/storage/SupabaseGroupStorage';
import { useSaveGroupBatch } from '../../lib/supabase/storage/useGroupStorage';
import { supabase } from '../../lib/supabase/client';
import {
  DirectorAnalyzer,
  ActorAnalyzer,
  DecadeAnalyzer,
  YearAnalyzer,
  analyzerRegistry,
} from '../../lib/puzzle-engine';
import { useToast } from '../../providers/useToast';
import './GroupGeneratorPage.css';

// Create storage instance
const groupStorage = new SupabaseGroupStorage(supabase);

// Color mapping for display
const colorHex: Record<string, string> = {
  yellow: '#f6c143',
  green: '#6aaa64',
  blue: '#85c0f9',
  purple: '#b19cd9',
};

const DEFAULT_CONFIG: GroupGeneratorConfig = {
  moviePoolSize: 200,
  qualityThreshold: 35,
  maxGroupsPerBatch: 50,
  enabledAnalyzers: ['director', 'actor', 'decade', 'year'],
  poolFilters: {
    minYear: 1920,
    maxYear: new Date().getFullYear(),
    minVoteCount: 50,
    minPopularity: 5,
  },
};

export function GroupGeneratorPage() {
  const toast = useToast();
  const [config, setConfig] = useState<GroupGeneratorConfig>(DEFAULT_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGroups, setGeneratedGroups] = useState<GeneratedGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  // Mutation for saving groups to database
  const saveMutation = useSaveGroupBatch(groupStorage, {
    onSuccess: (data, variables) => {
      const skipped = variables.length - data.length;
      if (data.length === 0) {
        toast.showInfo('All groups already exist in pool');
      } else if (skipped > 0) {
        toast.showSuccess(`Saved ${data.length} groups (${skipped} duplicates skipped)`);
      } else {
        toast.showSuccess(`Saved ${data.length} groups to pool!`);
      }
      setProgress(`Saved ${data.length} groups to pool`);
      setGeneratedGroups([]);
    },
    onError: (err) => {
      toast.showError('Failed to save groups', err.message);
      setError(`Failed to save groups: ${err.message}`);
    },
  });

  const updateConfig = (updates: Partial<GroupGeneratorConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const updatePoolFilters = (updates: Partial<GroupGeneratorConfig['poolFilters']>) => {
    setConfig((prev) => ({
      ...prev,
      poolFilters: { ...prev.poolFilters, ...updates },
    }));
  };

  const toggleAnalyzer = (analyzer: string) => {
    setConfig((prev) => {
      const enabled = prev.enabledAnalyzers || [];
      const isEnabled = enabled.includes(analyzer);
      return {
        ...prev,
        enabledAnalyzers: isEnabled
          ? enabled.filter((a) => a !== analyzer)
          : [...enabled, analyzer],
      };
    });
  };

  const handleSaveToPool = () => {
    if (generatedGroups.length === 0) {
      toast.showError('No groups to save', 'Generate groups first');
      return;
    }
    const groupInputs = generatedGroups.map(GroupGenerator.toGroupInput);
    console.log('Saving groups:', groupInputs);
    saveMutation.mutate(groupInputs);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(null);
    setGeneratedGroups([]);

    try {
      // Register analyzers
      analyzerRegistry.clear();
      analyzerRegistry.register(new DirectorAnalyzer());
      analyzerRegistry.register(new ActorAnalyzer());
      analyzerRegistry.register(new DecadeAnalyzer());
      analyzerRegistry.register(new YearAnalyzer());

      // Initialize TMDB service
      const tmdb = new TMDBService();

      // Fetch movie pool from TMDB
      setProgress('Fetching movies from TMDB...');
      const poolSize = config.moviePoolSize || 200;
      const moviesPerPage = 20;
      const pagesToFetch = Math.ceil(poolSize / moviesPerPage);

      const moviePromises: Promise<TMDBMovieDetails>[] = [];

      // Fetch movies from multiple pages
      for (let page = 1; page <= pagesToFetch; page++) {
        const response = await tmdb.discoverMovies({
          page,
          sort_by: 'popularity.desc',
          minYear: config.poolFilters?.minYear,
          maxYear: config.poolFilters?.maxYear,
          vote_count_gte: config.poolFilters?.minVoteCount,
        });

        // Get details for each movie (includes credits)
        for (const movie of response.results.slice(0, moviesPerPage)) {
          moviePromises.push(tmdb.getMovieDetails(movie.id));
        }
      }

      setProgress(`Fetching details for ${moviePromises.length} movies...`);
      const moviePool = await Promise.all(moviePromises);

      // Create group generator with configuration
      setProgress('Generating groups...');
      const generator = new GroupGenerator(config);

      // Generate groups
      const result = await generator.generateGroups(moviePool);

      setGeneratedGroups(result.groups);
      setProgress(
        `Found ${result.totalFound} potential groups, returning ${result.groups.length} groups. ` +
        `Filtered: ${result.filteredCount}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate groups');
      setProgress(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      <Box display="flex" flexDirection="column" gap="sm">
        <Heading level={1} size="2xl">
          Group Generator
        </Heading>
        <Text variant="body">
          Generate connection groups for the curated pool
        </Text>
      </Box>

      <div className="batch-generator-grid">
        {/* Movie Pool Settings */}
        <Box className="generator-section">
          <Box display="flex" flexDirection="column" gap="md">
            <Heading level={2} size="lg">
              Movie Pool Settings
            </Heading>

            <Box display="flex" flexDirection="column" gap="xs">
              <label htmlFor="poolSize">
                <Text variant="body" weight="medium">
                  Pool Size: {config.moviePoolSize}
                </Text>
              </label>
              <input
                id="poolSize"
                type="range"
                min="50"
                max="500"
                step="50"
                value={config.moviePoolSize}
                onChange={(e) => updateConfig({ moviePoolSize: Number(e.target.value) })}
                className="range-input"
              />
              <Text variant="caption">Number of movies to consider</Text>
            </Box>

            <Box display="flex" gap="md">
              <div style={{ flex: 1 }}>
                <Box display="flex" flexDirection="column" gap="xs">
                  <label htmlFor="minYear">
                    <Text variant="body" weight="medium">
                      Min Year
                    </Text>
                  </label>
                  <input
                    id="minYear"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={config.poolFilters?.minYear || 1980}
                    onChange={(e) => updatePoolFilters({ minYear: Number(e.target.value) })}
                    className="number-input"
                  />
                </Box>
              </div>

              <div style={{ flex: 1 }}>
                <Box display="flex" flexDirection="column" gap="xs">
                  <label htmlFor="maxYear">
                    <Text variant="body" weight="medium">
                      Max Year
                    </Text>
                  </label>
                  <input
                    id="maxYear"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={config.poolFilters?.maxYear || new Date().getFullYear()}
                    onChange={(e) => updatePoolFilters({ maxYear: Number(e.target.value) })}
                    className="number-input"
                  />
                </Box>
              </div>
            </Box>

            <Box display="flex" flexDirection="column" gap="xs">
              <label htmlFor="minVotes">
                <Text variant="body" weight="medium">
                  Min Vote Count: {config.poolFilters?.minVoteCount || 50}
                </Text>
              </label>
              <input
                id="minVotes"
                type="range"
                min="0"
                max="1000"
                step="10"
                value={config.poolFilters?.minVoteCount || 50}
                onChange={(e) => updatePoolFilters({ minVoteCount: Number(e.target.value) })}
                className="range-input"
              />
              <Text variant="caption">Minimum number of user votes</Text>
            </Box>

            <Box display="flex" flexDirection="column" gap="xs">
              <label htmlFor="minPopularity">
                <Text variant="body" weight="medium">
                  Min Popularity: {config.poolFilters?.minPopularity || 5}
                </Text>
              </label>
              <input
                id="minPopularity"
                type="range"
                min="0"
                max="100"
                step="1"
                value={config.poolFilters?.minPopularity || 5}
                onChange={(e) => updatePoolFilters({ minPopularity: Number(e.target.value) })}
                className="range-input"
              />
              <Text variant="caption">TMDB popularity score</Text>
            </Box>
          </Box>
        </Box>

        {/* Analyzer Toggles */}
        <Box className="generator-section">
          <Box display="flex" flexDirection="column" gap="md">
            <Heading level={2} size="lg">
              Enabled Analyzers
            </Heading>
            <Text variant="caption">
              Select which analyzers to use for finding connections
            </Text>

            <Box display="flex" flexDirection="column" gap="sm">
              {['director', 'actor', 'decade', 'year'].map((analyzer) => (
                <label key={analyzer} className="analyzer-toggle">
                  <input
                    type="checkbox"
                    checked={config.enabledAnalyzers?.includes(analyzer) || false}
                    onChange={() => toggleAnalyzer(analyzer)}
                    className="checkbox-input"
                  />
                  <span className="analyzer-label">
                    <Text variant="body">
                      {analyzer.charAt(0).toUpperCase() + analyzer.slice(1)}
                    </Text>
                  </span>
                </label>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Generation Settings */}
        <Box className="generator-section">
          <Box display="flex" flexDirection="column" gap="md">
            <Heading level={2} size="lg">
              Generation Settings
            </Heading>

            <Box display="flex" flexDirection="column" gap="xs">
              <label htmlFor="maxGroups">
                <Text variant="body" weight="medium">
                  Max Groups: {config.maxGroupsPerBatch}
                </Text>
              </label>
              <input
                id="maxGroups"
                type="range"
                min="10"
                max="100"
                step="5"
                value={config.maxGroupsPerBatch}
                onChange={(e) => updateConfig({ maxGroupsPerBatch: Number(e.target.value) })}
                className="range-input"
              />
              <Text variant="caption">Maximum groups to generate</Text>
            </Box>
          </Box>
        </Box>

        {/* Generation Results */}
        <Box className="generator-section generator-results">
          <Box display="flex" flexDirection="column" gap="md">
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Heading level={2} size="lg">
                Generated Groups
              </Heading>
              <Button
                variant="primary"
                size="md"
                onClick={handleGenerate}
                disabled={isGenerating || (config.enabledAnalyzers?.length || 0) === 0}
              >
                {isGenerating ? 'Generating...' : 'Generate Groups'}
              </Button>
            </Box>

            {progress && (
              <Box className="progress-message" padding="2">
                <Text variant="body">{progress}</Text>
              </Box>
            )}

            {error && (
              <Box className="error-message" padding="2">
                <Text variant="body">{error}</Text>
              </Box>
            )}

            {generatedGroups.length > 0 ? (
              <>
                <Box display="flex" flexDirection="column" gap="md">
                  {generatedGroups.map((group, index) => (
                    <Box key={index} className="puzzle-result" padding="3">
                      <Box display="flex" flexDirection="column" gap="sm">
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap="sm">
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: colorHex[group.color],
                              }}
                            />
                            <Text variant="body" weight="medium">
                              {group.connection}
                            </Text>
                          </Box>
                          <Text variant="caption">
                            Score: {group.difficultyScore} | {group.difficulty}
                          </Text>
                        </Box>
                        <Text variant="caption">
                          {group.films.map((f) => f.title).join(', ')}
                        </Text>
                      </Box>
                    </Box>
                  ))}
                </Box>

                <Box display="flex" justifyContent="center" padding="4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSaveToPool}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save to Pool'}
                  </Button>
                </Box>
              </>
            ) : (
              <Box className="empty-state">
                <Text variant="body">No groups generated yet</Text>
                <Text variant="caption">
                  Configure settings and click Generate Groups to find connections
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </div>
    </Box>
  );
}
