/**
 * Vercel API Route: Generate Groups with Claude AI (v2)
 *
 * AI-first group generation using connection types and feedback learning.
 * Security: API key is stored in Vercel environment variables
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import type {
  GenerationFilters,
  ConnectionType,
  FeedbackRecord,
  GeneratedGroup,
  AIGroupResponse,
  VerifiedFilm,
} from '../src/services/group-generator/types'

interface RequestBody {
  filters: GenerationFilters
  connectionTypes: ConnectionType[]
  goodExamples: FeedbackRecord[]
  badExamples: FeedbackRecord[]
  count: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured')
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const { filters, connectionTypes, goodExamples, badExamples, count } =
      req.body as RequestBody

    if (!connectionTypes || connectionTypes.length === 0) {
      return res.status(400).json({ error: 'At least one connection type required' })
    }

    if (!count || count < 1 || count > 30) {
      return res.status(400).json({ error: 'Count must be between 1 and 30' })
    }

    // Build prompt
    const prompt = buildPrompt(filters, connectionTypes, count, goodExamples, badExamples)

    // Call Claude
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 1,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in AI response')
    }

    // Parse response
    const aiResponse = parseResponse(textContent.text)
    const groups = mapToGeneratedGroups(aiResponse)

    return res.status(200).json({
      groups,
      tokensUsed: {
        input: response.usage?.input_tokens,
        output: response.usage?.output_tokens,
      },
    })
  } catch (error) {
    console.error('Error generating groups:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate groups',
    })
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

function parseResponse(text: string): AIGroupResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response')
  }
  return JSON.parse(jsonMatch[0])
}

function mapToGeneratedGroups(response: AIGroupResponse): GeneratedGroup[] {
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
