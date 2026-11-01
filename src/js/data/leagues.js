// Líderes, Liga y campeón de cada región, con los equipos de su juego original
// (Rojo/Azul, Oro/Plata, Rubí/Zafiro, Diamante/Perla, Negro/Blanco, X/Y, Sol/Luna,
// Espada y Escarlata/Púrpura). Los Pokémon van con su nombre de PokéAPI.
// Un entrenador con "teams" en vez de "team" cambia de equipo según el inicial elegido:
// el índice es el del inicial (0 Planta, 1 Fuego, 2 Agua).
// Sprites: Pokémon Showdown (play.pokemonshowdown.com/sprites/trainers).

const sprite = key => `./src/assets/leaders/${key}.png`;

export const LEAGUES = [
    {
        region: "Kanto",
        gymLabel: "Gimnasio",
        leagueLabel: "Alto Mando",
        leagueTo: "al Alto Mando",
        leagueOf: "del Alto Mando",
        gyms: [
            { name: "Líder Brock", sprite: sprite("brock"), type: "rock", team: ["geodude", "onix"] },
            { name: "Líder Misty", sprite: sprite("misty"), type: "water", team: ["staryu", "starmie"] },
            { name: "Líder Teniente Surge", sprite: sprite("ltsurge"), type: "electric", team: ["voltorb", "pikachu", "raichu"] },
            { name: "Líder Erika", sprite: sprite("erika"), type: "grass", team: ["victreebel", "tangela", "vileplume"] },
            { name: "Líder Koga", sprite: sprite("koga"), type: "poison", team: ["koffing", "muk", "koffing", "weezing"] },
            { name: "Líder Sabrina", sprite: sprite("sabrina"), type: "psychic", team: ["kadabra", "mr-mime", "venomoth", "alakazam"] },
            { name: "Líder Blaine", sprite: sprite("blaine"), type: "fire", team: ["growlithe", "ponyta", "rapidash", "arcanine"] },
            { name: "Líder Giovanni", sprite: sprite("giovanni"), type: "ground", team: ["rhyhorn", "dugtrio", "nidoqueen", "nidoking", "rhydon"] }
        ],
        league: [
            { name: "Alto Mando Lorelei", sprite: sprite("lorelei-gen3"), type: "ice", team: ["dewgong", "cloyster", "slowbro", "jynx", "lapras"] },
            { name: "Alto Mando Bruno", sprite: sprite("bruno"), type: "fighting", team: ["onix", "hitmonchan", "hitmonlee", "onix", "machamp"] },
            { name: "Alto Mando Agatha", sprite: sprite("agatha-gen3"), type: "ghost", team: ["gengar", "golbat", "haunter", "arbok", "gengar"] },
            { name: "Alto Mando Lance", sprite: sprite("lance"), type: "dragon", team: ["gyarados", "dragonair", "dragonair", "aerodactyl", "dragonite"] }
        ],
        champion: {
            name: "Campeón Azul",
            sprite: sprite("blue"),
            teams: [
                ["pidgeot", "alakazam", "rhydon", "exeggutor", "gyarados", "charizard"],
                ["pidgeot", "alakazam", "rhydon", "arcanine", "exeggutor", "blastoise"],
                ["pidgeot", "alakazam", "rhydon", "gyarados", "arcanine", "venusaur"]
            ]
        }
    },
    {
        region: "Johto",
        gymLabel: "Gimnasio",
        leagueLabel: "Alto Mando",
        leagueTo: "al Alto Mando",
        leagueOf: "del Alto Mando",
        gyms: [
            { name: "Líder Pegaso", sprite: sprite("falkner"), type: "flying", team: ["pidgey", "pidgeotto"] },
            { name: "Líder Antón", sprite: sprite("bugsy"), type: "bug", team: ["metapod", "kakuna", "scyther"] },
            { name: "Líder Blanca", sprite: sprite("whitney"), type: "normal", team: ["clefairy", "miltank"] },
            { name: "Líder Morti", sprite: sprite("morty"), type: "ghost", team: ["gastly", "haunter", "haunter", "gengar"] },
            { name: "Líder Aníbal", sprite: sprite("chuck"), type: "fighting", team: ["primeape", "poliwrath"] },
            { name: "Líder Yasmina", sprite: sprite("jasmine"), type: "steel", team: ["magnemite", "magnemite", "steelix"] },
            { name: "Líder Fredo", sprite: sprite("pryce"), type: "ice", team: ["seel", "dewgong", "piloswine"] },
            { name: "Líder Débora", sprite: sprite("clair"), type: "dragon", team: ["dragonair", "dragonair", "dragonair", "kingdra"] }
        ],
        league: [
            { name: "Alto Mando Mento", sprite: sprite("will"), type: "psychic", team: ["xatu", "jynx", "exeggutor", "slowbro", "xatu"] },
            { name: "Alto Mando Koga", sprite: sprite("koga"), type: "poison", team: ["ariados", "venomoth", "forretress", "muk", "crobat"] },
            { name: "Alto Mando Bruno", sprite: sprite("bruno"), type: "fighting", team: ["hitmontop", "hitmonlee", "hitmonchan", "onix", "machamp"] },
            { name: "Alto Mando Karen", sprite: sprite("karen"), type: "dark", team: ["umbreon", "vileplume", "gengar", "murkrow", "houndoom"] }
        ],
        champion: { name: "Campeón Lance", sprite: sprite("lance"), team: ["gyarados", "dragonite", "dragonite", "aerodactyl", "charizard", "dragonite"] }
    },
    {
        region: "Hoenn",
        gymLabel: "Gimnasio",
        leagueLabel: "Alto Mando",
        leagueTo: "al Alto Mando",
        leagueOf: "del Alto Mando",
        gyms: [
            { name: "Líder Petra", sprite: sprite("roxanne"), type: "rock", team: ["geodude", "nosepass"] },
            { name: "Líder Marcial", sprite: sprite("brawly"), type: "fighting", team: ["machop", "makuhita"] },
            { name: "Líder Erico", sprite: sprite("wattson"), type: "electric", team: ["magnemite", "voltorb", "magneton"] },
            { name: "Líder Candela", sprite: sprite("flannery"), type: "fire", team: ["slugma", "slugma", "torkoal"] },
            { name: "Líder Norman", sprite: sprite("norman"), type: "normal", team: ["slaking", "vigoroth", "slaking"] },
            { name: "Líder Alana", sprite: sprite("winona"), type: "flying", team: ["swellow", "pelipper", "skarmory", "altaria"] },
            { name: "Líderes Vito y Leti", sprite: sprite("tateandliza-gen6"), type: "psychic", team: ["lunatone", "solrock"] },
            { name: "Líder Plubio", sprite: sprite("wallace"), type: "water", team: ["luvdisc", "whiscash", "sealeo", "seaking", "milotic"] }
        ],
        league: [
            { name: "Alto Mando Sixto", sprite: sprite("sidney"), type: "dark", team: ["mightyena", "shiftry", "cacturne", "crawdaunt", "absol"] },
            { name: "Alto Mando Fátima", sprite: sprite("phoebe-gen6"), type: "ghost", team: ["dusclops", "banette", "sableye", "banette", "dusclops"] },
            { name: "Alto Mando Nívea", sprite: sprite("glacia"), type: "ice", team: ["sealeo", "glalie", "sealeo", "glalie", "walrein"] },
            { name: "Alto Mando Dracón", sprite: sprite("drake-gen3"), type: "dragon", team: ["shelgon", "altaria", "kingdra", "flygon", "salamence"] }
        ],
        champion: { name: "Campeón Máximo", sprite: sprite("steven"), team: ["skarmory", "claydol", "aggron", "cradily", "armaldo", "metagross"] }
    },
    {
        region: "Sinnoh",
        gymLabel: "Gimnasio",
        leagueLabel: "Alto Mando",
        leagueTo: "al Alto Mando",
        leagueOf: "del Alto Mando",
        gyms: [
            { name: "Líder Roco", sprite: sprite("roark"), type: "rock", team: ["geodude", "onix", "cranidos"] },
            { name: "Líder Gardenia", sprite: sprite("gardenia"), type: "grass", team: ["cherubi", "turtwig", "roserade"] },
            { name: "Líder Brega", sprite: sprite("maylene"), type: "fighting", team: ["meditite", "machoke", "lucario"] },
            { name: "Líder Mananti", sprite: sprite("crasherwake"), type: "water", team: ["gyarados", "quagsire", "floatzel"] },
            { name: "Líder Fantina", sprite: sprite("fantina"), type: "ghost", team: ["drifblim", "gengar", "mismagius"] },
            { name: "Líder Acerón", sprite: sprite("byron"), type: "steel", team: ["bronzor", "steelix", "bastiodon"] },
            { name: "Líder Inverna", sprite: sprite("candice"), type: "ice", team: ["snover", "sneasel", "medicham", "abomasnow"] },
            { name: "Líder Lectro", sprite: sprite("volkner"), type: "electric", team: ["raichu", "ambipom", "octillery", "luxray"] }
        ],
        league: [
            { name: "Alto Mando Alecrán", sprite: sprite("aaron"), type: "bug", team: ["dustox", "beautifly", "vespiquen", "heracross", "drapion"] },
            { name: "Alto Mando Gaia", sprite: sprite("bertha"), type: "ground", team: ["quagsire", "sudowoodo", "golem", "whiscash", "hippowdon"] },
            { name: "Alto Mando Fausto", sprite: sprite("flint"), type: "fire", team: ["rapidash", "steelix", "drifblim", "lopunny", "infernape"] },
            { name: "Alto Mando Delos", sprite: sprite("lucian"), type: "psychic", team: ["mr-mime", "girafarig", "medicham", "alakazam", "bronzong"] }
        ],
        champion: { name: "Campeona Cintia", sprite: sprite("cynthia"), team: ["spiritomb", "roserade", "gastrodon", "lucario", "milotic", "garchomp"] }
    },
    {
        region: "Teselia",
        gymLabel: "Gimnasio",
        leagueLabel: "Alto Mando",
        leagueTo: "al Alto Mando",
        leagueOf: "del Alto Mando",
        gyms: [
            { name: "Líder Millo", sprite: sprite("cilan"), type: "grass", team: ["lillipup", "pansage"] },
            { name: "Líder Aloe", sprite: sprite("lenora"), type: "normal", team: ["herdier", "watchog"] },
            { name: "Líder Camus", sprite: sprite("burgh"), type: "bug", team: ["whirlipede", "dwebble", "leavanny"] },
            { name: "Líder Camila", sprite: sprite("elesa"), type: "electric", team: ["emolga", "emolga", "zebstrika"] },
            { name: "Líder Yakón", sprite: sprite("clay"), type: "ground", team: ["krokorok", "palpitoad", "excadrill"] },
            { name: "Líder Gerania", sprite: sprite("skyla"), type: "flying", team: ["swoobat", "unfezant", "swanna"] },
            { name: "Líder Junco", sprite: sprite("brycen"), type: "ice", team: ["vanillish", "cryogonal", "beartic"] },
            { name: "Líder Lirio", sprite: sprite("drayden"), type: "dragon", team: ["fraxure", "druddigon", "haxorus"] }
        ],
        league: [
            { name: "Alto Mando Anís", sprite: sprite("shauntal"), type: "ghost", team: ["cofagrigus", "jellicent-male", "golurk", "chandelure"] },
            { name: "Alto Mando Aza", sprite: sprite("grimsley"), type: "dark", team: ["scrafty", "liepard", "krookodile", "bisharp"] },
            { name: "Alto Mando Catleya", sprite: sprite("caitlin"), type: "psychic", team: ["reuniclus", "musharna", "sigilyph", "gothitelle"] },
            { name: "Alto Mando Lotto", sprite: sprite("marshal"), type: "fighting", team: ["throh", "sawk", "conkeldurr", "mienshao"] }
        ],
        champion: { name: "Campeón Mirto", sprite: sprite("alder"), team: ["accelgor", "bouffalant", "druddigon", "vanilluxe", "escavalier", "volcarona"] }
    },
    {
        region: "Kalos",
        gymLabel: "Gimnasio",
        leagueLabel: "Alto Mando",
        leagueTo: "al Alto Mando",
        leagueOf: "del Alto Mando",
        gyms: [
            { name: "Líder Violeta", sprite: sprite("viola"), type: "bug", team: ["surskit", "vivillon"] },
            { name: "Líder Lino", sprite: sprite("grant"), type: "rock", team: ["amaura", "tyrunt"] },
            { name: "Líder Corelia", sprite: sprite("korrina"), type: "fighting", team: ["mienfoo", "machoke", "hawlucha"] },
            { name: "Líder Amaro", sprite: sprite("ramos"), type: "grass", team: ["jumpluff", "weepinbell", "gogoat"] },
            { name: "Líder Lem", sprite: sprite("clemont"), type: "electric", team: ["emolga", "magneton", "heliolisk"] },
            { name: "Líder Valeria", sprite: sprite("valerie"), type: "fairy", team: ["mawile", "mr-mime", "sylveon"] },
            { name: "Líder Ástrid", sprite: sprite("olympia"), type: "psychic", team: ["sigilyph", "slowking", "meowstic-male"] },
            { name: "Líder Édel", sprite: sprite("wulfric"), type: "ice", team: ["abomasnow", "cryogonal", "avalugg"] }
        ],
        league: [
            { name: "Alto Mando Malva", sprite: sprite("malva"), type: "fire", team: ["pyroar-male", "torkoal", "chandelure", "talonflame"] },
            { name: "Alto Mando Narciso", sprite: sprite("siebold"), type: "water", team: ["clawitzer", "gyarados", "starmie", "barbaracle"] },
            { name: "Alto Mando Tileo", sprite: sprite("wikstrom"), type: "steel", team: ["klefki", "probopass", "scizor", "aegislash-shield"] },
            { name: "Alto Mando Drácena", sprite: sprite("drasna"), type: "dragon", team: ["dragalge", "druddigon", "altaria", "noivern"] }
        ],
        champion: { name: "Campeona Dianta", sprite: sprite("diantha"), team: ["hawlucha", "tyrantrum", "aurorus", "gourgeist-average", "goodra", "gardevoir"] }
    },
    {
        region: "Alola",
        gymLabel: "Gran prueba",
        leagueLabel: "Alto Mando",
        leagueTo: "al Alto Mando",
        leagueOf: "del Alto Mando",
        gyms: [
            { name: "Kahuna Kaudan", sprite: sprite("hala"), type: "fighting", team: ["mankey", "makuhita", "crabrawler"] },
            { name: "Kahuna Mayla", sprite: sprite("olivia"), type: "rock", team: ["nosepass", "boldore", "lycanroc-midnight"] },
            { name: "Kahuna Denio", sprite: sprite("nanu"), type: "dark", team: ["sableye", "krokorok", "persian-alola"] },
            { name: "Kahuna Hela", sprite: sprite("hapu"), type: "ground", team: ["dugtrio-alola", "gastrodon", "flygon", "mudsdale"] }
        ],
        league: [
            { name: "Alto Mando Kaudan", sprite: sprite("hala"), type: "fighting", team: ["hariyama", "primeape", "bewear", "poliwrath", "crabominable"] },
            { name: "Alto Mando Mayla", sprite: sprite("olivia"), type: "rock", team: ["relicanth", "carbink", "golem-alola", "probopass", "lycanroc-midnight"] },
            { name: "Alto Mando Zarala", sprite: sprite("acerola"), type: "ghost", team: ["sableye", "drifblim", "dhelmise", "froslass", "palossand"] },
            { name: "Alto Mando Kahili", sprite: sprite("kahili"), type: "flying", team: ["skarmory", "crobat", "oricorio-baile", "mandibuzz", "toucannon"] }
        ],
        champion: {
            name: "Profesor Kukui",
            sprite: sprite("kukui"),
            teams: [
                ["lycanroc-midday", "ninetales-alola", "braviary", "magnezone", "snorlax", "primarina"],
                ["lycanroc-midday", "ninetales-alola", "braviary", "magnezone", "snorlax", "decidueye"],
                ["lycanroc-midday", "ninetales-alola", "braviary", "magnezone", "snorlax", "incineroar"]
            ]
        }
    },
    {
        region: "Galar",
        gymLabel: "Gimnasio",
        leagueLabel: "Copa de Campeones",
        leagueTo: "a la Copa de Campeones",
        leagueOf: "de la Copa de Campeones",
        gyms: [
            { name: "Líder Percy", sprite: sprite("milo"), type: "grass", team: ["gossifleur", "eldegoss"] },
            { name: "Líder Cathy", sprite: sprite("nessa"), type: "water", team: ["goldeen", "arrokuda", "drednaw"] },
            { name: "Líder Naboru", sprite: sprite("kabu"), type: "fire", team: ["ninetales", "arcanine", "centiskorch"] },
            { name: "Líder Judith", sprite: sprite("bea"), type: "fighting", team: ["hitmontop", "pangoro", "sirfetchd", "machamp"] },
            { name: "Líder Sally", sprite: sprite("opal"), type: "fairy", team: ["weezing-galar", "mawile", "togekiss", "alcremie"] },
            { name: "Líder Morris", sprite: sprite("gordie"), type: "rock", team: ["barbaracle", "shuckle", "stonjourner", "coalossal"] },
            { name: "Líder Nerio", sprite: sprite("piers"), type: "dark", team: ["scrafty", "malamar", "skuntank", "obstagoon"] },
            { name: "Líder Roy", sprite: sprite("raihan"), type: "dragon", team: ["gigalith", "flygon", "sandaconda", "duraludon"] }
        ],
        league: [
            { name: "Rival Roxy", sprite: sprite("marnie"), type: "dark", team: ["liepard", "toxicroak", "scrafty", "morpeko-full-belly", "grimmsnarl"] },
            {
                name: "Rival Paul",
                sprite: sprite("hop"),
                type: null,
                teams: [
                    ["dubwool", "corviknight", "pincurchin", "snorlax", "cinderace"],
                    ["dubwool", "corviknight", "pincurchin", "snorlax", "inteleon"],
                    ["dubwool", "corviknight", "pincurchin", "snorlax", "rillaboom"]
                ]
            },
            { name: "Líder Cathy", sprite: sprite("nessa"), type: "water", team: ["golisopod", "pelipper", "barraskewda", "seaking", "drednaw"] },
            { name: "Líder Judith", sprite: sprite("bea"), type: "fighting", team: ["hawlucha", "grapploct", "sirfetchd", "falinks", "machamp"] },
            { name: "Líder Roy", sprite: sprite("raihan"), type: "dragon", team: ["torkoal", "goodra", "turtonator", "flygon", "duraludon"] }
        ],
        champion: {
            name: "Campeón Lionel",
            sprite: sprite("leon"),
            teams: [
                ["aegislash-shield", "dragapult", "haxorus", "rhyperior", "cinderace", "charizard"],
                ["aegislash-shield", "dragapult", "haxorus", "seismitoad", "inteleon", "charizard"],
                ["aegislash-shield", "dragapult", "haxorus", "mr-rime", "rillaboom", "charizard"]
            ]
        }
    },
    {
        region: "Paldea",
        gymLabel: "Gimnasio",
        leagueLabel: "Alto Mando",
        leagueTo: "al Alto Mando",
        leagueOf: "del Alto Mando",
        gyms: [
            { name: "Líder Araceli", sprite: sprite("katy"), type: "bug", team: ["nymble", "tarountula", "teddiursa"] },
            { name: "Líder Brais", sprite: sprite("brassius"), type: "grass", team: ["petilil", "smoliv", "sudowoodo"] },
            { name: "Líder e-Nigma", sprite: sprite("iono"), type: "electric", team: ["wattrel", "bellibolt", "luxio", "mismagius"] },
            { name: "Líder Fuco", sprite: sprite("kofu"), type: "water", team: ["veluza", "wugtrio", "crabominable"] },
            { name: "Líder Laureano", sprite: sprite("larry"), type: "normal", team: ["komala", "dudunsparce-two-segment", "staraptor"] },
            { name: "Líder Lima", sprite: sprite("ryme"), type: "ghost", team: ["banette", "mimikyu-disguised", "houndstone", "toxtricity-amped"] },
            { name: "Líder Tuli", sprite: sprite("tulip"), type: "psychic", team: ["farigiraf", "gardevoir", "espathra", "florges"] },
            { name: "Líder Grusha", sprite: sprite("grusha"), type: "ice", team: ["frosmoth", "beartic", "cetitan", "altaria"] }
        ],
        league: [
            { name: "Alto Mando Cayena", sprite: sprite("rika"), type: "ground", team: ["whiscash", "camerupt", "donphan", "dugtrio", "clodsire"] },
            { name: "Alto Mando Pola", sprite: sprite("poppy"), type: "steel", team: ["copperajah", "magnezone", "bronzong", "corviknight", "tinkaton"] },
            { name: "Alto Mando Laureano", sprite: sprite("larry"), type: "flying", team: ["tropius", "oricorio-baile", "altaria", "staraptor", "flamigo"] },
            { name: "Alto Mando Hesperio", sprite: sprite("hassel"), type: "dragon", team: ["noivern", "haxorus", "dragalge", "flapple", "baxcalibur"] }
        ],
        champion: { name: "Campeona Ságita", sprite: sprite("geeta"), team: ["espathra", "gogoat", "veluza", "avalugg", "kingambit", "glimmora"] }
    }
];
