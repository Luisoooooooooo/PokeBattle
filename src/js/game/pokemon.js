export function createPokemon(data) {
    const hpStat = data.stats.find(stat => stat.stat.name === "hp");
    const attackStat = data.stats.find(stat => stat.stat.name === "attack");
    const specialAttackStat = data.stats.find(stat => stat.stat.name === "special-attack");
    const defenseStat = data.stats.find(stat => stat.stat.name === "defense");
    const specialDefenseStat = data.stats.find(stat => stat.stat.name === "special-defense");
    const speedStat = data.stats.find(stat => stat.stat.name === "speed");

    const maxHp = hpStat.base_stat;

    return {
        id: data.id,
        name: data.name,
        sprite: data.sprites.front_default,
        types: data.types.map(type => type.type.name),
        maxHp,
        currentHp: maxHp,
        attack: attackStat.base_stat,
        specialAttack: specialAttackStat.base_stat,
        defense: defenseStat.base_stat,
        specialDefense: specialDefenseStat.base_stat,
        speed: speedStat.base_stat,
        fainted: false,
        item: null,
        matchupWins: 0,
        maxRevivesUsed: 0
    };
}