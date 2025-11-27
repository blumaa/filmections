/**
 * Group Generator Admin Page
 *
 * Generates connection groups for the curated pool using Claude AI.
 * Uses era-balanced pool for diverse films (1920s-present).
 * Verifies AI claims against actual data.
 */

import { useState } from 'react';
import { Box, Heading, Text, Button, Spinner, Badge } from '@mond-design-system/theme';
import {
  AIGroupGenerator,
  type GeneratedGroup,
} from '../../services/AIGroupGenerator';
import { HybridGroupGenerator, type FormattedGroup } from '../../services/HybridGroupGenerator';
import { EraBalancedPoolBuilder } from '../../services/EraBalancedPoolBuilder';
import { SupabaseGroupStorage } from '../../lib/supabase/storage/SupabaseGroupStorage';
import { useSaveGroupBatch } from '../../lib/supabase/storage/useGroupStorage';
import { supabase } from '../../lib/supabase/client';
import { useToast } from '../../providers/useToast';
import { DIFFICULTY_COLORS } from '../../constants/difficulty';
import './GroupGeneratorPage.css';

// Create storage instance
const groupStorage = new SupabaseGroupStorage(supabase);

/**
 * Config for hybrid generation
 */
interface GeneratorConfig {
  moviePoolSize: number;
  groupCount: number;
  useHybrid: boolean; // Use deterministic + AI hybrid approach
}

const DEFAULT_CONFIG: GeneratorConfig = {
  moviePoolSize: 200,
  groupCount: 10,
  useHybrid: true, // Default to hybrid for reliability
};

// Extended type that can hold both deterministic and AI groups
type DisplayGroup = (GeneratedGroup | FormattedGroup) & { source?: 'deterministic' | 'ai-thematic' };

