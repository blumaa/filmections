/**
 * Vercel API Route: Generate Groups with Claude AI
 *
 * Receives movie data from the frontend and calls Claude API
 * to generate connection groups.
 *
 * Security: API key is stored in Vercel environment variables
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateGroupsWithClaude } from '../src/services/claudeApi';
import type { MovieForAI } from '../src/services/aiGroupPrompt';

interface RequestBody {
  movies: MovieForAI[];
  groupCount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { movies, groupCount } = req.body as RequestBody;

    if (!movies || !Array.isArray(movies) || movies.length < 20) {
      return res.status(400).json({ error: 'At least 20 movies required' });
    }

    if (!groupCount || groupCount < 1 || groupCount > 25) {
      return res.status(400).json({ error: 'Group count must be between 1 and 25' });
    }

    const result = await generateGroupsWithClaude(movies, groupCount, apiKey);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error generating groups:', error);
    return res.status(500).json({ error: 'Failed to generate groups' });
  }
}
