globalThis.DungeonMapRenderer = (() => {
  const SOURCE_TILE_SIZE = 16;
  const TILE_WIDTH = 48;
  const TILE_HEIGHT = 48;
  const TILE_REFERENCE_SIZE = 32;
  const ATTACK_ANIMATION_MS = 420;
  const TILESET_BASE_PATH = "/assets/tilesets/dungeon";
  const ENEMY_MANIFEST_PATH = "/assets/enemies/enemies.json";

  const TILESET_PATHS = {
    objects: `${TILESET_BASE_PATH}/Objects.png`,
    waterCoastsAnimation: `${TILESET_BASE_PATH}/Water_coasts_animation.png`,
    decorativeCracksCoastsAnimation: `${TILESET_BASE_PATH}/decorative_cracks_coasts_animation.png`,
    decorativeCracksFloor: `${TILESET_BASE_PATH}/decorative_cracks_floor.png`,
    decorativeCracksWalls: `${TILESET_BASE_PATH}/decorative_cracks_walls.png`,
    doorsLeverChestAnimation: `${TILESET_BASE_PATH}/doors_lever_chest_animation.png`,
    fireAnimation: `${TILESET_BASE_PATH}/fire_animation.png`,
    fireAnimation2: `${TILESET_BASE_PATH}/fire_animation2.png`,
    trapAnimation: `${TILESET_BASE_PATH}/trap_animation.png`,
    wallsFloor: `${TILESET_BASE_PATH}/walls_floor.png`,
    waterDetailization: `${TILESET_BASE_PATH}/water_detilazation_v2.png`
  };

  const TILE_SPRITES = {
    floor: { sheet: "wallsFloor", x: 6, y: 4 },
    crackedFloor: { sheet: "decorativeCracksFloor", x: 0, y: 4 },
    wall: { sheet: "wallsFloor", x: 1, y: 16 },
    wallTop: { sheet: "wallsFloor", x: 1, y: 12 },
    wallLeft: { sheet: "wallsFloor", x: 0, y: 13 },
    wallRight: { sheet: "wallsFloor", x: 2, y: 13 },
    wallCorner: { sheet: "wallsFloor", x: 1, y: 13 },
    door: { sheet: "wallsFloor", x: 5, y: 19, underlay: "floor" },
    ironDoor: { sheet: "wallsFloor", x: 8, y: 19, underlay: "floor" },
    stairsUp: { sheet: "objects", x: 6, y: 1, underlay: "floor" },
    stairsDown: { sheet: "objects", x: 7, y: 1, underlay: "floor" },
    lootBag: { sheet: "objects", x: 14, y: 1, underlay: "floor" },
    treasure: { sheet: "objects", x: 10, y: 1, underlay: "floor" },
    closedChest: { sheet: "doorsLeverChestAnimation", x: 0, y: 0, underlay: "floor" },
    openChest: { sheet: "doorsLeverChestAnimation", x: 1, y: 0, underlay: "floor" },
    unlitTorch: { sheet: "objects", x: 0, y: 0, underlay: "wall" },
    litTorch: { sheet: "fireAnimation2", x: 0, y: 0, frames: 6, frameDuration: 140, underlay: "wall" },
    spikeTrap: { sheet: "trapAnimation", x: 0, y: 0, frames: 9, frameDuration: 120, underlay: "floor" },
    pitTrap: { sheet: "trapAnimation", x: 0, y: 5, frames: 9, frameDuration: 120, underlay: "floor" },
    potion: { sheet: "objects", x: 17, y: 1, underlay: "floor" },
    tome: { sheet: "objects", x: 11, y: 3, underlay: "floor" },
    sword: { sheet: "objects", x: 16, y: 5, underlay: "floor" },
    spear: { sheet: "objects", x: 17, y: 5, underlay: "floor" },
    dagger: { sheet: "objects", x: 18, y: 5, underlay: "floor" },
    shield: { sheet: "objects", x: 22, y: 4, underlay: "floor" },
    altar: { sheet: "objects", x: 20, y: 1, underlay: "floor" }
  };

  const ENTITY_SPRITES = {
    player: { custom: "player", underlay: "floor" },
    portal: { custom: "portal", underlay: "floor" },
    goblin: { custom: "enemy", underlay: "floor" }
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
    const tilesheets = new Map();
    const enemyImages = new Map();
    const renderer = {
      ready: false,
      enemiesReady: false,
      failed: false,
      animationFrame: null,
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
            drawSymbol(context, tilesheets, renderer.ready, rows, symbol, x, y);
          });
        });
        drawEntities(context, renderer, enemyImages, tilesheets, entities);
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
      }
    };

    loadTilesheets(renderer, tilesheets, canvas);
    loadEnemyManifest(renderer, enemyImages, canvas);

    return renderer;
  }

  function loadTilesheets(renderer, tilesheets, canvas) {
    const entries = Object.entries(TILESET_PATHS);
    let loaded = 0;
    let failed = false;

    entries.forEach(([name, path]) => {
      const image = new Image();
      image.onload = () => {
        tilesheets.set(name, image);
        loaded += 1;
        if (loaded === entries.length) {
          renderer.ready = true;
          renderer.failed = failed;
          canvas.dispatchEvent(new CustomEvent("tileset:ready"));
          rerender(renderer);
        }
      };
      image.onerror = () => {
        failed = true;
        loaded += 1;
        if (loaded === entries.length) {
          renderer.ready = tilesheets.size > 0;
          renderer.failed = true;
          canvas.dispatchEvent(new CustomEvent("tileset:failed"));
          rerender(renderer);
        }
      };
      image.src = path;
    });
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

  function drawSymbol(context, tilesheets, tilesetReady, rows, symbol, x, y) {
    if (symbol === "?") {
      drawFog(context, x, y);
      return;
    }

    const tileName = tileNameForSymbol(rows, symbol, x, y);

    if (tilesetReady) {
      drawTile(context, tilesheets, tileName, x, y);
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

  function drawEntities(context, renderer, enemyImages, tilesheets, entities) {
    [...entities].sort(compareEntitiesForDrawing).forEach(entity => {
      if (entity.type === "enemy") {
        drawEnemy(context, renderer, enemyImages, tilesheets, entity);
        return;
      }

      const tileName = ENTITY_TILES[entity.type];
      if (tileName) drawEntityTile(context, renderer.ready ? tilesheets : null, tileName, entity.x, entity.y);
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

  function drawEnemy(context, renderer, enemyImages, tilesheets, enemy) {
    const image = imageForEnemy(renderer, enemyImages, enemy.creature_id);
    if (image?.complete && image.naturalWidth > 0) {
      drawEnemyImage(context, image, enemy.x, enemy.y);
      return;
    }

    drawEntityTile(context, renderer.ready ? tilesheets : null, "goblin", enemy.x, enemy.y);
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
    const target = containedTileRect(image.naturalWidth, image.naturalHeight, x, y);
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
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const panelWidth = Math.min(canvas.width - 32, 360);
    const panelHeight = 78;
    const panelX = centerX - (panelWidth / 2);
    const panelY = centerY - (panelHeight / 2);

    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.68)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(16, 0, 0, 0.9)";
    context.fillRect(panelX, panelY, panelWidth, panelHeight);
    context.strokeStyle = "#ff3333";
    context.lineWidth = 3;
    context.strokeRect(panelX + 1.5, panelY + 1.5, panelWidth - 3, panelHeight - 3);
    context.fillStyle = "#ff3333";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "42px VT323, monospace";
    context.fillText("Voce Morreu!", centerX, centerY + 2);
    context.restore();
  }

  function drawTile(context, tilesheets, tileName, x, y) {
    const sprite = TILE_SPRITES[tileName] || TILE_SPRITES.floor;
    const image = sprite && tilesheets?.get(sprite.sheet);
    if (!image) {
      context.fillStyle = ENTITY_FALLBACK_COLORS[tileName] || FALLBACK_COLORS["?"];
      context.fillRect(tileOriginX(x), tileOriginY(y), TILE_WIDTH, TILE_HEIGHT);
      return;
    }

    if (sprite.underlay) drawTile(context, tilesheets, sprite.underlay, x, y);
    const sourceRect = sourceRectForSprite(sprite);

    context.drawImage(
      image,
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

  function drawEntityTile(context, tilesheets, tileName, x, y) {
    const sprite = ENTITY_SPRITES[tileName];
    if (!sprite) {
      drawTile(context, tilesheets, tileName, x, y);
      return;
    }

    if (sprite.underlay) drawTile(context, tilesheets, sprite.underlay, x, y);
    if (sprite.custom === "player") {
      drawPlayerMarker(context, x, y);
      return;
    }
    if (sprite.custom === "portal") {
      drawPortalMarker(context, x, y);
      return;
    }
    if (sprite.custom === "enemy") {
      drawEnemyMarker(context, x, y);
      return;
    }

    drawTile(context, tilesheets, tileName, x, y);
  }

  function sourceRectForSprite(sprite) {
    const frame = sprite.frames ? Math.floor(performance.now() / (sprite.frameDuration || 160)) % sprite.frames : 0;

    return {
      x: (sprite.x + frame) * SOURCE_TILE_SIZE,
      y: sprite.y * SOURCE_TILE_SIZE,
      width: SOURCE_TILE_SIZE,
      height: SOURCE_TILE_SIZE
    };
  }

  function drawPlayerMarker(context, x, y) {
    const originX = tileOriginX(x);
    const originY = tileOriginY(y);
    const centerX = originX + (TILE_WIDTH / 2);

    context.save();
    context.fillStyle = "#f8f5c7";
    context.beginPath();
    context.arc(centerX, originY + 15, 7, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#7c3aed";
    context.beginPath();
    context.moveTo(centerX, originY + 20);
    context.lineTo(originX + 13, originY + 39);
    context.lineTo(originX + 35, originY + 39);
    context.closePath();
    context.fill();
    context.strokeStyle = "#facc15";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(originX + 32, originY + 23);
    context.lineTo(originX + 38, originY + 36);
    context.stroke();
    context.restore();
  }

  function drawPortalMarker(context, x, y) {
    const originX = tileOriginX(x);
    const originY = tileOriginY(y);
    const centerX = originX + (TILE_WIDTH / 2);
    const centerY = originY + (TILE_HEIGHT / 2);

    context.save();
    context.strokeStyle = "#7dd3fc";
    context.lineWidth = 4;
    context.beginPath();
    context.ellipse(centerX, centerY, 14, 19, 0, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = "rgba(192, 132, 252, 0.85)";
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(centerX, centerY, 8, 13, 0, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  function drawEnemyMarker(context, x, y) {
    const originX = tileOriginX(x);
    const originY = tileOriginY(y);

    context.save();
    context.fillStyle = "#f87171";
    context.fillRect(originX + 12, originY + 15, 24, 24);
    context.fillStyle = "#111827";
    context.fillRect(originX + 17, originY + 22, 4, 4);
    context.fillRect(originX + 27, originY + 22, 4, 4);
    context.restore();
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
    tileSprites: TILE_SPRITES,
    entitySprites: ENTITY_SPRITES,
    tileSize: { width: TILE_WIDTH, height: TILE_HEIGHT },
    sourceTileSize: SOURCE_TILE_SIZE,
    tilesetPaths: TILESET_PATHS,
    enemyManifestPath: ENEMY_MANIFEST_PATH
  };
})();
