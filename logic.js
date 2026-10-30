/** Count the set bits of a nonnegative integer mask. */
export function popcount(mask) {
  let count = 0;
  let value = mask >>> 0;
  while (value) {
    value &= value - 1;
    count += 1;
  }
  return count;
}

/** Bit i corresponds to child i; true means that child's forehead is muddy. */
export function bits(mask, n) {
  return Array.from({ length: n }, (_, i) => Boolean(mask & (1 << i)));
}

function knowledgeAt(worlds, actualMask, n) {
  return Array.from({ length: n }, (_, child) => {
    const bit = 1 << child;
    // Every child sees all other foreheads and cannot see their own forehead.
    const possible = worlds.filter(world => (world & ~bit) === (actualMask & ~bit));
    return {
      muddy: possible.every(world => Boolean(world & bit)),
      clean: possible.every(world => !Boolean(world & bit)),
      possible,
    };
  });
}

function responseAt(worldsSet, world, n) {
  const responders = [];
  for (let child = 0; child < n; child += 1) {
    const bit = 1 << child;
    // The actual world is always accessible. The only distinct accessible
    // world flips this child's own bit. Missing that alternative proves mud.
    if ((world & bit) && !worldsSet.has(world ^ bit)) responders.push(child);
  }
  return responders;
}

function equalResponse(a, b) {
  return a.length === b.length && a.every((child, i) => child === b[i]);
}

/**
 * Return the complete synchronous public-observation history.
 *
 * Each snapshot's `knowledge` describes knowledge AFTER that update. In a
 * round snapshot, `responders` were computed BEFORE that update, from
 * `previousWorlds`. Everyone publicly observes the exact response vector,
 * including both standing and remaining seated. The father's request alone
 * does not remove worlds: the publicly observed response does.
 *
 * `knowledge[i].muddy/clean` mean "knows muddy/knows clean", respectively.
 * Reflexive accessibility is implicit; distinct edges flip one child's bit.
 */
export function buildHistory(n, actualMask, announce = true) {
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new RangeError('The number of children must be an integer from 1 to 5.');
  }
  if (!Number.isInteger(actualMask) || actualMask < 0 || actualMask >= 2 ** n) {
    throw new RangeError('The actual world must be a valid mask for these children.');
  }
  if (announce && actualMask === 0) {
    throw new RangeError('“At least one child is muddy” must be true in the actual world.');
  }

  const history = [];
  let worlds = Array.from({ length: 2 ** n }, (_, world) => world);
  const snapshot = (phase, round, previousWorlds, responders = [], done = false, stagnant = false) => {
    const retained = new Set(worlds);
    history.push({
      id: history.length,
      phase,
      round,
      worlds: [...worlds],
      previousWorlds: [...previousWorlds],
      removed: previousWorlds.filter(world => !retained.has(world)),
      responders: [...responders],
      knowledge: knowledgeAt(worlds, actualMask, n),
      done,
      stagnant,
    });
  };

  snapshot('initial', 0, worlds);

  if (announce) {
    const previousWorlds = worlds;
    worlds = worlds.filter(world => world !== 0);
    snapshot('announcement', 0, previousWorlds);
  }

  // Without the initial announcement, the first silent round is already a
  // fixed point. With it, the muddy children respond by round n at the latest.
  for (let round = 1; round <= n; round += 1) {
    const previousWorlds = worlds;
    const previousSet = new Set(previousWorlds);
    const responders = responseAt(previousSet, actualMask, n);
    worlds = previousWorlds.filter(world => equalResponse(
      responseAt(previousSet, world, n),
      responders,
    ));
    // A positive public response can confirm an already-singleton model;
    // that is a successful outcome, not an uninformative silent fixed point.
    const stagnant = responders.length === 0 && worlds.length === previousWorlds.length;
    const done = responders.length > 0 || stagnant;
    snapshot('round', round, previousWorlds, responders, done, stagnant);
    if (done) break;
  }

  return history;
}
