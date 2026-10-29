import { GENERATIONS, getIdsInGenerations } from "../data/generations.js";
import { FINAL_EVOLUTION_IDS } from "../data/final-evolutions.js";
import { getRandomTrainerIdentities } from "../data/trainers.js";
import { formatTypeName } from "../utils/formatters.js";

export const GYM_COUNT = 8;
export const ELITE_FOUR_COUNT = 4;
export const STAGES_PER_REGION = GYM_COUNT + ELITE_FOUR_COUNT + 1;
export const MAX_TEAM_SIZE = 6;

const GYM_TEAM_SIZES = [2, 3, 3, 4, 4, 5, 5, 6];
const ELITE_FOUR_TEAM_SIZES = [5, 5, 6, 6];
const CHAMPION_TEAM_SIZE = 6;
// A partir de este gimnasio los líderes solo usan evoluciones finales (si hay suficientes)
const FIRST_GYM_WITH_FINALS = 4;
const STARTER_TYPES = ["grass", "fire", "water"];
const MIN_TYPE_SPECIES = 6;
const MIN_TYPE_FINALS = 3;

const SAVE_KEY = "pokebattle.adventure";
const SAVE_VERSION = 1;

function shuffle(list) {
    const shuffled = [...list];
    for (let index = shuffled.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
}

export function getRegion(regionIndex) {
    return GENERATIONS[regionIndex];
}

export function isLastRegion(regionIndex) {
    return regionIndex === GENERATIONS.length - 1;
}

function getRegionPools(regionIndex, typeIndex) {
    const generationId = GENERATIONS[regionIndex].id;
    const all = getIdsInGenerations([generationId]);
    const finals = getIdsInGenerations([generationId], FINAL_EVOLUTION_IDS);
    const allSet = new Set(all);
    const finalSet = new Set(finals);
    const byType = Object.fromEntries(Object.entries(typeIndex).map(([type, ids]) => [type, {
        all: ids.filter(id => allSet.has(id)),
        finals: ids.filter(id => finalSet.has(id))
    }]));
    return { all, finals, byType };
}

function getTrainerTitle(stage, identity) {
    if (stage < GYM_COUNT) {
        return `Líder ${identity.trainerName}`;
    }
    if (stage < GYM_COUNT + ELITE_FOUR_COUNT) {
        return `Alto Mando ${identity.trainerName}`;
    }
    return `${identity.gender === "female" ? "Campeona" : "Campeón"} ${identity.trainerName}`;
}

export function createRegionPlan(regionIndex, typeIndex) {
    const pools = getRegionPools(regionIndex, typeIndex);
    const suitableTypes = shuffle(Object.keys(pools.byType).filter(type => {
        return pools.byType[type].all.length >= MIN_TYPE_SPECIES && pools.byType[type].finals.length >= MIN_TYPE_FINALS;
    }));
    const gymTypes = suitableTypes.slice(0, GYM_COUNT);
    // El Alto Mando usa primero los tipos que no tienen gimnasio
    const eliteTypes = [...suitableTypes.slice(GYM_COUNT), ...shuffle(gymTypes)].slice(0, ELITE_FOUR_COUNT);
    const trainers = getRandomTrainerIdentities(STAGES_PER_REGION).map((identity, stage) => ({
        name: getTrainerTitle(stage, identity),
        sprite: identity.sprite
    }));
    return { regionIndex, gymTypes, eliteTypes, trainers };
}

export function getStageInfo(plan, stage) {
    const trainer = plan.trainers[stage];
    if (stage < GYM_COUNT) {
        const type = plan.gymTypes[stage];
        return { kind: "gym", trainer, type, progressText: `Gimnasio ${stage + 1} de ${GYM_COUNT} · tipo ${formatTypeName(type)}` };
    }
    if (stage < GYM_COUNT + ELITE_FOUR_COUNT) {
        const memberIndex = stage - GYM_COUNT;
        const type = plan.eliteTypes[memberIndex];
        return { kind: "elite", trainer, type, progressText: `Alto Mando ${memberIndex + 1} de ${ELITE_FOUR_COUNT} · tipo ${formatTypeName(type)}` };
    }
    return { kind: "champion", trainer, type: null, progressText: "Campeonato" };
}

// Tamaño del equipo rival y listas de las que sale, en orden de preferencia
export function getEnemyTeamRequest(plan, stage, typeIndex) {
    const pools = getRegionPools(plan.regionIndex, typeIndex);
    const info = getStageInfo(plan, stage);
    if (info.kind === "champion") {
        return { count: CHAMPION_TEAM_SIZE, pools: [pools.finals], maxPerType: 2 };
    }
    const typePools = pools.byType[info.type];
    if (info.kind === "gym") {
        const count = GYM_TEAM_SIZES[stage];
        const usesFinals = stage >= FIRST_GYM_WITH_FINALS;
        return { count, pools: usesFinals ? [typePools.finals, typePools.all] : [typePools.all], maxPerType: null };
    }
    const count = ELITE_FOUR_TEAM_SIZES[stage - GYM_COUNT];
    return { count, pools: [typePools.finals, typePools.all, pools.finals], maxPerType: null };
}

// Una lista por hueco: un Planta, un Fuego y un Agua de la región, o cualquier evolución final si falta alguno
export function getStarterPools(regionIndex, typeIndex) {
    const pools = getRegionPools(regionIndex, typeIndex);
    return STARTER_TYPES.map(type => [pools.byType[type].finals, pools.finals]);
}

export function getRewardPool(regionIndex, typeIndex, team) {
    const teamIds = new Set(team.map(pokemon => pokemon.id));
    return getRegionPools(regionIndex, typeIndex).finals.filter(id => !teamIds.has(id));
}

export function healTeam(team) {
    team.forEach(pokemon => {
        pokemon.currentHp = pokemon.maxHp;
        pokemon.fainted = false;
    });
}

export function getStageMarkers(plan, stage) {
    const markers = [];
    for (let index = 0; index < STAGES_PER_REGION; index++) {
        const info = getStageInfo(plan, index);
        markers.push({
            kind: info.kind,
            type: info.type,
            done: index < stage,
            current: index === stage
        });
    }
    return markers;
}

export function saveAdventure(adventure) {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, ...adventure }));
    } catch (error) {
        console.warn(error);
    }
}

export function loadAdventure() {
    try {
        const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
        const isValid = saved
            && saved.version === SAVE_VERSION
            && saved.plan
            && Array.isArray(saved.plan.trainers)
            && Number.isInteger(saved.stage)
            && Array.isArray(saved.team)
            && saved.team.length > 0;
        return isValid ? saved : null;
    } catch (error) {
        console.warn(error);
        return null;
    }
}

export function clearAdventure() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (error) {
        console.warn(error);
    }
}
