echo "export let tergets = [" >src/tergets.ts
crun -l 100000 \
    "\t'https://www\.warcraftlogs\.com/zone/rankings/23\#" \
    "boss\=(2298|2305|2289|2304|2303|2311|2293|2299)" \
    "&metric\=(dps|hps)" \
    "&class\=(" \
    "DeathKnight&spec\=(Blood|Frost|Unholy)|" \
    "Druid&spec\=(Balance|Feral|Guardian|Restoration)|" \
    "Hunter&spec\=(BeastMastery|Marksmanship|Survival)|" \
    "Mage&spec\=(Arcane|Fire|Frost)|" \
    "Monk&spec\=(Brewmaster|Mistweaver|Windwalker)|" \
    "Paladin&spec\=(Holy|Protection|Retribution)|" \
    "Priest&spec\=(Discipline|Holy|Shadow)|" \
    "Rogue&spec\=(Assassination|Subtlety|Outlaw)|" \
    "Shaman&spec\=(Elemental|Enhancement|Restoration)|" \
    "Warlock&spec\=(Affliction|Demonology|Destruction)|" \
    "Warrior&spec\=(Arms|Fury|Protection)|" \
    "DemonHunter&spec\=(Havoc|Vengeance)" \
    ")'," |
    sed 's/ //g' >>src/tergets.ts
echo "]" >>src/tergets.ts
