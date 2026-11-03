// Equipos reforzados de los gimnasios a partir de Johto (Kanto usa los originales).
// Se parte del equipo original de cada líder: cada Pokémon pasa a su última evolución
// (solo a formas que ya existían en esa generación) y el equipo se completa con
// evoluciones finales del tipo del líder hasta 3 + medallas / 2 Pokémon (de 3 a 6).
// Los añadidos respetan los mismos niveles de poder que las recompensas por medallas,
// nunca son legendarios ni iniciales, y si el tipo no da para más se mantienen los
// repetidos que ya tenía el equipo original.
// Generado con PokéAPI (/pokemon, /pokemon-species y /evolution-chain).

export const UPGRADED_GYM_TEAMS = {
    // Johto
    1: [
        // Líder Pegaso
        ["mantine", "xatu", "pidgeot"],
        // Líder Antón
        ["butterfree", "beedrill", "scizor"],
        // Líder Blanca
        ["noctowl", "furret", "clefable", "miltank"],
        // Líder Morti
        ["gengar", "gengar", "gengar", "gengar"],
        // Líder Aníbal
        ["heracross", "hitmontop", "machamp", "primeape", "poliwrath"],
        // Líder Yasmina
        ["scizor", "forretress", "skarmory", "magneton", "steelix"],
        // Líder Fredo
        ["delibird", "lapras", "cloyster", "jynx", "dewgong", "piloswine"],
        // Líder Débora
        ["dragonite", "dragonite", "dragonite", "kingdra"]
    ],
    // Hoenn
    2: [
        // Líder Petra
        ["cradily", "golem", "nosepass"],
        // Líder Marcial
        ["breloom", "machamp", "hariyama"],
        // Líder Erico
        ["manectric", "plusle", "magneton", "electrode"],
        // Líder Candela
        ["camerupt", "arcanine", "magcargo", "torkoal"],
        // Líder Norman
        ["exploud", "zangoose", "swellow", "kecleon", "slaking"],
        // Líder Alana
        ["tropius", "swellow", "pelipper", "skarmory", "altaria"],
        // Líderes Vito y Leti
        ["metagross", "gardevoir", "claydol", "grumpig", "lunatone", "solrock"],
        // Líder Plubio
        ["wailord", "luvdisc", "whiscash", "walrein", "seaking", "milotic"]
    ],
    // Sinnoh
    3: [
        // Líder Roco
        ["golem", "steelix", "rampardos"],
        // Líder Gardenia
        ["cherrim", "torterra", "roserade"],
        // Líder Brega
        ["toxicroak", "medicham", "machamp", "lucario"],
        // Líder Mananti
        ["gastrodon", "gyarados", "quagsire", "floatzel"],
        // Líder Fantina
        ["dusknoir", "spiritomb", "drifblim", "gengar", "mismagius"],
        // Líder Acerón
        ["magnezone", "lucario", "bronzong", "steelix", "bastiodon"],
        // Líder Inverna
        ["mamoswine", "glaceon", "froslass", "abomasnow", "weavile", "medicham"],
        // Líder Lectro
        ["electivire", "magnezone", "raichu", "ambipom", "octillery", "luxray"]
    ],
    // Teselia
    4: [
        // Líder Millo
        ["ferrothorn", "stoutland", "simisage"],
        // Líder Aloe
        ["bouffalant", "stoutland", "watchog"],
        // Líder Camus
        ["escavalier", "scolipede", "crustle", "leavanny"],
        // Líder Camila
        ["eelektross", "galvantula", "emolga", "zebstrika"],
        // Líder Yakón
        ["golurk", "stunfisk", "krookodile", "seismitoad", "excadrill"],
        // Líder Gerania
        ["archeops", "braviary", "swoobat", "unfezant", "swanna"],
        // Líder Junco
        ["lapras", "walrein", "mamoswine", "vanilluxe", "cryogonal", "beartic"],
        // Líder Lirio
        ["hydreigon", "dragonite", "salamence", "garchomp", "haxorus", "druddigon"]
    ],
    // Kalos
    5: [
        // Líder Violeta
        ["armaldo", "masquerain", "vivillon"],
        // Líder Lino
        ["golem", "aurorus", "tyrantrum"],
        // Líder Corelia
        ["pangoro", "mienshao", "machamp", "hawlucha"],
        // Líder Amaro
        ["gourgeist-average", "jumpluff", "victreebel", "gogoat"],
        // Líder Lem
        ["dedenne", "electivire", "emolga", "magnezone", "heliolisk"],
        // Líder Valeria
        ["florges", "carbink", "mawile", "mr-mime", "sylveon"],
        // Líder Ástrid
        ["malamar", "metagross", "exeggutor", "sigilyph", "slowking", "meowstic-male"],
        // Líder Édel
        ["aurorus", "lapras", "vanilluxe", "abomasnow", "cryogonal", "avalugg"]
    ],
    // Alola
    6: [
        // Kahuna Kaudan
        ["primeape", "hariyama", "crabominable"],
        // Kahuna Mayla
        ["lycanroc-midday", "probopass", "gigalith", "lycanroc-midnight"],
        // Kahuna Denio
        ["umbreon", "weavile", "sableye", "krookodile", "persian-alola"],
        // Kahuna Hela
        ["palossand", "garchomp", "dugtrio-alola", "gastrodon", "flygon", "mudsdale"]
    ],
    // Galar
    7: [
        // Líder Percy
        ["flapple", "appletun", "eldegoss"],
        // Líder Cathy
        ["seaking", "barraskewda", "drednaw"],
        // Líder Naboru
        ["talonflame", "ninetales", "arcanine", "centiskorch"],
        // Líder Judith
        ["hitmontop", "pangoro", "sirfetchd", "machamp"],
        // Líder Sally
        ["hatterene", "weezing-galar", "mawile", "togekiss", "alcremie"],
        // Líder Morris
        ["kleavor", "barbaracle", "shuckle", "stonjourner", "coalossal"],
        // Líder Nerio
        ["grimmsnarl", "overqwil", "scrafty", "malamar", "skuntank", "obstagoon"],
        // Líder Roy
        ["dragapult", "dracozolt", "gigalith", "flygon", "sandaconda", "duraludon"]
    ],
    // Paldea
    8: [
        // Líder Araceli
        ["lokix", "spidops", "ursaluna"],
        // Líder Brais
        ["lilligant", "arboliva", "sudowoodo"],
        // Líder e-Nigma
        ["kilowattrel", "bellibolt", "luxray", "mismagius"],
        // Líder Fuco
        ["dondozo", "veluza", "wugtrio", "crabominable"],
        // Líder Laureano
        ["farigiraf", "arboliva", "komala", "dudunsparce-two-segment", "staraptor"],
        // Líder Lima
        ["gholdengo", "banette", "mimikyu-disguised", "houndstone", "toxtricity-amped"],
        // Líder Tuli
        ["armarouge", "veluza", "farigiraf", "gardevoir", "espathra", "florges"],
        // Líder Grusha
        ["baxcalibur", "lapras", "frosmoth", "beartic", "cetitan", "altaria"]
    ]
};
