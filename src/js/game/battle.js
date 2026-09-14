import { typeChart } from "../data/type-chart.js";

export function getAttackCategory(pokemon) {
    return pokemon.attack >= pokemon.specialAttack ? "physical" : "special";
}

export function getOffensiveStat(pokemon) {
    const category = getAttackCategory(pokemon);
    return category === "physical" ? pokemon.attack : pokemon.specialAttack;
}

export function getDefensiveStat(pokemon, category) {
    return category === "physical" ? pokemon.defense : pokemon.specialDefense;
}

export function getTypeMultiplier(attackType, defenderTypes) {
    return defenderTypes.reduce((multiplier, defenderType) => {
        const effectiveness = typeChart[attackType]?.[defenderType] ?? 1;
        return multiplier * effectiveness;
    }, 1);
}

export function getBestAttackType(attacker, defender) {
    let bestType = attacker.types[0];
    let bestMultiplier = getTypeMultiplier(bestType, defender.types);
    attacker.types.forEach(type => {
        const multiplier = getTypeMultiplier(type, defender.types);
        if(multiplier > bestMultiplier) {
            bestType = type;
            bestMultiplier = multiplier;
        }
    });
    return {
        type: bestType,
        multiplier: bestMultiplier
    }
}

const ATTACK_MULTIPLIER = 0.50;
const DEFENSE_MULTIPLIER = 0.20;
const BASE_DAMAGE = 20;
const MIN_RANDOM_FACTOR = 0.85;
const MAX_RANDOM_FACTOR = 1;

export function calculateBaseDamage(attacker, defender) {
    const category = getAttackCategory(attacker);
    const offensiveStat = getOffensiveStat(attacker);
    const defensiveStat = getDefensiveStat(defender, category);
    const baseDamage = offensiveStat * ATTACK_MULTIPLIER - defensiveStat * DEFENSE_MULTIPLIER + BASE_DAMAGE;
    const attackType = getBestAttackType(attacker, defender);
    if (attackType.multiplier === 0) {
        return {
            damage: 0,
            type: attackType.type,
            multiplier: 0
        };
    }
    const randomFactor = getRandomDamageFactor();
    const damage = Math.max(5, Math.round(baseDamage * attackType.multiplier * randomFactor));
    return {
        damage,
        type: attackType.type,
        multiplier: attackType.multiplier
    };
}

function getRandomDamageFactor() {
    return (Math.random() * (MAX_RANDOM_FACTOR - MIN_RANDOM_FACTOR) + MIN_RANDOM_FACTOR);
}