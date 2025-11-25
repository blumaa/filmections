/**
 * Claude API Client
 *
 * Single source of truth for calling Claude API.
 * Used by both Vite dev server and Vercel API route.
 *
 * Key principle: AI suggests connections, code verifies claims.
 */

import { buildGroupGenerationPrompt, type MovieForAI, type AIGroupSuggestion } from './aiGroupPrompt';
import { VerificationEngine, type VerificationType, type VerificationParams } from './VerificationEngine';
import type { TMDBMovieDetails } from '../types';

export interface AIGroupResponse {
  connection: string;
  filmIndices: number[];
  difficulty: 'easy' | 'medium' | 'hard' | 'hardest';
  explanation: string;
  verificationType?: VerificationType;
  verificationParams?: VerificationParams;
  verified?: boolean;
  verificationIssues?: string[];
}

export interface GenerateGroupsResult {
  groups: AIGroupResponse[];
  filteredCount: number; // Number of groups removed by validation
  tokensUsed: {
    input: number;
    output: number;
  };
}

// Common franchise patterns to detect
const FRANCHISE_PATTERNS = [
  /harry potter/i,
  /pirates of the caribbean/i,
  /star wars/i,
  /lord of the rings/i,
  /fast (?:and |& )?furious/i,
  /marvel/i,
  /avengers/i,
  /spider-?man/i,
  /batman/i,
  /transformers/i,
  /mission impossible/i,
  /jurassic (?:park|world)/i,
  /toy story/i,
  /shrek/i,
  /predator/i,
  /alien(?:s)?$/i,
  /terminator/i,
  /indiana jones/i,
  /now you see me/i,
  /john wick/i,
  /matrix/i,
  /hunger games/i,
  /twilight/i,
  /divergent/i,
  /maze runner/i,
  /x-?men/i,
  /james bond|007/i,
  /bourne/i,
  /rocky|creed/i,
  /ocean'?s/i,
];

