-- Insert test puzzle for 2025-11-24
INSERT INTO puzzles (
  id,
  puzzle_date,
  films,
  groups,
  status,
  quality_score,
  connection_types,
  metadata
)
VALUES (
  '338f1c50-fae1-416c-b559-d2bf434986c1',
  '2025-11-24',
  '[{"id":4,"title":"Yellow Film 4","year":2023},{"id":12,"title":"Blue Film 4","year":2023},{"id":8,"title":"Green Film 4","year":2023},{"id":13,"title":"Purple Film 1","year":2020},{"id":2,"title":"Yellow Film 2","year":2021},{"id":5,"title":"Green Film 1","year":2020},{"id":9,"title":"Blue Film 1","year":2020},{"id":15,"title":"Purple Film 3","year":2022},{"id":14,"title":"Purple Film 2","year":2021},{"id":10,"title":"Blue Film 2","year":2021},{"id":7,"title":"Green Film 3","year":2022},{"id":3,"title":"Yellow Film 3","year":2022},{"id":6,"title":"Green Film 2","year":2021},{"id":1,"title":"Yellow Film 1","year":2020},{"id":11,"title":"Blue Film 3","year":2022},{"id":16,"title":"Purple Film 4","year":2023}]'::jsonb,
  '[{"id":"test-yellow","films":[{"id":1,"title":"Yellow Film 1","year":2020},{"id":2,"title":"Yellow Film 2","year":2021},{"id":3,"title":"Yellow Film 3","year":2022},{"id":4,"title":"Yellow Film 4","year":2023}],"connection":"Yellow Group (Easy)","difficulty":"easy","color":"yellow"},{"id":"test-green","films":[{"id":5,"title":"Green Film 1","year":2020},{"id":6,"title":"Green Film 2","year":2021},{"id":7,"title":"Green Film 3","year":2022},{"id":8,"title":"Green Film 4","year":2023}],"connection":"Green Group (Medium)","difficulty":"medium","color":"green"},{"id":"test-blue","films":[{"id":9,"title":"Blue Film 1","year":2020},{"id":10,"title":"Blue Film 2","year":2021},{"id":11,"title":"Blue Film 3","year":2022},{"id":12,"title":"Blue Film 4","year":2023}],"connection":"Blue Group (Hard)","difficulty":"hard","color":"blue"},{"id":"test-purple","films":[{"id":13,"title":"Purple Film 1","year":2020},{"id":14,"title":"Purple Film 2","year":2021},{"id":15,"title":"Purple Film 3","year":2022},{"id":16,"title":"Purple Film 4","year":2023}],"connection":"Purple Group (Hardest)","difficulty":"hardest","color":"purple"}]'::jsonb,
  'published',
  75,
  ARRAY['Yellow Group (Easy)', 'Green Group (Medium)', 'Blue Group (Hard)', 'Purple Group (Hardest)'],
  '{"generatedBy": "test-script"}'::jsonb
);
