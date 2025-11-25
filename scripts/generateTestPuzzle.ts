/**
 * Generate Test Puzzle Script
 *
 * Generates a test puzzle and saves it to Supabase for today's date.
 * Run with: bun run scripts/generateTestPuzzle.ts
 */

/* eslint-disable no-undef */

import { generateTestPuzzle } from '../src/services/puzzleGenerator';
import { supabase } from '../src/lib/supabase/client';
import { SupabaseStorage } from '../src/lib/supabase/storage';
import { getTodayDate } from '../src/utils/date';
import type { SavedPuzzle } from '../src/lib/puzzle-engine/types';

async function main() {
  console.log('🎬 Generating test puzzle...\n');

  // Generate puzzle using existing test puzzle generator
  const puzzle = await generateTestPuzzle();

  console.log('✅ Puzzle generated:');
  console.log(`   - ${puzzle.films.length} films`);
  console.log(`   - ${puzzle.groups.length} groups`);
  puzzle.groups.forEach((group, i) => {
    console.log(`     ${i + 1}. ${group.connection} (${group.difficulty})`);
  });

  // Create SavedPuzzle with metadata
  const today = getTodayDate();
  const savedPuzzle: SavedPuzzle = {
    id: crypto.randomUUID(), // Generate a proper UUID
    films: puzzle.films,
    groups: puzzle.groups,
    createdAt: Date.now(),
    metadata: {
      puzzleDate: today,
      status: 'published',
      qualityScore: 75,
    },
  };

  console.log(`\n💾 Saving to Supabase for ${today}...\n`);

  // Save to Supabase
  const storage = new SupabaseStorage(supabase);
  try {
    const stored = await storage.savePuzzle(savedPuzzle);

    console.log('✅ Puzzle saved successfully!');
    console.log(`   - ID: ${stored.id}`);
    console.log(`   - Date: ${stored.puzzleDate}`);
    console.log(`   - Status: ${stored.status}`);
    console.log(`   - Quality Score: ${stored.qualityScore}`);
    console.log(`   - Connection Types: ${stored.connectionTypes.join(', ')}`);

    console.log('\n🎉 Test puzzle is ready! Open the app to play.\n');
  } catch (error) {
    console.error('\n❌ Failed to save puzzle:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