export function GroupGeneratorPage() {
  const toast = useToast();
  const [config, setConfig] = useState<GeneratorConfig>(DEFAULT_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGroups, setGeneratedGroups] = useState<DisplayGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState<{ input: number; output: number } | null>(null);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [eraDistribution, setEraDistribution] = useState<Record<string, number> | null>(null);
  const [deterministicCount, setDeterministicCount] = useState<number>(0);

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

  const updateConfig = (updates: Partial<GeneratorConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveToPool = () => {
    if (generatedGroups.length === 0) {
      toast.showError('No groups to save', 'Generate groups first');
      return;
    }
    const groupInputs = generatedGroups.map(AIGroupGenerator.toGroupInput);
    saveMutation.mutate(groupInputs);
  };

  const handleRemoveGroup = (index: number) => {
    setGeneratedGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(null);
    setGeneratedGroups([]);
    setTokensUsed(null);
    setFilteredCount(0);
    setEraDistribution(null);
    setDeterministicCount(0);

    try {
      // Build era-balanced pool (equal distribution across 5 eras)
      setProgress('Building era-balanced film pool (1920s-present)...');
      const poolBuilder = new EraBalancedPoolBuilder();
      const poolResult = await poolBuilder.buildPool(config.moviePoolSize);

      setEraDistribution(poolResult.eraDistribution);
      setProgress(
        `Pool built: ${poolResult.totalFetched} films across ${Object.keys(poolResult.eraDistribution).length} eras`
      );

      if (config.useHybrid) {
        // HYBRID APPROACH: Deterministic discovery first
        setProgress('Finding guaranteed connections (director, actor, title patterns)...');

        const hybridGenerator = new HybridGroupGenerator({
          maxDeterministicGroups: config.groupCount,
          preferDiversity: true,
        });

        const hybridResult = await hybridGenerator.generate(poolResult.films, config.groupCount);

        setGeneratedGroups(hybridResult.groups);
        setDeterministicCount(hybridResult.deterministicCount);

        const statusMessage = `Found ${hybridResult.deterministicCount} guaranteed connections (100% verified)`;
        setProgress(statusMessage);
      } else {
        // AI-ONLY APPROACH (original behavior)
        setProgress(
          `Sending ${poolResult.films.length} films to AI for analysis (requesting ${config.groupCount} groups)...`
        );

        const generator = new AIGroupGenerator({
          groupCount: config.groupCount,
          preferCreative: true,
        });
        const result = await generator.generateGroups(poolResult.films, config.groupCount);

        setGeneratedGroups(result.groups);
        setTokensUsed(result.tokensUsed || null);
        setFilteredCount(result.filteredCount || 0);

        let statusMessage = `Generated ${result.groups.length} verified groups`;
        if (result.filteredCount) {
          statusMessage += ` (${result.filteredCount} rejected by validation/verification)`;
        }
        setProgress(statusMessage);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate groups';
      setError(message);
      setProgress(null);

      if (message.includes('API key')) {
        setError(
          'API key not configured. Add VITE_ANTHROPIC_API_KEY to your .env.local file.'
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      <Box display="flex" flexDirection="column" gap="sm">
        <Heading level={1} size="2xl">
          AI Group Generator
        </Heading>
        <Text size="md">
          Generate creative connection groups using Claude AI
        </Text>
      </Box>

      <div className="batch-generator-grid">
        {/* Movie Pool Settings */}
        <Box className="generator-section">
          <Box display="flex" flexDirection="column" gap="md">
            <Heading level={2} size="lg">
              Era-Balanced Pool
            </Heading>

            <Box display="flex" flexDirection="column" gap="xs">
              <label htmlFor="poolSize">
                <Text size="md" weight="medium">
                  Pool Size: {config.moviePoolSize} movies
                </Text>
              </label>
              <input
                id="poolSize"
                type="range"
                min="100"
                max="500"
                step="25"
                value={config.moviePoolSize}
                onChange={(e) => updateConfig({ moviePoolSize: Number(e.target.value) })}
                className="range-input"
              />
              <Text size="xs">More movies = more potential connections</Text>
            </Box>

            <Box className="ai-info-box" padding="3">
              <Text size="xs">
                Films are fetched with equal distribution across 5 eras:
              </Text>
              <Text size="xs">
                Silent/Classic (1920-1959) | New Hollywood (1960-1979) |
                Blockbuster (1980-1999) | Modern (2000-2014) | Contemporary (2015+)
              </Text>
            </Box>

            {eraDistribution && (
              <Box className="era-distribution" padding="2">
                <Text size="xs" weight="medium">Pool breakdown:</Text>
                {Object.entries(eraDistribution).map(([era, count]) => (
                  <Text key={era} size="xs">
                    {era}: {count} films
                  </Text>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* AI Generation Settings */}
        <Box className="generator-section">
          <Box display="flex" flexDirection="column" gap="md">
            <Heading level={2} size="lg">
              AI Generation Settings
            </Heading>

            <Box display="flex" flexDirection="column" gap="xs">
              <label htmlFor="groupCount">
                <Text size="md" weight="medium">
                  Groups to Generate: {config.groupCount}
                </Text>
              </label>
              <input
                id="groupCount"
                type="range"
                min="4"
                max="20"
                step="1"
                value={config.groupCount}
                onChange={(e) => updateConfig({ groupCount: Number(e.target.value) })}
                className="range-input"
              />
              <Text size="xs">
                AI will find this many unique 4-film connections
              </Text>
            </Box>

            <label className="analyzer-toggle">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={config.useHybrid}
                onChange={(e) => updateConfig({ useHybrid: e.target.checked })}
              />
              <span className="analyzer-label">
                <Text size="md" weight="medium">
                  Use Hybrid Mode (Recommended)
                </Text>
                <Text size="xs">
                  Deterministic discovery finds guaranteed connections first
                </Text>
              </span>
            </label>

            <Box className="ai-info-box" padding="3">
              <Text size="xs">
                {config.useHybrid
                  ? 'Hybrid mode: Finds director, actor, and title pattern connections that are 100% verified.'
                  : 'AI mode: AI suggests connections with verification. Some may fail verification.'}
              </Text>
            </Box>

            {tokensUsed && (
              <Box className="token-usage" padding="2">
                <Text size="xs">
                  Tokens used: {tokensUsed.input} input + {tokensUsed.output} output
                  (est. ${((tokensUsed.input * 0.003 + tokensUsed.output * 0.015) / 1000).toFixed(3)})
                </Text>
              </Box>
            )}

            {filteredCount > 0 && (
              <Box className="filtered-notice" padding="2">
                <Text size="xs">
                  {filteredCount} group{filteredCount !== 1 ? 's' : ''} filtered for violating rules
                  (franchises, trivial patterns, etc.)
                </Text>
              </Box>
            )}

            {deterministicCount > 0 && (
              <Box className="ai-info-box" padding="2">
                <Text size="xs">
                  {deterministicCount} guaranteed connections found (director, actor, title patterns)
                </Text>
              </Box>
            )}
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
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Box display="flex" alignItems="center" gap="sm">
                    <Spinner size="sm" />
                    <span>Generating...</span>
                  </Box>
                ) : (
                  'Generate with AI'
                )}
              </Button>
            </Box>

            {progress && (
              <Box className="progress-message" padding="2">
                <Text size="md">{progress}</Text>
              </Box>
            )}

            {error && (
              <Box className="error-message" padding="2">
                <Text size="md">{error}</Text>
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
                                backgroundColor: DIFFICULTY_COLORS[group.color],
                              }}
                            />
                            <Text size="md" weight="medium">
                              {group.connection}
                            </Text>
                            <span className="verification-badge verified" title="Verified against actual data">
                              ✓
                            </span>
                          </Box>
                          <Box display="flex" alignItems="center" gap="sm">
                            {group.source === 'deterministic' && (
                              <Badge variant="default" size="sm">
                                guaranteed
                              </Badge>
                            )}
                            {group.category && (
                              <Badge variant="outline" size="sm">
                                {group.category}
                              </Badge>
                            )}
                            <Text size="xs">
                              {group.difficulty}
                            </Text>
                            <button
                              className="remove-group-btn"
                              onClick={() => handleRemoveGroup(index)}
                              aria-label="Remove group"
                            >
                              &times;
                            </button>
                          </Box>
                        </Box>
                        <Text size="xs">
                          {group.films.map((f) => `${f.title} (${f.year})`).join(', ')}
                        </Text>
                        {group.explanation && (
                          <span className="explanation-text">
                            <Text size="xs">{group.explanation}</Text>
                          </span>
                        )}
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
                    {saveMutation.isPending ? (
                      <Box display="flex" alignItems="center" gap="sm">
                        <Spinner size="sm" />
                        <span>Saving...</span>
                      </Box>
                    ) : (
                      `Save ${generatedGroups.length} Groups to Pool`
                    )}
                  </Button>
                </Box>
              </>
            ) : isGenerating ? (
              <Box className="empty-state" display="flex" flexDirection="column" alignItems="center" gap="md">
                <Spinner size="lg" />
                <Text size="md">Generating groups...</Text>
                {progress && <Text size="xs">{progress}</Text>}
              </Box>
            ) : (
              <Box className="empty-state">
                <Text size="md">No groups generated yet</Text>
                <Text size="xs">
                  Configure settings and click Generate with AI to find creative connections
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </div>
    </Box>
  );
}
