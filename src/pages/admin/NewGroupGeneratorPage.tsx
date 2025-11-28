/**
 * New Group Generator Page
 *
 * AI-first group generation using Claude.
 * Generates film connection groups with TMDB verification.
 * Admin approves/rejects groups with difficulty settings.
 */

import { useState, useEffect, useCallback } from 'react'
import { Box, Heading, Text, Button, Card, Badge, Spinner } from '@mond-design-system/theme'
import { Modal, ModalBody, ModalFooter } from '@mond-design-system/theme/client'
import { useToast } from '../../providers/useToast'
import {
  ConnectionTypeStore,
  FeedbackStore,
  TMDBVerifier,
} from '../../services/group-generator'
import type {
  GeneratedGroup,
  Difficulty,
  GenerationFilters,
  ConnectionType,
} from '../../services/group-generator'
import { SupabaseGroupStorage } from '../../lib/supabase/storage/SupabaseGroupStorage'
import { useSaveGroupBatch } from '../../lib/supabase/storage/useGroupStorage'
import { supabase } from '../../lib/supabase/client'
import './NewGroupGeneratorPage.css'

// Initialize services (these are safe for browser - they use Supabase/TMDB, not Anthropic)
const connectionTypeStore = new ConnectionTypeStore()
const feedbackStore = new FeedbackStore()
const tmdbVerifier = new TMDBVerifier()
const groupStorage = new SupabaseGroupStorage(supabase)

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: 'yellow' },
  { value: 'medium', label: 'Medium', color: 'green' },
  { value: 'hard', label: 'Hard', color: 'blue' },
  { value: 'expert', label: 'Expert', color: 'purple' },
]

// Map our difficulty to legacy difficulty level
const difficultyToLevel: Record<Difficulty, 'easy' | 'medium' | 'hard' | 'hardest'> = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
  expert: 'hardest',
}

