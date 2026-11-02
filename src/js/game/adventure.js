import { GENERATIONS, getIdsInGenerations } from "../data/generations.js";
import { FINAL_EVOLUTION_IDS } from "../data/final-evolutions.js";
import { LEAGUES } from "../data/leagues.js";
import { LEGENDARY_IDS, ELITE_IDS, STRONG_IDS } from "../data/pokemon-tiers.js";
import { supportedItems } from "../data/items.js";
import { HP_BONUS } from "./pokemon.js";
import { formatTypeName } from "../utils/formatters.js";

export const MAX_TEAM_SIZE = 6;

const SAVE_KEY = "pokebattle.adventure";
// La versión 1 usaba líderes aleatorios; esas partidas ya no se pueden continuar.
// La 2 guardaba los PS sin HP_BONUS: se convierten al cargar
const SAVE_VERSION = 3;

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

const ITEM_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";
const LEADER_ITEM_IDS = ["sitrus-berry", "leftovers", "rocky-helmet", "assault-vest", "focus-band", "quick-claw", "life-orb", "choice-band", "choice-scarf"];

function createLeaderItem(id) {
    const item = supportedItems.find(candidate => candidate.id === id);
    return { ...item, sprite: `${ITEM_SPRITE_BASE}/${id}.png` };
}

// Siempre el mismo reparto para el mismo entrenador, para que reintentar sea justo
function hashText(text) {
    return [...text].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

// Cuántos Pokémon del rival llevan objeto: más cuanto más avanzado está el combate
function getLeaderItemCount(info, medals) {
    if (info.kind === "champion") {
        return 4;
    }
    if (info.kind === "elite") {
        return 3;
    }
    return 1 + Math.floor(medals / 3);
}

// Devuelve un objeto (o null) por cada Pokémon del equipo; el as, que va el último, lleva el
// potenciador de su tipo si el entrenador tiene uno
export function getTrainerItems(plan, stage, team) {
    const info = getStageInfo(plan, stage, 0);
    const count = Math.min(team.length, getLeaderItemCount(info, getMedalCount(plan.regionIndex, stage)));
    const typeBoost = info.type ? supportedItems.find(item => item.effect === "type-boost" && item.boostType === info.type) : null;
    const seed = hashText(info.trainer.name);
    const items = team.map(() => null);
    for (let offset = 0; offset < count; offset++) {
        const index = team.length - 1 - offset;
        items[index] = offset === 0 && typeBoost
            ? createLeaderItem(typeBoost.id)
            : createLeaderItem(LEADER_ITEM_IDS[(seed + offset * 5) % LEADER_ITEM_IDS.length]);
    }
    return items;
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

function migrateSave(saved) {
    if (saved?.version === 2 && Array.isArray(saved.team)) {
        saved.team.forEach(pokemon => {
            pokemon.maxHp += HP_BONUS;
            if (!pokemon.fainted) {
                pokemon.currentHp += HP_BONUS;
            }
        });
        saved.version = SAVE_VERSION;
    }
    return saved;
}

export function loadAdventure() {
    try {
        const saved = migrateSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
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
