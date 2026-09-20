import { typeChart } from "../data/type-chart.js";

export function getAttackCategory(pokemon) {
    return pokemon.attack >= pokemon.specialAttack ? "physical" : "special";
}

export function getOffensiveStat(pokemon) {
    const category = getAttackCategory(pokemon);
    let offensiveStat = category === "physical" ? pokemon.attack : pokemon.specialAttack;
    if (pokemon.item?.effect === "choice-band") {
        offensiveStat *= 1.5;
    }
    return offensiveStat;
}

export function getDefensiveStat(pokemon, category) {
    let defensiveStat = category === "physical" ? pokemon.defense : pokemon.specialDefense;
    if (pokemon.item?.effect === "assault-vest") {
        defensiveStat *= 1.5;
    }
    return defensiveStat;
}

export function getEffectiveSpeed(pokemon) {
    let speed = pokemon.speed;
    if (pokemon.item?.effect === "choice-scarf") {
        speed *= 1.5;
    }
    return speed;
}

export function getFirstAttacker(pokemonA, pokemonB) {
    const pokemonAQuickClaw = pokemonA.item?.effect === "quick-claw" && Math.random() < 0.20;
    const pokemonBQuickClaw = pokemonB.item?.effect === "quick-claw" && Math.random() < 0.20;
    if (pokemonAQuickClaw && !pokemonBQuickClaw) {
        return pokemonA;
    }
    if (pokemonBQuickClaw && !pokemonAQuickClaw) {
        return pokemonB;
    }
    const pokemonASpeed = getEffectiveSpeed(pokemonA);
    const pokemonBSpeed = getEffectiveSpeed(pokemonB);
    if (pokemonASpeed > pokemonBSpeed) {
        return pokemonA;
    }
    if (pokemonBSpeed > pokemonASpeed) {
        return pokemonB;
    }
    return Math.random() < 0.5 ? pokemonA : pokemonB;
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
        if (multiplier > bestMultiplier) {
            bestType = type;
            bestMultiplier = multiplier;
        }
    });
    return {
        type: bestType,
        multiplier: bestMultiplier
    };
}

const ATTACK_MULTIPLIER = 0.50;
const DEFENSE_MULTIPLIER = 0.20;
const BASE_DAMAGE = 20;
const MIN_RANDOM_FACTOR = 0.85;
const MAX_RANDOM_FACTOR = 1;
const MAX_MATCHUP_TURNS = 1000;

export function getDamageMultiplier(pokemon, attackType) {
    let multiplier = 1;
    if (pokemon.item?.effect === "life-orb") {
        multiplier *= 1.3;
    }
    if (pokemon.item?.effect === "type-boost" && pokemon.item.boostType === attackType) {
        multiplier *= 1.2;
    }
    return multiplier;
}

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
    const itemMultiplier = getDamageMultiplier(attacker, attackType.type);
    const randomFactor = getRandomDamageFactor();
    const damage = Math.max(5, Math.round(baseDamage * attackType.multiplier * itemMultiplier * randomFactor));
    return {
        damage,
        type: attackType.type,
        multiplier: attackType.multiplier
    };
}

function calculateStruggleDamage(attacker, defender) {
    const category = getAttackCategory(attacker);
    const offensiveStat = getOffensiveStat(attacker);
    const defensiveStat = getDefensiveStat(defender, category);
    const baseDamage = offensiveStat * ATTACK_MULTIPLIER - defensiveStat * DEFENSE_MULTIPLIER + BASE_DAMAGE;
    const randomFactor = getRandomDamageFactor();
    return Math.max(5, Math.round(baseDamage * randomFactor));
}

function applyLifeOrbRecoil(pokemon) {
    if (pokemon.item?.effect !== "life-orb") {
        return 0;
    }
    const recoil = Math.max(1, Math.floor(pokemon.maxHp * 0.10));
    pokemon.currentHp = Math.max(0, pokemon.currentHp - recoil);
    pokemon.fainted = pokemon.currentHp === 0;
    return recoil;
}

