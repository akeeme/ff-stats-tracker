// Run: node --test src/lib/hashtags.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashtags, profileHashtags, RULES, MAX_TAGS } from './hashtags.ts'

test('tag names are unique and hashtag-safe', () => {
  assert.equal(new Set(RULES.map(r => r.tag)).size, RULES.length)
  for (const r of RULES) assert.match(r.tag, /^[a-z0-9]+$/)
})
test('10 pass TD, 0 INT on 31 att: big QB line, by priority', () => {
  assert.deepEqual(hashtags({ passing_tds: 10, passes_completed: 23, passes_attempted: 31 }), ['10burger', 'flawless', 'slinginit'])
})
test('caps at 5 and keeps the highest priorities', () => {
  const t = hashtags({ interceptions: 2, def_td: 1, safeties: 1, receiving_tds: 3, rushing_tds: 1, flag_pulls: 6, receptions: 5 })
  assert.equal(t.length, MAX_TAGS)
  assert.deepEqual(t, ['pickparty', 'housecall', 'safetydance', 'moneyhands', 'redzonechef'])
})
test('no stats, all zeros, or 9 att: no tags', () => {
  assert.deepEqual(hashtags(undefined), [])
  assert.deepEqual(hashtags({}), [])
  assert.deepEqual(hashtags({ passes_attempted: 9, passes_completed: 9 }), [])
})
test('handsteam needs 4+ catches and zero drops; flag pull bands do not overlap', () => {
  assert.ok(hashtags({ receptions: 4 }).includes('handsteam'))
  assert.ok(!hashtags({ receptions: 4, drops: 1 }).includes('handsteam'))
  assert.deepEqual(hashtags({ flag_pulls: 3 }), ['flagsnatcher'])
  assert.deepEqual(hashtags({ flag_pulls: 5 }), ['pulledpork'])
})
test('profile tags count games, most frequent first', () => {
  assert.deepEqual(profileHashtags([{ flag_pulls: 3 }, { flag_pulls: 4 }, { interceptions: 2 }, {}]),
    [{ tag: 'flagsnatcher', n: 2 }, { tag: 'pickparty', n: 1 }])
})