export function NewGroupGeneratorPage() {
  const { showSuccess, showError, showInfo } = useToast()

  // State
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedGroups, setGeneratedGroups] = useState<GeneratedGroup[]>([])
  const [connectionTypes, setConnectionTypes] = useState<ConnectionType[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)

  // Filters
  const [yearStart, setYearStart] = useState(1970)
  const [yearEnd, setYearEnd] = useState(new Date().getFullYear())
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([])

  // Review state
  const [approveModalGroup, setApproveModalGroup] = useState<GeneratedGroup | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium')
  const [rejectModalGroup, setRejectModalGroup] = useState<GeneratedGroup | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Save mutation
  const saveMutation = useSaveGroupBatch(groupStorage, {
    onSuccess: (data) => {
      showSuccess(`Saved ${data.length} groups to pool!`)
    },
    onError: (err) => {
      showError('Failed to save', err.message)
    },
  })

  // Load connection types
  const loadConnectionTypes = useCallback(async () => {
    setLoadingTypes(true)
    try {
      const types = await connectionTypeStore.getActive()
      setConnectionTypes(types)
    } catch (err) {
      showError('Failed to load', err instanceof Error ? err.message : 'Failed to load connection types')
    } finally {
      setLoadingTypes(false)
    }
  }, [showError])

  useEffect(() => {
    loadConnectionTypes()
  }, [loadConnectionTypes])

  // Generate groups via API
  const handleGenerate = async () => {
    setIsGenerating(true)
    setGeneratedGroups([])

    try {
      // Get active connection types (filter by selected if any)
      let typesToUse = connectionTypes
      if (selectedTypeIds.length > 0) {
        typesToUse = connectionTypes.filter((t) => selectedTypeIds.includes(t.id))
      }

      // Get feedback examples for learning and existing connections to exclude
      const [goodExamples, badExamples, existingGroupsResult] = await Promise.all([
        feedbackStore.getAcceptedExamples(10),
        feedbackStore.getRejectedExamples(10),
        groupStorage.listGroups({ limit: 1000 }),
      ])

      // Extract existing connection strings to avoid duplicates
      const existingConnections = existingGroupsResult.groups.map((g) => g.connection)

      const filters: GenerationFilters = {
        yearRange: [yearStart, yearEnd],
        excludeConnections: existingConnections,
      }

      // Call API route (Claude runs server-side)
      const response = await fetch('/api/generate-groups-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters,
          connectionTypes: typesToUse,
          goodExamples,
          badExamples,
          count: 20,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate groups')
      }

      const data = await response.json()
      let groups: GeneratedGroup[] = data.groups

      // Verify films with TMDB (this is safe to run in browser)
      groups = await Promise.all(
        groups.map(async (group) => {
          const verifiedFilms = await tmdbVerifier.verifyFilms(
            group.films.map((f) => ({ title: f.title, year: f.year }))
          )
          const allVerified = verifiedFilms.every((f) => f.verified)
          return { ...group, films: verifiedFilms, allFilmsVerified: allVerified }
        })
      )

      setGeneratedGroups(groups)

      if (groups.length === 0) {
        showInfo('No groups generated')
      } else {
        const verifiedCount = groups.filter((g) => g.allFilmsVerified).length
        showSuccess(`Generated ${groups.length} groups! (${verifiedCount} fully verified)`)
      }
    } catch (err) {
      showError('Generation failed', err instanceof Error ? err.message : 'Failed to generate groups')
    } finally {
      setIsGenerating(false)
    }
  }

  // Approve a group
  const handleApprove = async () => {
    if (!approveModalGroup) return

    try {
      // Record positive feedback for learning
      await feedbackStore.recordFeedback(approveModalGroup, true)

      // Save to database - map to legacy format
      saveMutation.mutate([
        {
          films: approveModalGroup.films.map((f) => ({
            id: f.tmdbId || 0,
            title: f.title,
            year: f.year,
          })),
          connection: approveModalGroup.connection,
          connectionType: approveModalGroup.connectionType,
          difficultyScore: DIFFICULTY_OPTIONS.findIndex((d) => d.value === selectedDifficulty) + 1,
          color: DIFFICULTY_OPTIONS.find((d) => d.value === selectedDifficulty)?.color as 'yellow' | 'green' | 'blue' | 'purple',
          difficulty: difficultyToLevel[selectedDifficulty],
          status: 'approved' as const,
        },
      ])

      // Remove from list
      setGeneratedGroups((prev) => prev.filter((g) => g.id !== approveModalGroup.id))
      setApproveModalGroup(null)
      showSuccess('Group approved!')
    } catch (err) {
      showError('Failed to approve', err instanceof Error ? err.message : 'Failed to approve group')
    }
  }

  // Reject a group
  const handleReject = async () => {
    if (!rejectModalGroup) return

    try {
      // Record negative feedback for learning
      await feedbackStore.recordFeedback(rejectModalGroup, false, rejectReason || undefined)
      setGeneratedGroups((prev) => prev.filter((g) => g.id !== rejectModalGroup.id))
      setRejectModalGroup(null)
      setRejectReason('')
      showSuccess('Group rejected')
    } catch (err) {
      showError('Failed to reject', err instanceof Error ? err.message : 'Failed to reject group')
    }
  }

  // Toggle connection type filter
  const toggleTypeFilter = (typeId: string) => {
    setSelectedTypeIds((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    )
  }

  // Group connection types by category
  const typesByCategory = connectionTypes.reduce(
    (acc, type) => {
      if (!acc[type.category]) {
        acc[type.category] = []
      }
      acc[type.category].push(type)
      return acc
    },
    {} as Record<string, ConnectionType[]>
  )

  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Heading level={1} size="2xl">
          Generate Groups
        </Heading>
        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" /> Generating...
            </>
          ) : (
            'Generate 20 Groups'
          )}
        </Button>
      </Box>

      {/* Filters */}
      <Card>
        <Box display="flex" flexDirection="column" gap="md" padding="4">
          <Heading level={3} size="lg">
            Filters
          </Heading>

          {/* Year Range */}
          <Box display="flex" gap="md" alignItems="center">
            <Text>Year Range:</Text>
            <input
              type="number"
              className="new-generator-input"
              value={yearStart}
              onChange={(e) => setYearStart(parseInt(e.target.value) || 1900)}
              min={1900}
              max={yearEnd}
            />
            <Text>to</Text>
            <input
              type="number"
              className="new-generator-input"
              value={yearEnd}
              onChange={(e) => setYearEnd(parseInt(e.target.value) || 2024)}
              min={yearStart}
              max={new Date().getFullYear()}
            />
          </Box>

          {/* Connection Types Filter */}
          <Box display="flex" flexDirection="column" gap="sm">
            <Text>Connection Types (optional - leave empty for all):</Text>
            {loadingTypes ? (
              <Text color="muted">Loading connection types...</Text>
            ) : (
              <Box display="flex" flexDirection="column" gap="sm">
                {Object.entries(typesByCategory).map(([category, types]) => (
                  <Box key={category} display="flex" flexDirection="column" gap="xs">
                    <Text size="sm" color="muted">
                      {category}:
                    </Text>
                    <Box display="flex" gap="xs" className="flex-wrap">
                      {types.map((type) => (
                        <Button
                          key={type.id}
                          variant={selectedTypeIds.includes(type.id) ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => toggleTypeFilter(type.id)}
                        >
                          {type.name}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Card>

      {/* Generated Groups */}
      {generatedGroups.length > 0 && (
        <Box display="flex" flexDirection="column" gap="md">
          <Heading level={2} size="xl">
            Generated Groups ({generatedGroups.length})
          </Heading>

          {generatedGroups.map((group) => (
            <Card key={group.id}>
              <Box display="flex" flexDirection="column" gap="md" padding="4">
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" flexDirection="column" gap="sm" flex="1">
                    <Box display="flex" alignItems="center" gap="sm">
                      <Text size="lg">{group.connection}</Text>
                      <Badge color="blue">{group.connectionType}</Badge>
                      {!group.allFilmsVerified && (
                        <Badge color="orange">Unverified Films</Badge>
                      )}
                    </Box>
                    <Text color="muted" size="sm">
                      {group.explanation}
                    </Text>
                  </Box>
                </Box>

                {/* Films */}
                <Box display="flex" gap="sm" className="flex-wrap">
                  {group.films.map((film, idx) => (
                    <Box
                      key={idx}
                      className={`film-chip ${film.verified ? 'verified' : 'unverified'}`}
                    >
                      <Text size="sm">
                        {film.title} ({film.year})
                        {film.verified && film.tmdbId && (
                          <span className="tmdb-badge">TMDB</span>
                        )}
                      </Text>
                    </Box>
                  ))}
                </Box>

                {/* Actions */}
                <Box display="flex" gap="sm" justifyContent="flex-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRejectModalGroup(group)}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setApproveModalGroup(group)
                      setSelectedDifficulty('medium')
                    }}
                    disabled={!group.allFilmsVerified}
                  >
                    Approve
                  </Button>
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={approveModalGroup !== null}
        onClose={() => setApproveModalGroup(null)}
        title="Approve Group"
        size="md"
      >
        <ModalBody>
          <Box display="flex" flexDirection="column" gap="md">
            <Text size="md">
              Approve &quot;{approveModalGroup?.connection}&quot;?
            </Text>
            <Box display="flex" flexDirection="column" gap="sm">
              <Text>Select difficulty:</Text>
              <Box display="flex" gap="sm">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={selectedDifficulty === opt.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDifficulty(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box display="flex" gap="sm" justifyContent="flex-end">
            <Button variant="outline" onClick={() => setApproveModalGroup(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApprove}>
              Approve
            </Button>
          </Box>
        </ModalFooter>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalGroup !== null}
        onClose={() => setRejectModalGroup(null)}
        title="Reject Group"
        size="md"
      >
        <ModalBody>
          <Box display="flex" flexDirection="column" gap="md">
            <Text size="md">
              Reject &quot;{rejectModalGroup?.connection}&quot;?
            </Text>
            <Box display="flex" flexDirection="column" gap="sm">
              <Text>Reason (optional, helps improve future generation):</Text>
              <textarea
                className="new-generator-textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Connection is too obvious, films don't fit well..."
                rows={3}
              />
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box display="flex" gap="sm" justifyContent="flex-end">
            <Button variant="outline" onClick={() => setRejectModalGroup(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
          </Box>
        </ModalFooter>
      </Modal>
    </Box>
  )
}
