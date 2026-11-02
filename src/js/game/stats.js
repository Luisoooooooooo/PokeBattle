// Estadísticas del modo aventura: totales de toda la aventura y de la región actual

function createTotals() {
    return {
        battlesWon: 0,
        battlesLost: 0,
        knockouts: 0,
        damageDealt: 0,
        moneyEarned: 0,
        moneySpent: 0,
        medicinesUsed: 0,
        pokemonJoined: 0
    };
}

export function createStats() {
    return { run: createTotals(), region: createTotals(), pokemon: {}, regionPokemon: {} };
}

// Las partidas guardadas antes de las estadísticas empiezan a contar desde cero
export function normalizeStats(stats) {
    if (!stats) {
        return createStats();
    }
    return {
        run: { ...createTotals(), ...stats.run },
        region: { ...createTotals(), ...stats.region },
        pokemon: stats.pokemon ?? {},
        regionPokemon: stats.regionPokemon ?? {}
    };
}

export function startRegionStats(stats) {
    stats.region = createTotals();
    stats.regionPokemon = {};
}

export function addStat(stats, key, amount = 1) {
    stats.run[key] += amount;
    stats.region[key] += amount;
}

// Por Pokémon se guardan nombre y sprite para poder mostrarlos aunque ya no estén en el equipo
export function addPokemonStat(stats, pokemon, key, amount = 1) {
    [stats.pokemon, stats.regionPokemon].forEach(bucket => {
        bucket[pokemon.id] ??= { id: pokemon.id, name: pokemon.name, sprite: pokemon.sprite, knockouts: 0, damageDealt: 0 };
        bucket[pokemon.id][key] += amount;
    });
}

// Ordenados de más a menos debilitados; en empate, por daño causado
export function getPokemonRanking(bucket) {
    return Object.values(bucket).sort((a, b) => b.knockouts - a.knockouts || b.damageDealt - a.damageDealt);
}
