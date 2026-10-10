import { PixelIcon, type PixelIconKind } from "./PixelIcon";
import "./DungeonActions.css";

type DungeonActionsProps = {
  primaryLabel: string;
  primaryAccessibleLabel?: string;
  primaryIcon: PixelIconKind;
  potions: number;
  healDisabled: boolean;
  healHint: string;
  townDisabled: boolean;
  townHint: string;
  onPrimary: () => void;
  onHeal: () => void;
  onTown: () => void;
};

export function DungeonActions({
  primaryLabel,
  primaryAccessibleLabel,
  primaryIcon,
  potions,
  healDisabled,
  healHint,
  townDisabled,
  townHint,
  onPrimary,
  onHeal,
  onTown,
}: DungeonActionsProps) {
  return (
    <div className="dungeon-actions" aria-label="Dungeon actions">
      <button
        type="button"
        className="dungeon-primary"
        aria-label={primaryAccessibleLabel}
        onClick={onPrimary}
      >
        <PixelIcon kind={primaryIcon} />
        {primaryLabel}
      </button>
      <button
        type="button"
        disabled={healDisabled}
        title={healHint}
        onClick={onHeal}
      >
        <PixelIcon kind="potion" />
        Heal <span className="dungeon-potion-count">{potions}</span>
      </button>
      <button
        type="button"
        disabled={townDisabled}
        title={townHint}
        onClick={onTown}
      >
        <PixelIcon kind="gate" />
        Town
      </button>
    </div>
  );
}