function applyRockyHelmet(attacker, defender) {
    if (defender.item?.effect !== "rocky-helmet") {
        return 0;
    }
    const damage = Math.max(1, Math.floor(attacker.maxHp / 6));
    attacker.currentHp = Math.max(0, attacker.currentHp - damage);
    attacker.fainted = attacker.currentHp === 0;
    return damage;
}

function applySitrusBerry(pokemon) {
    if (pokemon.item?.effect !== "sitrus-berry" || pokemon.currentHp === 0 || pokemon.currentHp > pokemon.maxHp / 2) {
        return 0;
    }
    const healing = Math.max(1, Math.floor(pokemon.maxHp * 0.25));
    pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + healing);
    pokemon.item = null;
    return healing;
}

export function applyLeftovers(pokemon) {
    if (pokemon.item?.effect !== "leftovers" || pokemon.fainted || pokemon.currentHp === pokemon.maxHp) {
        return 0;
    }
    const healing = Math.max(1, Math.floor(pokemon.maxHp / 16));
    const previousHp = pokemon.currentHp;
    pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + healing);
    return pokemon.currentHp - previousHp;
}

export function applyMaxRevive(pokemon) {
    if (pokemon.item?.effect !== "max-revive" || !pokemon.fainted) {
        return false;
    }
    pokemon.currentHp = pokemon.maxHp;
    pokemon.fainted = false;
    pokemon.item = null;
    return true;
}

export function executeAttack(attacker, defender) {
    const attackResult = calculateBaseDamage(attacker, defender);
    const defenderHpBeforeAttack = defender.currentHp;
    const wouldFaint = attackResult.damage >= defender.currentHp;
    const focusBandActivated = wouldFaint && defender.item?.effect === "focus-band" && Math.random() < 0.10;
    if (focusBandActivated) {
        defender.currentHp = 1;
    } else {
        defender.currentHp = Math.max(0, defender.currentHp - attackResult.damage);
    }
    defender.fainted = defender.currentHp === 0;
    const damageDealt = defenderHpBeforeAttack - defender.currentHp;
    const defenderHpAfterAttack = defender.currentHp;
    const rockyHelmetDamage = damageDealt > 0 ? applyRockyHelmet(attacker, defender) : 0;
    const attackerHpAfterRockyHelmet = attacker.currentHp;
    const sitrusHealing = applySitrusBerry(defender);
    const defenderHpAfterSitrus = defender.currentHp;
    const lifeOrbRecoil = attackResult.damage > 0 ? applyLifeOrbRecoil(attacker) : 0;
    const attackerHpAfterLifeOrb = attacker.currentHp;
    return {
        attacker,
        defender,
        damage: attackResult.damage,
        type: attackResult.type,
        multiplier: attackResult.multiplier,
        defenderHpBeforeAttack,
        defenderCurrentHp: defenderHpAfterAttack,
        defenderFainted: defender.fainted,
        focusBandActivated,
        rockyHelmetDamage,
        attackerHpAfterRockyHelmet,
        sitrusHealing,
        defenderHpAfterSitrus,
        lifeOrbRecoil,
        attackerHpAfterLifeOrb,
        damageDealt
    };
}

function executeStruggleAttack(attacker, defender) {
    const damage = calculateStruggleDamage(attacker, defender);
    const defenderHpBeforeAttack = defender.currentHp;
    const wouldFaint = damage >= defender.currentHp;
    const focusBandActivated = wouldFaint && defender.item?.effect === "focus-band" && Math.random() < 0.10;
    if (focusBandActivated) {
        defender.currentHp = 1;
    } else {
        defender.currentHp = Math.max(0, defender.currentHp - damage);
    }
    defender.fainted = defender.currentHp === 0;
    const damageDealt = defenderHpBeforeAttack - defender.currentHp;
    const defenderHpAfterAttack = defender.currentHp;
    const rockyHelmetDamage = damageDealt > 0 ? applyRockyHelmet(attacker, defender) : 0;
    const attackerHpAfterRockyHelmet = attacker.currentHp;
    const sitrusHealing = applySitrusBerry(defender);
    const defenderHpAfterSitrus = defender.currentHp;
    return {
        attacker,
        defender,
        damage,
        type: "struggle",
        multiplier: 1,
        defenderHpBeforeAttack,
        defenderCurrentHp: defenderHpAfterAttack,
        defenderFainted: defender.fainted,
        focusBandActivated,
        rockyHelmetDamage,
        attackerHpAfterRockyHelmet,
        sitrusHealing,
        defenderHpAfterSitrus,
        lifeOrbRecoil: 0,
        attackerHpAfterLifeOrb: attacker.currentHp,
        damageDealt
    };
}

