/**
 * AI Group Generation Prompt
 *
 * Single source of truth for the Claude prompt used to generate movie connections.
 * Used by both the frontend (development) and Vercel API route (production).
 *
 * Key principle: AI suggests connections with verification params,
 * code verifies claims against actual data.
 */

import type { VerificationType, VerificationParams } from './VerificationEngine';
import type { ConnectionCategory } from './ConnectionTypeRegistry';

export interface MovieForAI {
  id: number;
  title: string;
  year: number;
  overview: string;
  director: string | null;
  cast: string[];
}

/**
 * AI response format requiring verification params
 */
export interface AIGroupSuggestion {
  connection: string;
  filmIndices: number[];
  difficulty: 'easy' | 'medium' | 'hard' | 'hardest';
  explanation: string;
  verificationType: VerificationType;
  verificationParams: VerificationParams;
  category: ConnectionCategory;
}

export function buildGroupGenerationPrompt(movies: MovieForAI[], groupCount: number): string {
  const movieList = movies
    .map(
      (m, i) =>
        `[${i}] "${m.title}" (${m.year})${m.director ? ` - Dir: ${m.director}` : ''}${m.cast.length > 0 ? ` - Cast: ${m.cast.slice(0, 3).join(', ')}` : ''}\n    ${m.overview.slice(0, 150)}...`
    )
    .join('\n');

  return `You are a movie expert creating groups for a puzzle game like NYT Connections.

CRITICAL: Your response must be ONLY valid JSON. No text before or after. No explanations. Just the JSON object.

Analyze these ${movies.length} movies and find ${groupCount} groups of exactly 4 movies each that share a meaningful connection.

MOVIES:
${movieList}

═══════════════════════════════════════════════════════════════════════════════
ABSOLUTE RULES - YOUR RESPONSE WILL BE REJECTED IF YOU VIOLATE THESE:
═══════════════════════════════════════════════════════════════════════════════

1. NEVER GROUP FRANCHISE FILMS TOGETHER
   ❌ WRONG: "Harry Potter franchise films"
   ❌ WRONG: "Pirates of the Caribbean films"
   ❌ WRONG: "Films in the Marvel Cinematic Universe"
   ❌ WRONG: "Films featuring [franchise character]"
   ✓ OK: Franchise films CAN appear together IF the connection is unrelated to the franchise

2. NEVER USE TRIVIAL TITLE PATTERNS
   ❌ WRONG: "Films with 'The' in the title"
   ❌ WRONG: "Films with 'A' as the first word"
   ❌ WRONG: "Films with one-word titles"
   ✓ OK: "Titles that are also verbs" (Go, Run, Taken, Saw)

3. NEVER MAKE FALSE CLAIMS
   ❌ WRONG: Claiming an actor stars in a film when they're NOT in the cast list provided
   ❌ WRONG: Claiming a film has a phrase in its title when it doesn't
   ❌ WRONG: Inventing plot details not mentioned in the overview

4. VERIFY EVERY CONNECTION
   Before including a film, ASK YOURSELF:
   - Is this actor ACTUALLY listed in the cast? (Check the data!)
   - Does this title ACTUALLY contain this word/phrase? (Check the data!)
   - Is this plot element ACTUALLY mentioned in the overview? (Check the data!)

═══════════════════════════════════════════════════════════════════════════════
DIVERSITY REQUIREMENT - YOU MUST USE DIFFERENT CATEGORIES:
═══════════════════════════════════════════════════════════════════════════════

Your ${groupCount} groups MUST include connections from DIFFERENT categories.
Do NOT make all groups the same type (e.g., all "title" connections).

CATEGORIES (use a mix of these):

1. THEMATIC (category: "thematic") - Themes and character arcs
   Examples: "Films about revenge", "Redemption stories", "Survival against odds"
   Verify with: overview-keywords

2. TITLE (category: "title") - Wordplay and patterns in titles
   Examples: "Colors in title", "Animals in title", "Body parts in title"
   Verify with: title-contains or title-pattern
   ❌ AVOID: "Films with 'The'", "One-word titles" (too trivial)

3. SETTING (category: "setting") - Location and time
   Examples: "Set in New York", "Takes place in one day", "Christmas setting"
   Verify with: overview-keywords

4. PLOT (category: "plot") - Specific plot elements
   Examples: "Heist films", "Prison escape", "Wedding goes wrong"
   Verify with: overview-keywords

5. CREW (category: "crew") - Director connections
   Examples: "Directed by Christopher Nolan"
   Verify with: director (use personId from data)

6. CAST (category: "cast") - Actor connections
   Examples: "Starring Tom Hanks"
   Verify with: actor (use personId from data)

═══════════════════════════════════════════════════════════════════════════════
DIFFICULTY GUIDELINES:
═══════════════════════════════════════════════════════════════════════════════
- easy: Clear factual connections like "Directed by Christopher Nolan"
- medium: Requires film knowledge like "Features a heist" or "Set in New York"
- hard: Thematic connections like "Unreliable narrators"
- hardest: Clever wordplay or obscure connections

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT - VERIFICATION REQUIRED:
═══════════════════════════════════════════════════════════════════════════════

CRITICAL: For EVERY suggestion, you MUST provide verification params.
The system will VERIFY your claims against the actual data.
If verification fails, your suggestion is REJECTED.

Return ONLY valid JSON (no markdown code fences, no explanation outside JSON):
{
  "groups": [
    {
      "connection": "Clear, concise connection description",
      "filmIndices": [0, 5, 12, 23],
      "difficulty": "easy",
      "explanation": "Brief explanation of why these films connect",
      "category": "thematic",
      "verificationType": "overview-keywords",
      "verificationParams": { "keywords": ["specific", "words", "from", "overviews"] }
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════════
VERIFICATION TYPES YOU CAN USE:
═══════════════════════════════════════════════════════════════════════════════

1. "overview-keywords" - Check if SPECIFIC words appear in film overviews
   verificationParams: { "keywords": ["word1", "word2"], "requireAll": false }
   → System checks if keywords appear in each film's overview
   → Set "requireAll": true for stricter matching (ALL keywords must appear)

   ⚠️ IMPORTANT: Keywords must be EXACT words from the overview text!
   ❌ WRONG: Claim "shark attacks" but use keywords ["ocean", "water"]
   ✓ CORRECT: Claim "shark attacks" and use keywords ["shark"]

   If the specific word (e.g., "shark") doesn't appear in the overview,
   that film does NOT qualify for that connection!

2. "title-contains" - Check if substring appears in title
   verificationParams: { "substring": "word" }
   → System checks if substring is in each film's title
   → Use for: "Films with 'Night' in title", "Colors in titles"

3. "title-pattern" - Check if title matches a regex pattern
   verificationParams: { "pattern": "^\\\\w+$" }
   → System checks regex match against each title
   → Use for: "One-word titles", "Titles ending in a number"

4. "genre-includes" - Check if film has specific genre
   verificationParams: { "genreId": 28 }
   → Genre IDs: 28=Action, 35=Comedy, 80=Crime, 18=Drama, 27=Horror,
     10749=Romance, 878=Sci-Fi, 53=Thriller, 10752=War, 37=Western

5. "director" - Check if film has specific director (by ID from data)
   verificationParams: { "personId": 525 }
   → Only use if you can see the director ID in the movie data

6. "actor" - Check if film has specific actor (by ID from data)
   verificationParams: { "personId": 6193 }
   → Only use if you can see the actor ID in the movie data

═══════════════════════════════════════════════════════════════════════════════
CRITICAL - VERIFICATION WILL REJECT FALSE CLAIMS:
═══════════════════════════════════════════════════════════════════════════════

1. Keywords must be EXACT words that appear in EVERY film's overview
   - If you claim "shark attacks", the word "shark" must appear in ALL 4 overviews
   - Generic words like "ocean" or "water" don't count for specific claims

2. Read the overviews carefully before making thematic claims
   - Search for the actual word in each film's overview
   - If it's not there, DON'T include that film

3. Title connections are safer and easier to verify
   - "Films with 'Red' in title" is easily verifiable
   - Mix title connections with genuine thematic ones

4. Don't force connections that don't exist
   - It's better to return fewer groups than false ones
   - The system will reject anything that fails verification`;
}
