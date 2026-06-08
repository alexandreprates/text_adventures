globalThis.DungeonMapRenderer = (() => {
  const TILESET_COLUMNS = 8;
  const TILESET_ROWS = 4;
  const TILE_SIZE = 32;
  const TILESET_PATH = "/assets/tilesets/original-dungeon-tileset.png";

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
    "E": "goblin",
    "@": "lootBag"
  };

  const FALLBACK_COLORS = {
    "#": "#343a40",
    ".": "#1d2428",
    " ": "#1d2428",
    "?": "#08090b",
    "x": "#d9b45f",
    "E": "#d66f62",
    "@": "#7fb7a7"
  };

  function create(canvas) {
    const context = canvas?.getContext?.("2d");
    const tileset = new Image();
    const renderer = {
      ready: false,
      failed: false,
      render(mapRows) {
        if (!context || !Array.isArray(mapRows) || mapRows.length === 0) return false;

        const rows = normalizeRows(mapRows);
        const columns = Math.max(...rows.map(row => row.length));
        canvas.width = columns * TILE_SIZE;
        canvas.height = rows.length * TILE_SIZE;
        canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
        context.imageSmoothingEnabled = false;
        context.clearRect(0, 0, canvas.width, canvas.height);

        rows.forEach((row, y) => {
          [...row.padEnd(columns, "?")].forEach((symbol, x) => {
            drawSymbol(context, tileset, renderer.ready, symbol, x, y);
          });
        });

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

    return renderer;
  }

  function normalizeRows(mapRows) {
    return mapRows.map(row => String(row).replace(/ /g, "."));
  }

  function drawSymbol(context, tileset, tilesetReady, symbol, x, y) {
    const tileName = SYMBOL_TILES[symbol] || "fog";

    if (tilesetReady) {
      drawTile(context, tileset, tileName, x, y);
      return;
    }

    context.fillStyle = FALLBACK_COLORS[symbol] || FALLBACK_COLORS["?"];
    context.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }

  function drawTile(context, tileset, tileName, x, y) {
    const [tileX, tileY] = TILE_INDEXES[tileName] || TILE_INDEXES.fog;
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
    tilesetPath: TILESET_PATH
  };
})();
