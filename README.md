# Text Adventures

Text Adventures is a full text dangeon crawler.

Explore the ruins, confront incredible creatures and increase the power of your character.

---

[![Build Status](https://travis-ci.org/alexandreprates/text_adventures.svg?branch=master)](https://travis-ci.org/alexandreprates/text_adventures)
[![Coverage Status](https://coveralls.io/repos/github/alexandreprates/text_adventures/badge.svg?branch=master)](https://coveralls.io/github/alexandreprates/text_adventures?branch=master)
[![Inline docs](http://inch-ci.org/github/alexandreprates/text_adventures.svg?branch=master)](http://inch-ci.org/github/alexandreprates/text_adventures)

# Index

**Planned Gameplay**

[Town](#towm)

[Shopping](#shopping)

[Dungeon](#dungeon)

[Battle](#battle)

[Cast Speel](#cast-speel)

[Looting](#looting)

[Learn Speel](#learn-speel)

**Attributes, levels and classes**

[Attributes](#attributes)

[Levels](#levels)

[Classes](#classes)

---

# Planned Gameplay

## Town

```
  Welcome to Text Adventures

  You are now on the town of Nee'Peh

  Here you can:
    go Tavern - small talk, some Ale and Potions
    go Aluriel's Priest - here you can cure deseases, recover health, buy and sell tomes
    go Blacksmith - buy or sell weapons
    go Armorsmith - buy  or sell armors
    go Ruins - where your adventure begins

  What will you do now?
```

## Shopping

```
  _go blacksmith_
  Welcome, adventurer to buy or sell weapons here is the right place!

  That you want:
  show - view merchant goods
  buy <item> - buy something
  sell <item> - sell item

  _sell sword_
  Well i can give you 10g for this Sword (Atk: 10).

  That you want:
  agree - sell item
  no - keep item

  _agree_
  You sold Sword (Atk: 10) at 10g.
  [1x Sword (Atk: 10) removed to inventory]
  [your gold is now 120]

  _sell leather armor_
  Sorry bud, but I have no interest in this item.

  _show_
  Here bud, take a look at these incredible goods!
  1x Sword (Atk: 10) - 15g
  1x Bastard Sword (Atk: 25) - 30g
  1x Spear (Atk: 22, Def: 5) - 50g
  1x King's Nep Sword (Atk: 50) - 500g

  _buy king nep's sword_
  Sorry but you dont have enough money for this.

  _buy spear_
  Excellent choice its yours for mere 50g.

  Select your answer:
  agree - buy it
  no - forget it

  _agree_
  You bought Spear (Atk: 22, Def: 5).
  [1x Spear (Atk: 22, Def: 5) added to inventory]
  [your gold is now 70]

  _bye_
```

## Dungeon

```
  You are now inside the Ruins Level 1

  Here you can:
  go <up|right|down|left> - to move around
  look - to examine your surroundings
  attack - to attack an enemy (yes this really is an adventure)
  spellbook - show the spells you can cast
  cast <spell> - to cast a powerfull spell
  loot - to collect your prize after the battle
  invetory - to show what you carry in our bags
  equip <item> - to equip item
  use <item> - to use item
  drop <item> - to leave an item (not everything is helpfull)

  ######  <- this is the dungeon wall
  ######
  ## x    <- this is you
  ######
  ######

  Good luck and have a great adventure!
```

## Battle

```
  _look_
  You see a Giant Spider
  A Giant Spider is about to attack you!

  _attack_
  You Slash a Giant Spider with Bastard Sword causing 10 of damage.
  The Giant Spider attacks you with a Bite causing 3 of damage.
  [your life is now 23]

  _cast fireball_
  You burn Giant Spider with fireball causing 30 of damage.
  The Giant Spider attacks you with Poison Bite causing 1 of damage, and Poison you!
  [your life is now 22]

  _attack_
  You Slash (Critical hit) a Giant Spider with Bastard Sword causing 25 of damage.
  The Giant Spider die.
  You feel the effect of Poison! You lost 2 hp.
  [your life is now 20]
```

## Cast Speel

```
  _spell cure_
  The effect of Poison is over.

  _spell heal_
  You feel the effect of Heal!
  [your life is now 33]
```

## Looting

```
  _loot_
  You found a Tome of freezing.
  [Tome of freezing added to inventory]
```

# Learn Speel

```
  _inventory_
  currently you have:
  1x Sword (Atk: 10)
  2x Tome of Ice Bolt
  3x Potion of Heal (Recovery 20 Health)
  1x Leather Armor (Def: 20)

  _use tome of ice bolt_
  You learn spell Ice Bolt (level 1) - Freeze you enemy casing 5~10 of ice damage,
  with 2% chance to freeze your enemy

  _spellbook_
  Your can cast:
  1x Heal (level 1) - Recovery 10~30 of health
  1x Fireball (level 1) - Burn your enemy causes 12~22 of fire damage
  1x Ice Bolt (level 1) - Freeze your enemy causes 5~10 of ice damage, with 2% chance
  to freeze your enemy

  _use tome of ice bolt_
  You learn spell Ice Bolt (level 2) - Freeze your enemy causes 8~18 of ice damage,
  with 3% chance to freeze your enemy

  _spellbook_
  Your can cast:
  1x Heal (level 1) - Recovery 10~30 of health
  1x Fireball (level 1) - Burn your enemy cause 12~22 of fire damage
  2x Ice Bolt (level 2) - Freeze you enemy casing 8~18 of ice damage, with 3% chance
  to freeze your enemy
```

# Attributes, levels and classes

Explain here

## Attributes

Level -
HP    -
MP    -
STR   -
DEX   -
INT   -

## Levels

XP    -
Melee -
Range -
Magic -

# Classes

Warrior
Mage
Paladin
Battle-mage
