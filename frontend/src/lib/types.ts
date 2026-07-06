export type ConnectionStatus =
  | "connecting"
  | "online"
  | "sending"
  | "offline"
  | "error";

export type CollectionTab = "inventory" | "spells";
export type AutoExploreGoal = "explore" | "town" | "descent";

export type SceneName =
  | "town"
  | "tavern"
  | "priest"
  | "blacksmith"
  | "armorsmith"
  | "ruins"
  | string;

export type Position = {
  x: number;
  y: number;
};

export type Resource = {
  current: number;
  max: number;
};

export type Item = {
  name: string;
  display_name?: string;
  type?: string;
  price?: number;
  buy_price?: number;
  sell_price?: number;
  attack?: number;
  defense?: number;
  recovery?: number;
  quantity?: number;
  spell?: string;
  weapon_class?: string;
  armor_class?: string;
  min_level?: number;
  trade_enabled?: boolean;
  trade_note?: string;
};

export type Spell = {
  name: string;
  display_name: string;
  level: number;
  kind?: string;
  mp_cost?: number;
  recovery?: number;
  description?: string;
};

export type SkillProgress = {
  level: number;
  xp: number;
  next_level_xp: number;
};

export type PlayerState = {
  name: string;
  health: Resource;
  mana?: Resource;
  gold: number;
  current_class?: string;
  level: number;
  xp: number;
  attack?: number;
  defense?: number;
  statuses?: string[];
  equipment: {
    weapon?: Item | null;
    armor?: Item | null;
  };
  inventory: Item[];
  spells: Spell[];
  skills: Record<string, SkillProgress>;
};

export type ViewportEntity = {
  type: "player" | "enemy" | "loot" | "portal" | "ascent" | "descent" | string;
  x: number;
  y: number;
  creature_id?: string;
};

export type DungeonViewport = {
  width: number;
  height: number;
  origin?: Position;
  terrain?: string;
  entities?: ViewportEntity[];
};

export type LootState = Position & {
  items?: Item[];
  gold?: number;
};

export type DungeonState = {
  level: number;
  viewport?: DungeonViewport;
  player_position?: Position;
  entrance_portal?: Position | null;
  ascent?: Position | null;
  descent?: Position | null;
  nearby_loot?: LootState | null;
};

export type EnemyState = {
  name: string;
  display_name?: string;
  health: Resource;
  defense?: number;
  xp_reward?: number;
  statuses?: string[];
};

export type BattleState = {
  active: boolean;
  enemy?: EnemyState | null;
};

export type PendingState = {
  confirmation?: boolean;
};

export type TradeState = {
  merchant: string;
  display_name: string;
  accepted_types?: string[];
  player_items: Item[];
  merchant_items: Item[];
};

export type GameState = {
  scene: SceneName;
  scene_display_name?: string;
  prompt: string;
  player: PlayerState;
  dungeon?: DungeonState | null;
  battle?: BattleState;
  trade?: TradeState | null;
  pending?: PendingState;
};

export type GameEvent = {
  type: string;
  text: string;
  effect?: string;
};

export type GamePayload = {
  game_id?: string;
  state?: GameState;
  events?: GameEvent[];
  response?: {
    text?: string;
    lines?: string[];
  };
};

export type StatePatch = Partial<GameState> & {
  player?: Partial<PlayerState>;
};

export type StandaloneAction =
  | "agree"
  | "attack"
  | "cure"
  | "heal"
  | "help"
  | "inventory"
  | "level"
  | "look"
  | "loot"
  | "no"
  | "reload"
  | "show"
  | "skills"
  | "sleep"
  | "spellbook";

export type TradeLine = {
  item: string;
  quantity: number;
};

export type GameAction =
  | { type: StandaloneAction }
  | { type: "move"; direction: string }
  | { type: "travel"; destination: string }
  | { type: "buy" | "sell" | "equip" | "use" | "drop"; item: string }
  | { type: "cast"; spell: string }
  | { type: "trade"; buy: TradeLine[]; sell: TradeLine[] };

export type SocketStateMessage = {
  type: "state";
  game_id?: string;
  state: GameState;
};

export type SocketEventsMessage = {
  type: "events";
  game_id?: string;
  events?: GameEvent[];
  patch?: StatePatch;
  response?: GamePayload["response"];
};

export type SocketErrorMessage = {
  type: "error";
  error?: {
    code?: string;
    message?: string;
  };
};

export type SocketMessage = SocketStateMessage | SocketEventsMessage | SocketErrorMessage;