// Trivial connection patterns to reject
const TRIVIAL_PATTERNS = [
  /films? (?:with|that have|starting with|beginning with) ['"]?the['"]? (?:in|as)/i,
  /films? (?:with|that have) ['"]?a['"]? as the first/i,
  /films? with one[- ]word titles?/i,
  /films? from the \d{4}s/i,
  /\bfranchise films?\b/i,
  /\bsequel(?:s)?\b.*\bsame franchise\b/i,
];

// Patterns that claim something about titles - these need verification
const TITLE_CLAIM_PATTERNS = [
  { pattern: /titles? (?:that )?(?:are|sound like|phrased as) questions?/i, validator: isQuestionTitle },
];

/**
 * Check if a title is actually a question
 */
function isQuestionTitle(title: string): boolean {
  const trimmed = title.trim();
  // Must end with ? or start with question words and have interrogative structure
  if (trimmed.endsWith('?')) return true;

  // Check for question word at start with interrogative structure
  // "How X Did Y" is a question, "How X Y" (statement) is not
  const questionStarters = /^(who|what|where|when|why|how|is|are|was|were|do|does|did|can|could|would|should|will)\b/i;
  if (questionStarters.test(trimmed)) {
    // "How the Grinch Stole Christmas" starts with "How" but is not a question
    // It needs to have interrogative word order or end with ?
    // Simple heuristic: if it's a short phrase with question word, might be ok
    // But "How [noun] [verb]" pattern is typically a statement
    const howStatementPattern = /^how\s+(?:the\s+)?[\w]+\s+[\w]+/i;
    if (howStatementPattern.test(trimmed) && !trimmed.endsWith('?')) {
      return false;
    }
  }

  return false;
}

/**
 * Check if a group appears to be a franchise grouping
 */
function isFranchiseGroup(connection: string, movies: MovieForAI[], filmIndices: number[]): boolean {
  // Check connection text for franchise references
  const connLower = connection.toLowerCase();
  for (const pattern of FRANCHISE_PATTERNS) {
    if (pattern.test(connLower)) {
      return true;
    }
  }

  // Check if connection mentions "franchise" or "series"
  if (/\b(franchise|series|saga|trilogy|quadrilogy|cinematic universe)\b/i.test(connection)) {
    return true;
  }

  // Check if all selected films share a common franchise word in their titles
  const selectedTitles = filmIndices.map(i => movies[i]?.title?.toLowerCase() || '');

  for (const pattern of FRANCHISE_PATTERNS) {
    const matchCount = selectedTitles.filter(t => pattern.test(t)).length;
    if (matchCount >= 3) {
      return true; // 3+ films from same franchise = franchise grouping
    }
  }

  return false;
}

/**
 * Check if connection is a trivial pattern we want to reject
 */
function isTrivialConnection(connection: string): boolean {
  for (const pattern of TRIVIAL_PATTERNS) {
    if (pattern.test(connection)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a title-based claim is actually true for all films
 */
function validateTitleClaim(
  connection: string,
  movies: MovieForAI[],
  filmIndices: number[]
): { valid: boolean; reason?: string } {
  for (const { pattern, validator } of TITLE_CLAIM_PATTERNS) {
    if (pattern.test(connection)) {
      const titles = filmIndices.map(i => movies[i]?.title || '');
      const failingTitles = titles.filter(t => !validator(t));

      if (failingTitles.length > 0) {
        return {
          valid: false,
          reason: `Titles don't match claim: ${failingTitles.join(', ')}`,
        };
      }
    }
  }
  return { valid: true };
}

/**
 * Validate generated groups and filter out rule-violating ones
 */
function validateGroups(
  groups: AIGroupResponse[],
  movies: MovieForAI[]
): { valid: AIGroupResponse[]; filteredCount: number } {
  const valid: AIGroupResponse[] = [];
  let filteredCount = 0;

  for (const group of groups) {
    // Check for franchise grouping
    if (isFranchiseGroup(group.connection, movies, group.filmIndices)) {
      console.warn(`[Validation] Filtered franchise group: "${group.connection}"`);
      filteredCount++;
      continue;
    }

    // Check for trivial connection
    if (isTrivialConnection(group.connection)) {
      console.warn(`[Validation] Filtered trivial connection: "${group.connection}"`);
      filteredCount++;
      continue;
    }

    // Validate title-based claims (e.g., "titles that are questions")
    const titleValidation = validateTitleClaim(group.connection, movies, group.filmIndices);
    if (!titleValidation.valid) {
      console.warn(`[Validation] Filtered false title claim: "${group.connection}" - ${titleValidation.reason}`);
      filteredCount++;
      continue;
    }

    // Ensure exactly 4 films
    if (group.filmIndices.length !== 4) {
      console.warn(`[Validation] Filtered group with ${group.filmIndices.length} films: "${group.connection}"`);
      filteredCount++;
      continue;
    }

    // Ensure all indices are valid
    if (group.filmIndices.some(i => i < 0 || i >= movies.length)) {
      console.warn(`[Validation] Filtered group with invalid indices: "${group.connection}"`);
      filteredCount++;
      continue;
    }

    valid.push(group);
  }

  return { valid, filteredCount };
}

/**
 * Call Claude API to generate movie connection groups
 */
export async function generateGroupsWithClaude(
  movies: MovieForAI[],
  groupCount: number,
  apiKey: string,
  movieDetails?: TMDBMovieDetails[] // Optional: pass full details for verification
): Promise<GenerateGroupsResult> {
  const prompt = buildGroupGenerationPrompt(movies, groupCount);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ text: string }>;
    usage?: { input_tokens: number; output_tokens: number };
  };

  const content = data.content[0]?.text;
  if (!content) {
    throw new Error('No content in Claude response');
  }

  // Extract JSON from response (handle markdown fences and stray text)
  let jsonContent = content.trim();

  // Strip markdown code fences if present (```json ... ```)
  if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // If response doesn't start with {, try to find JSON object in the text
  if (!jsonContent.startsWith('{')) {
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    } else {
      throw new Error('No valid JSON found in AI response');
    }
  }

  let parsed: { groups: AIGroupSuggestion[] };
  try {
    parsed = JSON.parse(jsonContent) as { groups: AIGroupSuggestion[] };
  } catch (parseError) {
    console.error('Failed to parse JSON:', jsonContent.slice(0, 200));
    throw new Error(`Invalid JSON in AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }

  // Step 1: Basic validation (franchise, trivial patterns, indices)
  const { valid: basicValid, filteredCount: basicFiltered } = validateGroups(parsed.groups, movies);

  // Step 2: Verify AI claims if full movie details are provided
  let verifiedGroups: AIGroupResponse[];
  let verificationFiltered = 0;

  if (movieDetails && movieDetails.length > 0) {
    const verification = verifyAIGroups(basicValid, movieDetails);
    verifiedGroups = verification.groups;
    verificationFiltered = verification.filteredCount;
  } else {
    // No verification possible without full details
    verifiedGroups = basicValid.map(g => ({ ...g, verified: undefined }));
  }

  const totalFiltered = basicFiltered + verificationFiltered;

  if (totalFiltered > 0) {
    console.log(`[Validation] Filtered ${basicFiltered} rule-violating + ${verificationFiltered} unverified = ${totalFiltered} total, ${verifiedGroups.length} remaining`);
  }

  return {
    groups: verifiedGroups,
    filteredCount: totalFiltered,
    tokensUsed: {
      input: data.usage?.input_tokens || 0,
      output: data.usage?.output_tokens || 0,
    },
  };
}

/**
 * Verify AI-suggested groups against actual movie data
 */
function verifyAIGroups(
  groups: AIGroupResponse[],
  movieDetails: TMDBMovieDetails[]
): { groups: AIGroupResponse[]; filteredCount: number } {
  const engine = new VerificationEngine();
  const verified: AIGroupResponse[] = [];
  let filteredCount = 0;

  for (const group of groups) {
    // Get the films for this group
    const films = group.filmIndices
      .map(i => movieDetails[i])
      .filter((f): f is TMDBMovieDetails => f !== undefined);

    if (films.length !== 4) {
      console.warn(`[Verification] Skipping "${group.connection}": couldn't find all films`);
      filteredCount++;
      continue;
    }

    // If no verification params, accept but mark as unverified
    if (!group.verificationType || !group.verificationParams) {
      console.warn(`[Verification] No verification params for: "${group.connection}"`);
      verified.push({ ...group, verified: false, verificationIssues: ['No verification params provided'] });
      continue;
    }

    // Verify the claim
    const result = engine.verify(
      group.connection,
      group.verificationType,
      group.verificationParams,
      films
    );

    if (result.valid) {
      verified.push({ ...group, verified: true });
    } else {
      console.warn(`[Verification] REJECTED: "${group.connection}"`);
      console.warn(`  Issues: ${result.issues.join(', ')}`);
      filteredCount++;
    }
  }

  return { groups: verified, filteredCount };
}
