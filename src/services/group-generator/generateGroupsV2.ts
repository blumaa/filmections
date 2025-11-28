/**
 * Generate Groups V2 - Server-side Claude integration
 *
 * Shared logic for generating film connection groups using Claude.
 * Used by both Vite dev server and Vercel API route.
 */

import Anthropic from '@anthropic-ai/sdk'
import type {
  GenerationFilters,
  ConnectionType,
  FeedbackRecord,
  GeneratedGroup,
  VerifiedFilm,
} from './types'

interface AIFilmResponse {
  title: string
  year: number
}

interface AIGroupResponse {
  films: AIFilmResponse[]
  connection: string
  connectionType: string
  explanation: string
}

interface AIResponse {
  groups: AIGroupResponse[]
}

export interface GenerateGroupsV2Result {
  groups: GeneratedGroup[]
  tokensUsed: {
    input: number | undefined
    output: number | undefined
  }
}

export async function generateGroupsV2(
  apiKey: string,
  filters: GenerationFilters,
  connectionTypes: ConnectionType[],
  count: number,
  goodExamples: FeedbackRecord[],
  badExamples: FeedbackRecord[]
): Promise<GenerateGroupsV2Result> {
  const prompt = buildPrompt(filters, connectionTypes, count, goodExamples, badExamples)

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in AI response')
  }

  const aiResponse = parseResponse(textContent.text)
  const groups = mapToGeneratedGroups(aiResponse)

  return {
    groups,
    tokensUsed: {
      input: response.usage?.input_tokens,
      output: response.usage?.output_tokens,
    },
  }
}

function buildPrompt(
  filters: GenerationFilters,
  connectionTypes: ConnectionType[],
  count: number,
  goodExamples: FeedbackRecord[],
  badExamples: FeedbackRecord[]
): string {
  const parts: string[] = []

  // System context
  parts.push(`You are a film expert creating groups of 4 films for a puzzle game similar to NYT Connections.
Each group should have exactly 4 films that share a clever, interesting connection.

IMPORTANT REQUIREMENTS:
- Each group must have exactly 4 films
- All films must be real, well-known films
- Connections should be creative, surprising, and satisfying to discover
- Avoid obvious or boring connections
- Each film should clearly fit the connection
- Provide the release year for each film`)

  // Connection types
  if (connectionTypes.length > 0) {
    parts.push('\n\nAVAILABLE CONNECTION TYPES:')
    connectionTypes.forEach((ct) => {
      let typeDescription = `- ${ct.name} (${ct.category}): ${ct.description}`
      if (ct.examples && ct.examples.length > 0) {
        typeDescription += ` Examples: ${ct.examples.join(', ')}`
      }
      parts.push(typeDescription)
    })
  }

  // Filters
  if (filters.yearRange) {
    parts.push(
      `\n\nYEAR RANGE: Only use films released between ${filters.yearRange[0]} and ${filters.yearRange[1]}.`
    )
  }

  if (filters.excludeConnections && filters.excludeConnections.length > 0) {
    parts.push('\n\nEXCLUDE THESE CONNECTIONS (already used):')
    filters.excludeConnections.forEach((c) => parts.push(`- ${c}`))
  }

  // Good examples
  if (goodExamples && goodExamples.length > 0) {
    parts.push('\n\nGOOD EXAMPLES (generate similar quality):')
    goodExamples.forEach((ex) => {
      const films = ex.films.map((f) => `${f.title} (${f.year})`).join(', ')
      parts.push(`- Connection: "${ex.connection}"`)
      parts.push(`  Films: ${films}`)
    })
  }

  // Bad examples
  if (badExamples && badExamples.length > 0) {
    parts.push('\n\nBAD EXAMPLES (avoid these patterns):')
    badExamples.forEach((ex) => {
      const films = ex.films.map((f) => `${f.title} (${f.year})`).join(', ')
      parts.push(`- Connection: "${ex.connection}"`)
      parts.push(`  Films: ${films}`)
      if (ex.rejectionReason) {
        parts.push(`  Why bad: ${ex.rejectionReason}`)
      }
    })
  }

  // Request format
  parts.push(`\n\nGenerate ${count} film groups with diverse connection types.

Respond with valid JSON only, no other text:
{
  "groups": [
    {
      "films": [
        {"title": "Film Title", "year": 2020},
        {"title": "Film Title 2", "year": 2019},
        {"title": "Film Title 3", "year": 2018},
        {"title": "Film Title 4", "year": 2017}
      ],
      "connection": "The connection description",
      "connectionType": "category-name",
      "explanation": "Why these films fit the connection"
    }
  ]
}`)

  return parts.join('\n')
}

function parseResponse(text: string): AIResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response')
  }
  return JSON.parse(jsonMatch[0])
}

function mapToGeneratedGroups(response: AIResponse): GeneratedGroup[] {
  return response.groups.map((group) => ({
    id: globalThis.crypto.randomUUID(),
    films: group.films.map(
      (f): VerifiedFilm => ({
        title: f.title,
        year: f.year,
        tmdbId: null,
        verified: false,
      })
    ),
    connection: group.connection,
    connectionType: group.connectionType,
    explanation: group.explanation,
    allFilmsVerified: false,
  }))
}
