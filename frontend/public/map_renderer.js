globalThis.DungeonMapRenderer = (() => {
  const TILESET_SOURCE_SIZE = { width: 1254, height: 1254 };
  const TILESET_SOURCE_COLUMNS = [
    { x: 5, width: 151 },
    { x: 162, width: 151 },
    { x: 319, width: 149 },
    { x: 474, width: 150 },
    { x: 630, width: 149 },
    { x: 786, width: 150 },
    { x: 942, width: 150 },
    { x: 1098, width: 151 }
  ];
  const TILESET_SOURCE_ROWS = [
    { y: 5, height: 304 },
    { y: 315, height: 308 },
    { y: 633, height: 304 },
    { y: 944, height: 305 }
  ];
  const TILESET_REFERENCE_CELL = { width: 151, height: 308 };
  const TILE_WIDTH = 48;
  const TILE_HEIGHT = Math.round(TILE_WIDTH * (TILESET_REFERENCE_CELL.height / TILESET_REFERENCE_CELL.width));
  const TILE_REFERENCE_SIZE = 32;
  const ENEMY_HEIGHT_SCALE = 1.5;
  const ATTACK_ANIMATION_MS = 420;
  const TILESET_PATH = "/assets/tilesets/original-dungeon-tileset.png";
  const ENEMY_MANIFEST_PATH = "/assets/enemies/enemies.json";
  const CLASS_SPRITE_PATH_PREFIX = "/assets/classes/";
  const CLASS_SPRITE_WIDTH = 127;
  const CLASS_SPRITE_HEIGHT = 149;
  const CLASS_WALK_ROW_INDEXES = {
    down: 0,
    left: 1,
    right: 2,
    up: 3
  };
  const CLASS_WALK_FRAME_COUNT = 4;
  const CLASS_WALK_FRAME_MS = 140;
  const PLAYER_WALK_ANIMATION_MS = CLASS_WALK_FRAME_COUNT * CLASS_WALK_FRAME_MS;
  const CLASS_SPRITE_INDEXES = {
    adventurer: 0,
    blademaster: 1,
    dragoon: 2,
    nightblade: 3,
    arcanist: 4,
    druid: 5,
    warlord: 6,
    duelist: 7,
    spellblade: 8,
    warden: 9,
    skirmisher: 10,
    battlemage: 11,
    sentinel: 12,
    hexblade: 13,
    ranger: 14,
    mystic: 15
  };

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

  const ENTITY_SPRITES = {
    player: {
      source: { x: 13, y: 358, width: 132, height: 160 },
      underlay: "floor"
    }
  };

  const SYMBOL_TILES = {
    "#": "wall",
    ".": "floor",
    " ": "floor",
    "?": "fog"
  };

  const FALLBACK_COLORS = {
    "#": "#343a40",
    ".": "#1d2428",
    " ": "#1d2428",
    "?": "#08090b"
  };
  const ENTITY_FALLBACK_COLORS = {
    player: "#f8f5c7",
    portal: "#7dd3fc",
    stairsUp: "#38bdf8",
    stairsDown: "#f59e0b",
    lootBag: "#facc15",
    goblin: "#f87171"
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
    const classImages = new Map();
    const enemyImages = new Map();
    const renderer = {
      ready: false,
      enemiesReady: false,
      failed: false,
      animationFrame: null,
      playerWalkFrame: null,
      playerWalkStartedAt: null,
      playerDirection: "down",
      enemyManifest: {},
      lastViewport: null,
      lastOptions: {},
      lastRows: [],
      lastEntities: [],
      render(viewport, options = {}) {
        if (!context || !validViewport(viewport)) return false;

        const rows = normalizeRows(rowsFromViewport(viewport));
        const entities = viewport.entities || [];
        renderer.lastViewport = viewport;
        renderer.lastOptions = options;
        renderer.lastRows = rows;
        renderer.lastEntities = entities;
        const columns = Math.max(...rows.map(row => row.length));
        canvas.width = columns * TILE_WIDTH;
        canvas.height = rows.length * TILE_HEIGHT;
        canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
        context.imageSmoothingEnabled = false;
        context.clearRect(0, 0, canvas.width, canvas.height);

        rows.forEach((row, y) => {
          [...row.padEnd(columns, "?")].forEach((symbol, x) => {
            drawSymbol(context, tileset, renderer.ready, rows, symbol, x, y);
          });
        });
        drawEntities(context, renderer, enemyImages, classImages, tileset, entities, options);
        if (options.playerDead) drawDeathOverlay(context, canvas);

        return true;
      },
      animateAttack(source, effect = "magic") {
        if (!context || !renderer.lastViewport) return false;

        const points = combatPoints(renderer, source);
        if (!points) return false;

        if (renderer.animationFrame) cancelAnimationFrame(renderer.animationFrame);
        const startedAt = performance.now();

        function drawFrame(now) {
          const progress = Math.min(1, (now - startedAt) / ATTACK_ANIMATION_MS);
          renderer.render(renderer.lastViewport, renderer.lastOptions);
          drawAttackTrace(context, points.from, points.to, progress, source, effect);
          if (renderer.lastOptions.playerDead) drawDeathOverlay(context, canvas);

          if (progress < 1) {
            renderer.animationFrame = requestAnimationFrame(drawFrame);
          } else {
            renderer.animationFrame = null;
            renderer.render(renderer.lastViewport, renderer.lastOptions);
          }
        }

        renderer.animationFrame = requestAnimationFrame(drawFrame);
        return true;
      },
      clearAttackAnimation() {
        if (renderer.animationFrame) cancelAnimationFrame(renderer.animationFrame);
        renderer.animationFrame = null;
        rerender(renderer);
      },
      animatePlayerWalk(direction) {
        const playerDirection = normalizeDirection(direction);
        if (!playerDirection || !renderer.lastViewport) return false;

        renderer.playerDirection = playerDirection;
        renderer.playerWalkStartedAt = performance.now();
        if (renderer.playerWalkFrame) cancelAnimationFrame(renderer.playerWalkFrame);

        function drawWalkFrame(now) {
          renderer.render(renderer.lastViewport, {
            ...renderer.lastOptions,
            playerDirection
          });

          if (now - renderer.playerWalkStartedAt < PLAYER_WALK_ANIMATION_MS) {
            renderer.playerWalkFrame = requestAnimationFrame(drawWalkFrame);
          } else {
            renderer.playerWalkFrame = null;
            renderer.playerWalkStartedAt = null;
            renderer.render(renderer.lastViewport, {
              ...renderer.lastOptions,
              playerDirection
            });
          }
        }

        renderer.playerWalkFrame = requestAnimationFrame(drawWalkFrame);
        return true;
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

  function validViewport(viewport) {
    return Boolean(viewport?.terrain && Number.isInteger(viewport.width) && Number.isInteger(viewport.height));
  }

  function rowsFromViewport(viewport) {
    const terrain = String(viewport.terrain || "").padEnd(viewport.width * viewport.height, "?");
    return Array.from({ length: viewport.height }, (_, rowIndex) => {
      const start = rowIndex * viewport.width;
      return terrain.slice(start, start + viewport.width);
    });
  }

  function drawSymbol(context, tileset, tilesetReady, rows, symbol, x, y) {
    if (symbol === "?") {
      drawFog(context, x, y);
      return;
    }

    const tileName = tileNameForSymbol(rows, symbol, x, y);

    if (tilesetReady) {
      drawTile(context, tileset, tileName, x, y);
      return;
    }

    context.fillStyle = FALLBACK_COLORS[symbol] || FALLBACK_COLORS["?"];
    context.fillRect(tileOriginX(x), tileOriginY(y), TILE_WIDTH, TILE_HEIGHT);
  }

  function tileNameForSymbol(rows, symbol, x, y) {
    if (symbol === "#") return wallTileName(rows, x, y);
    if (symbol === "." || symbol === " ") return floorTileName(x, y);
    return SYMBOL_TILES[symbol] || "fog";
  }

  function floorTileName(x, y) {
    return ((x * 17) + (y * 31)) % 11 === 0 ? "crackedFloor" : "floor";
  }

  function wallTileName(rows, x, y) {
    const northOpen = openTerrainAt(rows, x, y - 1);
    const southOpen = openTerrainAt(rows, x, y + 1);
    const westOpen = openTerrainAt(rows, x - 1, y);
    const eastOpen = openTerrainAt(rows, x + 1, y);

    if (southOpen && (westOpen || eastOpen)) return "wallCorner";
    if (southOpen) return "wallTop";
    if (eastOpen && !westOpen) return "wallLeft";
    if (westOpen && !eastOpen) return "wallRight";
    if (northOpen && (westOpen || eastOpen)) return "wallCorner";
    if (eastOpen) return "wallLeft";
    if (westOpen) return "wallRight";
    return ((x + y) % 5 === 0) ? "wallTop" : "wall";
  }

  function openTerrainAt(rows, x, y) {
    if (y < 0 || y >= rows.length) return false;
    const symbol = rows[y]?.[x];
    return symbol === "." || symbol === " ";
  }

  function drawFog(context, x, y) {
    const originX = tileOriginX(x);
    const originY = tileOriginY(y);
    const noiseSeed = (x * 37 + y * 53) % 11;

    context.fillStyle = "#020305";
    context.fillRect(originX, originY, TILE_WIDTH, TILE_HEIGHT);
    context.fillStyle = "rgba(0, 0, 0, 0.55)";
    context.fillRect(originX, originY, TILE_WIDTH, TILE_HEIGHT);

    FOG_DOTS.forEach(([dotX, dotY, radius, alpha], index) => {
      const shiftedX = originX + ((((dotX + noiseSeed + index * 3) % TILE_REFERENCE_SIZE) / TILE_REFERENCE_SIZE) * TILE_WIDTH);
      const shiftedY = originY + ((((dotY + noiseSeed * 2 + index * 5) % TILE_REFERENCE_SIZE) / TILE_REFERENCE_SIZE) * TILE_HEIGHT);
      const gradient = context.createRadialGradient(shiftedX, shiftedY, 0, shiftedX, shiftedY, scaleReference(radius));
      gradient.addColorStop(0, `rgba(32, 36, 48, ${alpha})`);
      gradient.addColorStop(0.55, `rgba(9, 11, 17, ${alpha * 0.55})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = gradient;
      context.fillRect(originX, originY, TILE_WIDTH, TILE_HEIGHT);
    });

    context.fillStyle = "rgba(0, 0, 0, 0.38)";
    context.fillRect(originX, originY, TILE_WIDTH, 2);
    context.fillRect(originX, originY + TILE_HEIGHT - 2, TILE_WIDTH, 2);
    context.fillRect(originX, originY, 2, TILE_HEIGHT);
    context.fillRect(originX + TILE_WIDTH - 2, originY, 2, TILE_HEIGHT);
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

  function drawEntities(context, renderer, enemyImages, classImages, tileset, entities, options) {
    [...entities].sort(compareEntitiesForDrawing).forEach(entity => {
      if (entity.type === "enemy") {
        drawEnemy(context, renderer, enemyImages, tileset, entity);
        return;
      }
      if (entity.type === "player") {
        drawPlayer(context, renderer, tileset, classImages, entity, options.playerClass, options.playerDirection);
        return;
      }

      const tileName = ENTITY_TILES[entity.type];
      if (tileName) drawEntityTile(context, renderer.ready ? tileset : null, tileName, entity.x, entity.y);
    });
  }

  const ENTITY_TILES = {
    player: "player",
    portal: "portal",
    ascent: "stairsUp",
    descent: "stairsDown",
    loot: "lootBag"
  };

  function compareEntitiesForDrawing(left, right) {
    return entityPriority(left.type) - entityPriority(right.type);
  }

  function entityPriority(type) {
    return {
      portal: 10,
      ascent: 10,
      descent: 10,
      loot: 20,
      enemy: 30,
      player: 40
    }[type] || 0;
  }

  function drawEnemy(context, renderer, enemyImages, tileset, enemy) {
    const image = imageForEnemy(renderer, enemyImages, enemy.creature_id);
    if (image?.complete && image.naturalWidth > 0) {
      drawEnemyImage(context, image, renderer.ready ? tileset : null, enemy.x, enemy.y);
      return;
    }

    drawEntityTile(context, renderer.ready ? tileset : null, "goblin", enemy.x, enemy.y);
  }

  function drawPlayer(context, renderer, tileset, classImages, player, playerClass, playerDirection) {
    const classImage = imageForClass(renderer, classImages, playerClass);
    if (!classImage?.complete || classImage.naturalWidth <= 0) {
      drawEntityTile(context, renderer.ready ? tileset : null, "player", player.x, player.y);
      return;
    }

    if (renderer.ready) drawTile(context, tileset, "floor", player.x, player.y);
    const source = classSpriteSourceRect(playerDirection || renderer.playerDirection, playerWalkFrame(renderer));
    const target = containedTileRect(source.width, source.height, player.x, player.y);
    context.drawImage(
      classImage,
      source.x,
      source.y,
      source.width,
      source.height,
      target.x,
      target.y,
      target.width,
      target.height
    );
  }

  function classSpriteSourceRect(playerDirection = "down", frame = 0) {
    const direction = normalizeDirection(playerDirection) || "down";
    const frameOffset = Math.max(0, Math.min(CLASS_WALK_FRAME_COUNT - 1, frame));
    const rowIndex = CLASS_WALK_ROW_INDEXES[direction] ?? CLASS_WALK_ROW_INDEXES.down;
    return {
      x: frameOffset * CLASS_SPRITE_WIDTH,
      y: rowIndex * CLASS_SPRITE_HEIGHT,
      width: CLASS_SPRITE_WIDTH,
      height: CLASS_SPRITE_HEIGHT
    };
  }

  function classSpriteKey(playerClass) {
    const key = String(playerClass || "adventurer").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    return Object.hasOwn(CLASS_SPRITE_INDEXES, key) ? key : "adventurer";
  }

  function imageForClass(renderer, classImages, playerClass) {
    const key = classSpriteKey(playerClass);
    if (classImages.has(key)) return classImages.get(key);

    const image = new Image();
    image.onload = () => rerender(renderer);
    image.src = `${CLASS_SPRITE_PATH_PREFIX}${key}.png`;
    classImages.set(key, image);
    return image;
  }

  function normalizeDirection(direction) {
    return ["up", "right", "down", "left"].includes(direction) ? direction : null;
  }

  function playerWalkFrame(renderer) {
    if (!renderer.playerWalkStartedAt) return 0;

    const elapsed = performance.now() - renderer.playerWalkStartedAt;
    return Math.floor(elapsed / CLASS_WALK_FRAME_MS) % CLASS_WALK_FRAME_COUNT;
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

  function drawEnemyImage(context, image, tileset, x, y) {
    const target = tileset
      ? enemySpriteTargetRect(tileset, image, x, y)
      : containedTileRect(image.naturalWidth, image.naturalHeight, x, y);
    context.drawImage(
      image,
      target.x,
      target.y,
      target.width,
      target.height
    );
  }

  function combatPoints(renderer, source) {
    const player = firstEntityPosition(renderer.lastEntities, "player");
    const enemy = firstEntityPosition(renderer.lastEntities, "enemy");
    if (!player || !enemy) return null;

    return source === "enemy"
      ? { from: tileCenter(enemy), to: tileCenter(player) }
      : { from: tileCenter(player), to: tileCenter(enemy) };
  }

  function firstEntityPosition(entities, type) {
    const entity = entities.find(entry => entry.type === type);
    return entity ? { x: entity.x, y: entity.y } : null;
  }

  function tileCenter(position) {
    return {
      x: tileOriginX(position.x) + (TILE_WIDTH / 2),
      y: tileOriginY(position.y) + (TILE_HEIGHT / 2)
    };
  }

  function drawAttackTrace(context, from, to, progress, source, effect = "magic") {
    if (effect === "slash") {
      drawSlashTrace(context, from, to, progress, source);
      return;
    }

    drawMagicTrace(context, from, to, progress, source);
  }

  function drawMagicTrace(context, from, to, progress, source) {
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

  function drawSlashTrace(context, from, to, progress, source) {
    const eased = 1 - ((1 - progress) ** 2);
    const center = interpolatePoint(from, to, Math.min(1, 0.35 + (eased * 0.65)));
    const alpha = 1 - (progress * 0.55);
    const color = source === "enemy" ? "255, 77, 77" : "244, 245, 246";
    const angle = source === "enemy" ? -Math.PI / 4 : Math.PI / 4;
    const length = Math.min(TILE_WIDTH, TILE_HEIGHT) * (0.35 + (progress * 0.45));
    const spread = Math.min(TILE_WIDTH, TILE_HEIGHT) * 0.14;

    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";
    context.strokeStyle = `rgba(${color}, ${alpha})`;
    context.shadowColor = `rgba(${color}, 0.75)`;
    context.shadowBlur = 10;
    context.lineWidth = 4;

    drawSlashLine(context, center, angle, length);
    context.lineWidth = 2;
    drawSlashLine(
      context,
      {
        x: center.x + (Math.cos(angle + (Math.PI / 2)) * spread),
        y: center.y + (Math.sin(angle + (Math.PI / 2)) * spread)
      },
      angle,
      length * 0.72
    );

    context.restore();
  }

  function drawSlashLine(context, center, angle, length) {
    const offsetX = Math.cos(angle) * length;
    const offsetY = Math.sin(angle) * length;

    context.beginPath();
    context.moveTo(center.x - offsetX, center.y - offsetY);
    context.lineTo(center.x + offsetX, center.y + offsetY);
    context.stroke();
  }

  function interpolatePoint(from, to, progress) {
    return {
      x: from.x + ((to.x - from.x) * progress),
      y: from.y + ((to.y - from.y) * progress)
    };
  }

  function rerender(renderer) {
    if (renderer.lastViewport) renderer.render(renderer.lastViewport, renderer.lastOptions);
  }

  function drawDeathOverlay(context, canvas) {
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.68)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }

  function drawTile(context, tileset, tileName, x, y) {
    const [tileX, tileY] = TILE_INDEXES[tileName] || TILE_INDEXES.fog;
    if (!tileset) {
      context.fillStyle = ENTITY_FALLBACK_COLORS[tileName] || FALLBACK_COLORS["?"];
      context.fillRect(tileOriginX(x), tileOriginY(y), TILE_WIDTH, TILE_HEIGHT);
      return;
    }
    const sourceRect = sourceRectForTile(tileset, tileX, tileY);

    context.drawImage(
      tileset,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      tileOriginX(x),
      tileOriginY(y),
      TILE_WIDTH,
      TILE_HEIGHT
    );
  }

  function drawEntityTile(context, tileset, tileName, x, y) {
    const sprite = ENTITY_SPRITES[tileName];
    if (!sprite || !tileset) {
      drawTile(context, tileset, tileName, x, y);
      return;
    }

    if (sprite.underlay) drawTile(context, tileset, sprite.underlay, x, y);
    const sourceRect = entitySpriteSourceRect(tileset, tileName);
    const targetRect = entitySpriteTargetRect(tileset, tileName, x, y);

    context.drawImage(
      tileset,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      targetRect.x,
      targetRect.y,
      targetRect.width,
      targetRect.height
    );
  }

  function entitySpriteSourceRect(tileset, tileName) {
    return scaledSourceRect(tileset, ENTITY_SPRITES[tileName].source);
  }

  function entitySpriteTargetRect(tileset, tileName, x, y) {
    return spriteTargetRect(tileset, tileName, entitySpriteSourceRect(tileset, tileName), x, y);
  }

  function enemySpriteTargetRect(tileset, image, x, y) {
    const playerTarget = entitySpriteTargetRect(tileset, "player", x, y);
    const height = playerTarget.height * ENEMY_HEIGHT_SCALE;
    const width = height * (image.naturalWidth / image.naturalHeight);

    return {
      x: playerTarget.x + Math.round((playerTarget.width - width) / 2),
      y: playerTarget.y + playerTarget.height - height,
      width,
      height
    };
  }

  function spriteTargetRect(tileset, tileName, sourceRect, x, y) {
    const [tileX, tileY] = TILE_INDEXES[tileName] || TILE_INDEXES.floor;
    const sourceCell = sourceRectForTile(tileset, tileX, tileY);

    return {
      x: tileOriginX(x) + (((sourceRect.x - sourceCell.x) / sourceCell.width) * TILE_WIDTH),
      y: tileOriginY(y) + (((sourceRect.y - sourceCell.y) / sourceCell.height) * TILE_HEIGHT),
      width: (sourceRect.width / sourceCell.width) * TILE_WIDTH,
      height: (sourceRect.height / sourceCell.height) * TILE_HEIGHT
    };
  }

  function sourceRectForTile(tileset, tileX, tileY) {
    const column = TILESET_SOURCE_COLUMNS[tileX] || TILESET_SOURCE_COLUMNS[0];
    const row = TILESET_SOURCE_ROWS[tileY] || TILESET_SOURCE_ROWS[0];
    const scaleX = tileset.naturalWidth / TILESET_SOURCE_SIZE.width;
    const scaleY = tileset.naturalHeight / TILESET_SOURCE_SIZE.height;

    return {
      x: column.x * scaleX,
      y: row.y * scaleY,
      width: column.width * scaleX,
      height: row.height * scaleY
    };
  }

  function scaledSourceRect(tileset, source) {
    const scaleX = tileset.naturalWidth / TILESET_SOURCE_SIZE.width;
    const scaleY = tileset.naturalHeight / TILESET_SOURCE_SIZE.height;

    return {
      x: source.x * scaleX,
      y: source.y * scaleY,
      width: source.width * scaleX,
      height: source.height * scaleY
    };
  }

  function containedTileRect(sourceWidth, sourceHeight, x, y) {
    const sourceRatio = sourceWidth / sourceHeight;
    const tileRatio = TILE_WIDTH / TILE_HEIGHT;
    const width = sourceRatio > tileRatio ? TILE_WIDTH : Math.round(TILE_HEIGHT * sourceRatio);
    const height = sourceRatio > tileRatio ? Math.round(TILE_WIDTH / sourceRatio) : TILE_HEIGHT;

    return {
      x: tileOriginX(x) + Math.round((TILE_WIDTH - width) / 2),
      y: tileOriginY(y) + TILE_HEIGHT - height,
      width,
      height
    };
  }

  function tileOriginX(x) {
    return x * TILE_WIDTH;
  }

  function tileOriginY(y) {
    return y * TILE_HEIGHT;
  }

  function scaleReference(value) {
    return value * (Math.max(TILE_WIDTH, TILE_HEIGHT) / TILE_REFERENCE_SIZE);
  }

  return {
    create,
    symbolTiles: SYMBOL_TILES,
    tileIndexes: TILE_INDEXES,
    entitySprites: ENTITY_SPRITES,
    tileSize: { width: TILE_WIDTH, height: TILE_HEIGHT },
    tilesetSourceColumns: TILESET_SOURCE_COLUMNS,
    tilesetSourceRows: TILESET_SOURCE_ROWS,
    tilesetPath: TILESET_PATH,
    classSpritePathPrefix: CLASS_SPRITE_PATH_PREFIX,
    enemyManifestPath: ENEMY_MANIFEST_PATH
  };
})();