function areMutuallyImmune(pokemonA, pokemonB) {
    const pokemonAAttack = getBestAttackType(pokemonA, pokemonB);
    const pokemonBAttack = getBestAttackType(pokemonB, pokemonA);
    return pokemonAAttack.multiplier === 0 && pokemonBAttack.multiplier === 0;
}

export function executeTurn(pokemonA, pokemonB, useStruggle = false) {
    const firstAttacker = getFirstAttacker(pokemonA, pokemonB);
    const secondAttacker = firstAttacker === pokemonA ? pokemonB : pokemonA;
    const attacks = [];
    const firstAttackResult = useStruggle ? executeStruggleAttack(firstAttacker, secondAttacker) : executeAttack(firstAttacker, secondAttacker);
    attacks.push(firstAttackResult);
    if (!secondAttacker.fainted && !firstAttacker.fainted) {
        const secondAttackResult = useStruggle ? executeStruggleAttack(secondAttacker, firstAttacker) : executeAttack(secondAttacker, firstAttacker);
        attacks.push(secondAttackResult);
    }
    const pokemonALeftoversHealing = applyLeftovers(pokemonA);
    const pokemonBLeftoversHealing = applyLeftovers(pokemonB);
    const pokemonAHpAfterLeftovers = pokemonA.currentHp;
    const pokemonBHpAfterLeftovers = pokemonB.currentHp;
    return {
        firstAttacker,
        attacks,
        leftovers: {
            pokemonA: pokemonALeftoversHealing,
            pokemonB: pokemonBLeftoversHealing,
            pokemonAHpAfterLeftovers,
            pokemonBHpAfterLeftovers
        },
        pokemonAFainted: pokemonA.fainted,
        pokemonBFainted: pokemonB.fainted
    };
}

export function resolveMatchup(pokemonA, pokemonB) {
    const turns = [];
    const useStruggle = areMutuallyImmune(pokemonA, pokemonB);
    let turnCount = 0;
    while (!pokemonA.fainted && !pokemonB.fainted && turnCount < MAX_MATCHUP_TURNS) {
        const turnResult = executeTurn(pokemonA, pokemonB, useStruggle);
        turns.push(turnResult);
        turnCount++;
    }
    if (!pokemonA.fainted && !pokemonB.fainted) {
        if (pokemonA.currentHp <= pokemonB.currentHp) {
            pokemonA.currentHp = 0;
            pokemonA.fainted = true;
        } else {
            pokemonB.currentHp = 0;
            pokemonB.fainted = true;
        }
    }
    let winner = null;
    let loser = null;
    if (pokemonA.fainted && !pokemonB.fainted) {
        winner = pokemonB;
        loser = pokemonA;
    } else if (pokemonB.fainted && !pokemonA.fainted) {
        winner = pokemonA;
        loser = pokemonB;
    }
    if (winner) {
        winner.matchupWins++;
    }
    const pokemonAMaxReviveActivated = pokemonA.fainted ? applyMaxRevive(pokemonA) : false;
    const pokemonBMaxReviveActivated = pokemonB.fainted ? applyMaxRevive(pokemonB) : false;
    return {
        winner,
        loser,
        turns,
        maxRevive: {
            pokemonA: pokemonAMaxReviveActivated,
            pokemonB: pokemonBMaxReviveActivated
        }
    };
}

function getRandomDamageFactor() {
    return Math.random() * (MAX_RANDOM_FACTOR - MIN_RANDOM_FACTOR) + MIN_RANDOM_FACTOR;
}