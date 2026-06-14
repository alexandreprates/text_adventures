globalThis.DungeonMapRenderer = (() => {
  const TILESET_COLUMNS = 8;
  const TILESET_ROWS = 4;
  const TILE_SIZE = 32;
  const ATTACK_ANIMATION_MS = 420;
  const TILESET_PATH = "/assets/tilesets/original-dungeon-tileset.png";
  const ENEMY_MANIFEST_PATH = "/assets/enemies/enemies.json";

  const TILE_INDEXES = {
    floor: [0, 0],
    crackedFloor: [1, 0],
    wall: [2, 0],
    wallTop: [3, 0],
    wallLeft: [4, 0],
    wallRight: [5, 0],
    wallCorner: [6, 0],
    fog: [7, 0],
    player: [0, 1],
    goblin: [1, 1],
    skeleton: [2, 1],
    slime: [3, 1],
    lootBag: [4, 1],
    treasure: [5, 1],
    closedChest: [6, 1],
    openChest: [7, 1],
    door: [0, 2],
    ironDoor: [1, 2],
    stairsUp: [2, 2],
    stairsDown: [3, 2],
    unlitTorch: [4, 2],
    litTorch: [5, 2],
    spikeTrap: [6, 2],
    pitTrap: [7, 2],
    potion: [0, 3],
    tome: [1, 3],
    sword: [2, 3],
    spear: [3, 3],
    dagger: [4, 3],
    shield: [5, 3],
    altar: [6, 3],
    portal: [7, 3]
  };

  const SYMBOL_TILES = {
    "#": "wall",
    ".": "floor",
    " ": "floor",
    "?": "fog",
    "x": "player",
    "E": "floor",
    "@": "lootBag",
    "P": "portal",
    ">": "stairsDown"
  };

  const FALLBACK_COLORS = {
    "#": "#343a40",
    ".": "#1d2428",
    " ": "#1d2428",
    "?": "#08090b",
    "x": "#d9b45f",
    "E": "#d66f62",
    "@": "#7fb7a7",
    "P": "#8f7bff",
    ">": "#ffb300"
  };
  const FOG_DOTS = [
    [3, 4, 10, 0.28],
    [15, 2, 12, 0.2],
    [25, 9, 9, 0.16],
    [7, 20, 13, 0.22],
    [22, 24, 11, 0.18]
  ];

  function create(canvas) {
    const context = canvas?.getContext?.("2d");
    const tileset = new Image();
    const enemyImages = new Map();
    const renderer = {
      ready: false,
      enemiesReady: false,
      failed: false,
      animationFrame: null,
      enemyManifest: {},
      lastMapRows: [],
      lastOptions: {},
      render(mapData, options = {}) {
        const data = renderData(mapData, options);
        if (!context || data.rows.length === 0) return false;

        renderer.lastMapRows = data.rows;
        renderer.lastOptions = { ...options, entities: data.entities };
        const rows = normalizeRows(data.rows);
        const columns = Math.max(...rows.map(row => row.length));
        canvas.width = columns * TILE_SIZE;
        canvas.height = rows.length * TILE_SIZE;
        canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
        context.imageSmoothingEnabled = false;
        context.clearRect(0, 0, canvas.width, canvas.height);

        const enemyPositions = enemyPositionSet(data.entities);
        rows.forEach((row, y) => {
          [...row.padEnd(columns, "?")].forEach((symbol, x) => {
            const tileSymbol = symbol === "E" && enemyPositions.has(positionKey(x, y)) ? "." : symbol;
            drawSymbol(context, tileset, renderer.ready, tileSymbol, x, y);
          });
        });
        drawEntities(context, renderer, enemyImages, data.entities);

        return true;
      },
      animateAttack(source) {
        if (!context || !renderer.lastMapRows.length) return false;

        const points = combatPoints(renderer, source);
        if (!points) return false;

        if (renderer.animationFrame) cancelAnimationFrame(renderer.animationFrame);
        const startedAt = performance.now();

        function drawFrame(now) {
          const progress = Math.min(1, (now - startedAt) / ATTACK_ANIMATION_MS);
          renderer.render(renderer.lastMapRows, renderer.lastOptions);
          drawAttackTrace(context, points.from, points.to, progress, source);

          if (progress < 1) {
            renderer.animationFrame = requestAnimationFrame(drawFrame);
          } else {
            renderer.animationFrame = null;
            renderer.render(renderer.lastMapRows, renderer.lastOptions);
          }
        }

        renderer.animationFrame = requestAnimationFrame(drawFrame);
        return true;
      },
      clearAttackAnimation() {
        if (renderer.animationFrame) cancelAnimationFrame(renderer.animationFrame);
        renderer.animationFrame = null;
        rerender(renderer);
      }
    };

    tileset.onload = () => {
      renderer.ready = true;
      canvas.dispatchEvent(new CustomEvent("tileset:ready"));
    };
    tileset.onerror = () => {
      renderer.failed = true;
      canvas.dispatchEvent(new CustomEvent("tileset:failed"));
    };
    tileset.src = TILESET_PATH;
    loadEnemyManifest(renderer, enemyImages, canvas);

    return renderer;
  }

  function normalizeRows(mapRows) {
    return mapRows.map(row => String(row).replace(/ /g, "."));
  }

  function renderData(mapData, options) {
    if (mapData?.terrain && Number.isInteger(mapData.width) && Number.isInteger(mapData.height)) {
      return {
        rows: rowsFromViewport(mapData),
        entities: mapData.entities || []
      };
    }

    return {
      rows: Array.isArray(mapData) ? mapData : [],
      entities: legacyEnemyEntities(options.enemies || [])
    };
  }

  function rowsFromViewport(viewport) {
    const terrain = String(viewport.terrain || "").padEnd(viewport.width * viewport.height, "?");
    return Array.from({ length: viewport.height }, (_, rowIndex) => {
      const start = rowIndex * viewport.width;
      return terrain.slice(start, start + viewport.width);
    });
  }

  function legacyEnemyEntities(enemies) {
    return enemies.map(enemy => {
      const mapPosition = enemy.map_position;
      if (!mapPosition) return null;

      return {
        type: "enemy",
        creature_id: enemy.creature_id,
        x: mapPosition.x,
        y: mapPosition.y
      };
    }).filter(Boolean);
  }

  function drawSymbol(context, tileset, tilesetReady, symbol, x, y) {
    if (symbol === "?") {
      drawFog(context, x, y);
      return;
    }

    const tileName = SYMBOL_TILES[symbol] || "fog";

    if (tilesetReady) {
      drawTile(context, tileset, tileName, x, y);
      return;
    }

    context.fillStyle = FALLBACK_COLORS[symbol] || FALLBACK_COLORS["?"];
    context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  function drawFog(context, x, y) {
    const originX = x * TILE_SIZE;
    const originY = y * TILE_SIZE;
    const noiseSeed = (x * 37 + y * 53) % 11;

    context.fillStyle = "#020305";
    context.fillRect(originX, originY, TILE_SIZE, TILE_SIZE);
    context.fillStyle = "rgba(0, 0, 0, 0.55)";
    context.fillRect(originX, originY, TILE_SIZE, TILE_SIZE);

    FOG_DOTS.forEach(([dotX, dotY, radius, alpha], index) => {
      const shiftedX = originX + ((dotX + noiseSeed + index * 3) % TILE_SIZE);
      const shiftedY = originY + ((dotY + noiseSeed * 2 + index * 5) % TILE_SIZE);
      const gradient = context.createRadialGradient(shiftedX, shiftedY, 0, shiftedX, shiftedY, radius);
      gradient.addColorStop(0, `rgba(32, 36, 48, ${alpha})`);
      gradient.addColorStop(0.55, `rgba(9, 11, 17, ${alpha * 0.55})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = gradient;
      context.fillRect(originX, originY, TILE_SIZE, TILE_SIZE);
    });

    context.fillStyle = "rgba(0, 0, 0, 0.38)";
    context.fillRect(originX, originY, TILE_SIZE, 2);
    context.fillRect(originX, originY + TILE_SIZE - 2, TILE_SIZE, 2);
    context.fillRect(originX, originY, 2, TILE_SIZE);
    context.fillRect(originX + TILE_SIZE - 2, originY, 2, TILE_SIZE);
  }

  function loadEnemyManifest(renderer, enemyImages, canvas) {
    fetch(ENEMY_MANIFEST_PATH)
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then(manifest => {
        renderer.enemyManifest = manifest;
        renderer.enemiesReady = true;
        canvas.dispatchEvent(new CustomEvent("enemies:ready"));
        rerender(renderer);
      })
      .catch(() => {
        renderer.enemiesReady = false;
        canvas.dispatchEvent(new CustomEvent("enemies:failed"));
      });
  }

  function drawEntities(context, renderer, enemyImages, entities) {
    entities.forEach(entity => {
      if (entity.type === "enemy") {
        drawEnemy(context, renderer, enemyImages, entity);
        return;
      }

      const tileName = ENTITY_TILES[entity.type];
      if (tileName) drawTile(context, null, tileName, entity.x, entity.y);
    });
  }

  const ENTITY_TILES = {
    player: "player",
    portal: "portal",
    descent: "stairsDown",
    loot: "lootBag"
  };

  function drawEnemy(context, renderer, enemyImages, enemy) {
    const image = imageForEnemy(renderer, enemyImages, enemy.creature_id);
    if (image?.complete && image.naturalWidth > 0) {
      drawEnemyImage(context, image, enemy.x, enemy.y);
      return;
    }

    drawTile(context, null, "goblin", enemy.x, enemy.y);
  }

  function enemyPositionSet(entities) {
    return new Set(entities.filter(entity => entity.type === "enemy").map(entity => positionKey(entity.x, entity.y)));
  }

  function positionKey(x, y) {
    return `${x},${y}`;
  }

  function imageForEnemy(renderer, enemyImages, creatureId) {
    const entry = renderer.enemyManifest[creatureId];
    if (!entry?.sprite) return null;
    if (enemyImages.has(creatureId)) return enemyImages.get(creatureId);

    const image = new Image();
    image.onload = () => rerender(renderer);
    image.src = entry.sprite;
    enemyImages.set(creatureId, image);
    return image;
  }

  function drawEnemyImage(context, image, x, y) {
    context.drawImage(
      image,
      x * TILE_SIZE,
      y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE
    );
  }

  function combatPoints(renderer, source) {
    const player = firstEntityPosition(renderer.lastOptions.entities || [], "player") || findSymbolPosition(renderer.lastMapRows, "x");
    const enemy = firstEntityPosition(renderer.lastOptions.entities || [], "enemy") || findSymbolPosition(renderer.lastMapRows, "E");
    if (!player || !enemy) return null;

    return source === "enemy"
      ? { from: tileCenter(enemy), to: tileCenter(player) }
      : { from: tileCenter(player), to: tileCenter(enemy) };
  }

  function firstEntityPosition(entities, type) {
    const entity = entities.find(entry => entry.type === type);
    return entity ? { x: entity.x, y: entity.y } : null;
  }

  function findSymbolPosition(mapRows, symbol) {
    for (let y = 0; y < mapRows.length; y += 1) {
      const x = String(mapRows[y]).indexOf(symbol);
      if (x >= 0) return { x, y };
    }
    return null;
  }

  function tileCenter(position) {
    return {
      x: (position.x * TILE_SIZE) + (TILE_SIZE / 2),
      y: (position.y * TILE_SIZE) + (TILE_SIZE / 2)
    };
  }

  function drawAttackTrace(context, from, to, progress, source) {
    const eased = 1 - ((1 - progress) ** 2);
    const head = interpolatePoint(from, to, eased);
    const tail = interpolatePoint(from, to, Math.max(0, eased - 0.28));
    const color = source === "enemy" ? "255, 51, 51" : "255, 242, 102";

    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";
    context.strokeStyle = `rgba(${color}, ${1 - (progress * 0.45)})`;
    context.shadowColor = `rgba(${color}, 0.8)`;
    context.shadowBlur = 12;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(tail.x, tail.y);
    context.lineTo(head.x, head.y);
    context.stroke();

    context.fillStyle = `rgba(${color}, ${1 - (progress * 0.25)})`;
    context.beginPath();
    context.arc(head.x, head.y, 4 + (progress * 5), 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function interpolatePoint(from, to, progress) {
    return {
      x: from.x + ((to.x - from.x) * progress),
      y: from.y + ((to.y - from.y) * progress)
    };
  }

  function rerender(renderer) {
    if (renderer.lastMapRows.length) renderer.render(renderer.lastMapRows, renderer.lastOptions);
  }

  function drawTile(context, tileset, tileName, x, y) {
    const [tileX, tileY] = TILE_INDEXES[tileName] || TILE_INDEXES.fog;
    if (!tileset) {
      context.fillStyle = FALLBACK_COLORS.E;
      context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      return;
    }
    const sourceWidth = tileset.naturalWidth / TILESET_COLUMNS;
    const sourceHeight = tileset.naturalHeight / TILESET_ROWS;

    context.drawImage(
      tileset,
      tileX * sourceWidth,
      tileY * sourceHeight,
      sourceWidth,
      sourceHeight,
      x * TILE_SIZE,
      y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE
    );
  }

  return {
    create,
    symbolTiles: SYMBOL_TILES,
    tileIndexes: TILE_INDEXES,
    tilesetPath: TILESET_PATH,
    enemyManifestPath: ENEMY_MANIFEST_PATH
  };
})();
