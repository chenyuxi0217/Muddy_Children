const graphLetters = ['A', 'B', 'C', 'D', 'E'];

function graphBitCount(value) {
  let count = 0;
  for (let bitsLeft = value; bitsLeft; bitsLeft &= bitsLeft - 1) count++;
  return count;
}

function graphEscape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function graphNumber(value) { return Number(value.toFixed(3)); }

/**
 * Keep the actual world and its one-bit alternatives in an inner ring.
 * More distant worlds stay on an outer ellipse, outside all knowledge ovals.
 * The positions do not move as public observations remove worlds.
 */
export function getGraphLayout(n, actualMask) {
  const width = 680, height = 430;
  const center = { x: width / 2, y: height / 2 };
  const radius = n >= 5 ? 14 : n === 4 ? 18 : 22;
  const neighborRadius = n >= 5 ? 96 : n === 4 ? 104 : 112;
  const points = new Map([[actualMask, center]]);
  for (let child = 0; child < n; child++) {
    const angle = -Math.PI / 2 + 2 * Math.PI * child / n;
    points.set(actualMask ^ (1 << child), {
      x: center.x + neighborRadius * Math.cos(angle),
      y: center.y + neighborRadius * Math.sin(angle),
    });
  }
  const outerWorlds = Array.from({ length: 2 ** n }, (_, world) => world)
    .filter(world => !points.has(world))
    .sort((a, b) => graphBitCount(a ^ actualMask) - graphBitCount(b ^ actualMask) || (a ^ actualMask) - (b ^ actualMask));
  outerWorlds.forEach((world, index) => {
    const angle = -Math.PI / 2 + 2 * Math.PI * index / outerWorlds.length;
    points.set(world, {
      x: center.x + 278 * Math.cos(angle),
      y: center.y + 170 * Math.sin(angle),
    });
  });
  return { width, height, radius, neighborRadius, points };
}

/** The exact real-world accessibility class for every child, as an oval. */
export function getPossibilityRegions(n, actualMask, snapshot, layout = getGraphLayout(n, actualMask)) {
  const actual = layout.points.get(actualMask);
  return snapshot.knowledge.map((knowledge, child) => {
    const worlds = [...knowledge.possible];
    const otherWorld = worlds.find(world => world !== actualMask);
    const angle = -Math.PI / 2 + 2 * Math.PI * child / n;
    if (otherWorld === undefined) {
      const radius = layout.radius + 9 + 4 * child;
      return {
        child, worlds, cx: actual.x, cy: actual.y, rx: radius, ry: radius, angle: 0,
        labelX: actual.x + (radius + 10) * Math.cos(angle),
        labelY: actual.y + (radius + 10) * Math.sin(angle),
      };
    }
    const other = layout.points.get(otherWorld);
    const dx = other.x - actual.x, dy = other.y - actual.y;
    const distance = Math.hypot(dx, dy);
    const padding = layout.radius + 8;
    // Foci at the two node centers; this encloses each entire node circle.
    const rx = distance / 2 + padding;
    const ry = Math.sqrt(distance * padding + padding * padding);
    const radians = Math.atan2(dy, dx);
    const cx = (actual.x + other.x) / 2, cy = (actual.y + other.y) / 2;
    return {
      child, worlds, cx, cy, rx, ry, angle: radians * 180 / Math.PI,
      labelX: cx - Math.sin(radians) * ry * .62,
      labelY: cy + Math.cos(radians) * ry * .62,
    };
  });
}

/** Render the full public model, with each child's possibility oval visible. */
export function drawGraph({ n, actualMask, snapshot, showRemoved, selected, colors, labels }) {
  const layout = getGraphLayout(n, actualMask);
  const active = new Set(snapshot.worlds);
  const regions = getPossibilityRegions(n, actualMask, snapshot, layout);
  const regionsMarkup = regions.map(region => {
    const color = colors[region.child];
    const singleton = region.worlds.length === 1;
    const accessibleLabel = graphEscape(labels.possibility(region.child, region.worlds));
    return `<g class="possibility-region ${singleton ? 'singleton' : 'paired'}" data-child="${region.child}" data-worlds="${region.worlds.join(',')}" role="img" aria-label="${accessibleLabel}"><title>${accessibleLabel}</title><ellipse class="possibility-ellipse" cx="${graphNumber(region.cx)}" cy="${graphNumber(region.cy)}" rx="${graphNumber(region.rx)}" ry="${graphNumber(region.ry)}" transform="rotate(${graphNumber(region.angle)} ${graphNumber(region.cx)} ${graphNumber(region.cy)})" fill="${color}" fill-opacity="${singleton ? '.045' : '.115'}" stroke="${color}" stroke-opacity=".65" stroke-width="1.1"/><text class="possibility-label" x="${graphNumber(region.labelX)}" y="${graphNumber(region.labelY)}" dy="4" text-anchor="middle" fill="${color}">${graphLetters[region.child]}</text></g>`;
  }).join('');

  let edges = '';
  for (let world = 0; world < 2 ** n; world++) {
    for (let child = 0; child < n; child++) {
      const neighbor = world ^ (1 << child);
      if (neighbor < world) continue;
      const retained = active.has(world) && active.has(neighbor);
      if (!retained && !showRemoved) continue;
      const p = layout.points.get(world), q = layout.points.get(neighbor);
      const emphasis = world === actualMask || neighbor === actualMask;
      edges += `<line x1="${graphNumber(p.x)}" y1="${graphNumber(p.y)}" x2="${graphNumber(q.x)}" y2="${graphNumber(q.y)}" stroke="${colors[child]}" class="edge ${retained ? '' : 'ghost'}" ${retained ? `style="opacity:${emphasis ? '.58' : '.27'}"` : ''}><title>${graphLetters[child]}: ${graphEscape(labels.code(world))} ↔ ${graphEscape(labels.code(neighbor))}</title></line>`;
    }
  }

  let nodes = '';
  for (let world = 0; world < 2 ** n; world++) {
    const retained = active.has(world);
    if (!retained && !showRemoved) continue;
    const p = layout.points.get(world);
    const actual = world === actualMask;
    const classes = ['node', retained ? '' : 'ghost', actual ? 'actual' : '', selected === world ? 'selected' : ''].join(' ');
    const description = `${labels.code(world)}: ${labels.worldDescription(world)}. ${retained ? labels.text('retained') : labels.text('excluded')}${actual ? `. ${labels.text('actualLegend')}` : ''}`;
    const accessibleLabel = graphEscape(description);
    const r = layout.radius;
    nodes += `<g transform="translate(${graphNumber(p.x)},${graphNumber(p.y)})" class="${classes}" data-world="${world}" id="world-${world}" role="button" tabindex="0" aria-label="${accessibleLabel}" aria-pressed="${selected === world}"><title>${accessibleLabel}</title>${actual ? `<circle class="actual-ring" r="${r + 5}"/>` : ''}${selected === world ? `<circle class="select-ring" r="${r + 8}"/>` : ''}<circle class="circle-main" r="${r}"/><text dy="4" text-anchor="middle" ${n >= 4 ? `style="font-size:${n === 5 ? 7.5 : 9}px;letter-spacing:0"` : ''}>${graphEscape(labels.code(world))}</text></g>`;
  }
  return `<svg class="graph-svg" viewBox="0 0 ${layout.width} ${layout.height}" aria-label="${graphEscape(labels.text('model'))}, ${snapshot.worlds.length} ${graphEscape(labels.text('worlds'))}">${regionsMarkup}${edges}${nodes}</svg>`;
}
