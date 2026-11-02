import { GENERATIONS, getIdsInGenerations } from "../data/generations.js";
import { FINAL_EVOLUTION_IDS } from "../data/final-evolutions.js";
import { LEAGUES } from "../data/leagues.js";
import { LEGENDARY_IDS, ELITE_IDS, STRONG_IDS } from "../data/pokemon-tiers.js";
import { formatTypeName } from "../utils/formatters.js";

export const MAX_TEAM_SIZE = 6;

const SAVE_KEY = "pokebattle.adventure";
// La versión 1 usaba líderes aleatorios; esas partidas ya no se pueden continuar
const SAVE_VERSION = 2;

export function getRegion(regionIndex) {
    return GENERATIONS[regionIndex];
}

export function getLeague(regionIndex) {
    return LEAGUES[regionIndex];
}

export function isLastRegion(regionIndex) {
    return regionIndex === LEAGUES.length - 1;
}

// Índice de la primera etapa de la Liga (= número de gimnasios de la región)
export function getLeagueStart(regionIndex) {
    return LEAGUES[regionIndex].gyms.length;
}

export function getStageCount(regionIndex) {
    const league = LEAGUES[regionIndex];
    return league.gyms.length + league.league.length + 1;
}

export function createRegionPlan(regionIndex) {
    return { regionIndex };
}

// Los iniciales de la región en su última evolución: Planta, Fuego y Agua
export function getStarterIds(regionIndex) {
    return GENERATIONS[regionIndex].previewIds;
}

function getTrainerTeam(trainer, starterSlot) {
    return trainer.teams ? trainer.teams[starterSlot] ?? trainer.teams[0] : trainer.team;
}

export function getStageInfo(plan, stage, starterSlot) {
    const league = LEAGUES[plan.regionIndex];
    const leagueStart = league.gyms.length;
    if (stage < leagueStart) {
        const trainer = league.gyms[stage];
        return {
            kind: "gym",
            trainer,
            type: trainer.type,
            team: getTrainerTeam(trainer, starterSlot),
            progressText: `${league.gymLabel} ${stage + 1} de ${leagueStart} · tipo ${formatTypeName(trainer.type)}`
        };
    }
    if (stage < leagueStart + league.league.length) {
        const memberIndex = stage - leagueStart;
        const trainer = league.league[memberIndex];
        const typeText = trainer.type ? ` · tipo ${formatTypeName(trainer.type)}` : "";
        return {
            kind: "elite",
            trainer,
            type: trainer.type,
            team: getTrainerTeam(trainer, starterSlot),
            progressText: `${league.leagueLabel} ${memberIndex + 1} de ${league.league.length}${typeText}`
        };
    }
    return {
        kind: "champion",
        trainer: league.champion,
        type: null,
        team: getTrainerTeam(league.champion, starterSlot),
        progressText: "Campeonato"
    };
}

export function getStageLabels(regionIndex) {
    const league = LEAGUES[regionIndex];
    return { gym: league.gymLabel, elite: league.leagueLabel, champion: "Campeonato" };
}

// Medallas contadas sobre 8, para que Alola (4 grandes pruebas) siga el mismo ritmo
export function getMedalCount(regionIndex, stage) {
    const gyms = getLeagueStart(regionIndex);
    return Math.floor(Math.min(stage, gyms) * 8 / gyms);
}

// Los Pokémon fuertes llegan con la 3.ª medalla y los pseudolegendarios con la 6.ª;
// los legendarios nunca salen aquí, solo en los encuentros legendarios
export function getRewardPool(regionIndex, team, stage) {
    const medals = getMedalCount(regionIndex, stage);
    const teamIds = new Set(team.map(pokemon => pokemon.id));
    const blocked = new Set(LEGENDARY_IDS);
    if (medals < 3) {
        STRONG_IDS.forEach(id => blocked.add(id));
    }
    if (medals < 6) {
        ELITE_IDS.forEach(id => blocked.add(id));
    }
    return getIdsInGenerations([GENERATIONS[regionIndex].id], FINAL_EVOLUTION_IDS).filter(id => !blocked.has(id) && !teamIds.has(id));
}

export function canMeetLegendary(regionIndex, stage) {
    return getMedalCount(regionIndex, stage) >= 6;
}

// Pokémon que siguen al pasar de región; los legendarios se quedan en la suya
export const TRAVEL_TEAM_SIZE = 2;

export function isLegendary(pokemon) {
    return LEGENDARY_IDS.includes(pokemon.id);
}

export function getLegendaryPool(regionIndex, team) {
    const teamIds = new Set(team.map(pokemon => pokemon.id));
    return getIdsInGenerations([GENERATIONS[regionIndex].id], LEGENDARY_IDS).filter(id => !teamIds.has(id));
}

// Los entrenadores de ruta tampoco llevan legendarios
export function getRouteTrainerPool(regionIndex) {
    const legendary = new Set(LEGENDARY_IDS);
    return getIdsInGenerations([GENERATIONS[regionIndex].id]).filter(id => !legendary.has(id));
}

export function healTeam(team) {
    team.forEach(pokemon => {
        pokemon.currentHp = pokemon.maxHp;
        pokemon.fainted = false;
    });
}

export function getStageMarkers(plan, stage) {
    const markers = [];
    for (let index = 0; index < getStageCount(plan.regionIndex); index++) {
        const info = getStageInfo(plan, index, 0);
        markers.push({
            kind: info.kind,
            type: info.type,
            label: info.trainer.name,
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
            && LEAGUES[saved.plan.regionIndex]
            && Number.isInteger(saved.stage)
            && saved.stage < getStageCount(saved.plan.regionIndex)
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
