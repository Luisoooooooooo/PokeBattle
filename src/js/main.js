import { getPokemon, getItem, getUniqueRandomPokemon, getRandomItemOffer, getPokemonFromPools } from "./api/pokeapi.js";
import { renderPokemonCards } from "./ui/pokemon-cards.js";
import { renderItemTeam, renderItemOffer, renderMedicines } from "./ui/item-selection.js";
import { resolveMatchup } from "./game/battle.js";
import { getRandomTrainers } from "./data/trainers.js";
import { formatPokemonName, formatTypeName } from "./utils/formatters.js";
import { FINAL_EVOLUTION_IDS } from "./data/final-evolutions.js";
import { ALL_GENERATION_IDS, getIdsInGenerations } from "./data/generations.js";
import { renderGenerationChips } from "./ui/generation-filter.js";
import { renderAdventureProgress } from "./ui/adventure.js";
import { renderRouteOptions, renderRouteTeam, renderShop } from "./ui/route.js";
import {
    START_MONEY,
    ROUTE_LENGTH,
    MEDICINES,
    createRoute,
    getRouteName,
    getItemPrice,
    createBagItem,
    applyMedicine,
    canUseMedicine,
    pickEvent,
    getRouteTrainerReward,
    getBattleReward,
    getRouteTrainerTeamSize,
    formatMoney
} from "./game/routes.js";
import {
    MAX_TEAM_SIZE,
    getRegion,
    getLeague,
    isLastRegion,
    getLeagueStart,
    getStageCount,
    createRegionPlan,
    getStarterIds,
    getStageInfo,
    getStageLabels,
    getRewardPool,
    healTeam,
    getStageMarkers,
    saveAdventure,
    loadAdventure,
    clearAdventure
} from "./game/adventure.js";

const TEAM_SIZE = 6;
const TOTAL_TRAINERS = 5;
let pokemonOffer = [];
let selectedPokemon = [];
let itemOffer = [];
let selectedItemPokemonId = null;
let enemyTeam = [];
let activeEnemyPokemon = null;
let activePokemon = null;
let playerPokemonNeedsEntry = true;
let currentTrainer = 1;
let runTrainers = [];
let lastRunResult = null;
let classicGenerationIds = [...ALL_GENERATION_IDS];
// Regiones con las que se sacaron los 12 actuales (los chips pueden tener cambios pendientes)
let loadedGenerationIds = [...ALL_GENERATION_IDS];
let playerPokemonPool = FINAL_EVOLUTION_IDS;
let enemyPokemonPool = null;
let gameMode = "classic";
let adventure = null;
let starterOffer = [];
let selectedStarter = null;
let rewardOffer = [];
let selectedRewardId = null;
let replacedPokemonId = null;
let adventureMessageAction = null;
let rewardContinuation = null;
let itemsContinuation = null;
let routeBattle = null;
let shopProducts = [];
let isBattleBusy = false;

function showScreen(selector) {
    document.querySelectorAll("main > section").forEach(section => {
        section.classList.toggle("hidden", !section.matches(selector));
    });
    window.scrollTo(0, 0);
}

// El clásico empieza siempre con las nueve regiones marcadas
function startClassicMode() {
    classicGenerationIds = [...ALL_GENERATION_IDS];
    startClassicSelection();
}

function toggleClassicGeneration(generationId) {
    const isSelected = classicGenerationIds.includes(generationId);
    if (isSelected && classicGenerationIds.length === 1) {
        return;
    }
    classicGenerationIds = isSelected
        ? classicGenerationIds.filter(id => id !== generationId)
        : [...classicGenerationIds, generationId].sort((a, b) => a - b);
    renderClassicFilter();
}

function renderClassicFilter() {
    renderGenerationChips("#generationChips", classicGenerationIds, toggleClassicGeneration);
    const hasPendingChanges = classicGenerationIds.join() !== loadedGenerationIds.join();
    const refreshBtn = document.querySelector("#refreshOfferBtn");
    refreshBtn.classList.toggle("secondary-button", !hasPendingChanges);
    refreshBtn.title = hasPendingChanges ? "Sacar 12 Pokémon de las regiones marcadas" : "Sacar otros 12 Pokémon";
}

async function startClassicSelection() {
    gameMode = "classic";
    document.querySelector("#startRunBtn").textContent = "Empezar la run";
    document.querySelector("#itemOfferTitle").textContent = "Objetos disponibles";
    playerPokemonPool = getIdsInGenerations(classicGenerationIds, FINAL_EVOLUTION_IDS);
    enemyPokemonPool = getIdsInGenerations(classicGenerationIds);
    selectedPokemon = [];
    pokemonOffer = await withLoading("Buscando Pokémon salvajes...", () => getUniqueRandomPokemon(12, 2, playerPokemonPool));
    loadedGenerationIds = [...classicGenerationIds];
    renderClassicFilter();
    renderPokemonCards(pokemonOffer, selectedPokemon, togglePokemonSelection);
    updateSelectionUI();
    showScreen(".selection");
}

function updateSelectionUI() {
    const selectionCount = document.querySelector("#selectionCount");
    const continueBtn = document.querySelector("#continueBtn");
    selectionCount.textContent = `${selectedPokemon.length} / ${TEAM_SIZE} seleccionados`;
    continueBtn.disabled = selectedPokemon.length !== TEAM_SIZE;
}

function togglePokemonSelection(pokemon) {
    const isSelected = selectedPokemon.some(selected => selected.id === pokemon.id);
    if (isSelected) {
        selectedPokemon = selectedPokemon.filter(selected => selected.id !== pokemon.id);
    } else {
        if (selectedPokemon.length >= TEAM_SIZE) {
            return;
        }
        selectedPokemon.push(pokemon);
    }
    renderPokemonCards(pokemonOffer, selectedPokemon, togglePokemonSelection);
    updateSelectionUI();
    // En móvil «Continuar» está arriba: al completar el equipo se sube hasta él
    if (selectedPokemon.length === TEAM_SIZE && isMobileLayout()) {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

async function confirmTeam() {
    if (selectedPokemon.length !== TEAM_SIZE) {
        return;
    }
    itemOffer = await withLoading("Preparando los objetos...", getRandomItemOffer);
    selectedItemPokemonId = selectedPokemon[0]?.id ?? null;
    document.querySelector(".selection").classList.add("hidden");
    document.querySelector("#itemScreen").classList.remove("hidden");
    renderItemSelection();
}

function renderItemSelection() {
    const isAdventure = gameMode === "adventure";
    document.querySelector("#medicineSection").classList.toggle("hidden", !isAdventure);
    if (isAdventure) {
        renderItemTeam(selectedPokemon, selectedItemPokemonId, selectItemPokemon, unequipToBag, true);
        renderItemOffer(getAdventureItems(), selectedPokemon, equipItem, "No tienes objetos para equipar. Consigue más en las tiendas y eventos de las rutas.");
        renderMedicines("#medicineGrid", getBagMedicines(), useMedicine);
        return;
    }
    renderItemTeam(selectedPokemon, selectedItemPokemonId, selectItemPokemon);
    renderItemOffer(itemOffer, selectedPokemon, equipItem);
}

function getBagMedicines() {
    const groups = new Map();
    adventure.bag.filter(item => item.medicine).forEach(item => {
        const group = groups.get(item.id) ?? { ...item, count: 0, usable: canUseMedicine(item.id, selectedPokemon) };
        group.count++;
        groups.set(item.id, group);
    });
    return [...groups.values()];
}

function useMedicine(medicine) {
    const bagItem = adventure.bag.find(item => item.medicine && item.id === medicine.id);
    if (!bagItem || !canUseMedicine(medicine.id, selectedPokemon)) {
        return;
    }
    applyMedicine(medicine.id, selectedPokemon);
    adventure.bag = adventure.bag.filter(item => item !== bagItem);
    saveCurrentAdventure();
    renderItemSelection();
}

function unequipToBag(pokemon) {
    adventure.bag.push(pokemon.item);
    pokemon.item = null;
}

function selectItemPokemon(pokemon) {
    selectedItemPokemonId = pokemon.id;
    renderItemSelection();
}

function equipItem(item) {
    const pokemon = selectedPokemon.find(pokemon => pokemon.id === selectedItemPokemonId);
    if (!pokemon) {
        return;
    }
    if (gameMode === "adventure") {
        if (pokemon.item) {
            adventure.bag.push(pokemon.item);
        }
        adventure.bag = adventure.bag.filter(bagItem => bagItem.uid !== item.uid);
    }
    pokemon.item = item;
    renderItemSelection();
}

function init() {
    document.querySelector("#classicModeBtn").addEventListener("click", startClassicMode);
    document.querySelector("#backToModesBtn").addEventListener("click", () => showScreen("#modeScreen"));
    document.querySelector("#refreshOfferBtn").addEventListener("click", startClassicSelection);
    document.querySelector("#adventureNewBtn").addEventListener("click", startNewAdventure);
    document.querySelector("#adventureContinueBtn").addEventListener("click", continueAdventure);
    document.querySelector("#starterBackBtn").addEventListener("click", () => showScreen("#modeScreen"));
    document.querySelector("#confirmStarterBtn").addEventListener("click", confirmStarter);
    document.querySelector("#acceptRewardBtn").addEventListener("click", acceptAdventureReward);
    document.querySelector("#skipRewardBtn").addEventListener("click", () => rewardContinuation?.());
    document.querySelector("#routeBagBtn").addEventListener("click", () => showAdventureItems(showRoute));
    document.querySelector("#leaveShopBtn").addEventListener("click", leaveShop);
    document.querySelector("#adventureMessageBtn").addEventListener("click", () => adventureMessageAction?.());
    renderAdventureModeCard();
    const continueBtn = document.querySelector("#continueBtn");
    continueBtn.addEventListener("click", confirmTeam);
    const startRunBtn = document.querySelector("#startRunBtn");
    startRunBtn.addEventListener("click", handleItemScreenContinue);
    const startTrainerBattleBtn = document.querySelector("#startTrainerBattleBtn");
    startTrainerBattleBtn.addEventListener("click", startTrainerBattle);
    const continueTrainerBtn = document.querySelector("#continueTrainerBtn");
    continueTrainerBtn.addEventListener("click", startNextTrainer);
    const resolveMatchupBtn = document.querySelector("#resolveMatchupBtn");
    resolveMatchupBtn.addEventListener("click", handleResolveMatchup);
    const newRunBtn = document.querySelector("#newRunBtn");
    newRunBtn.addEventListener("click", startNewRun);
    const downloadResultBtn = document.querySelector("#downloadResultBtn");
    downloadResultBtn.addEventListener("click", downloadResultCard);
}

function showLoading(message) {
    document.querySelector("#loadingScreen").classList.remove("hidden", "is-error");
    document.querySelector("#loadingSpinner").classList.remove("hidden");
    document.querySelector("#loadingTitle").textContent = message;
    document.querySelector("#loadingMessage").classList.add("hidden");
    document.querySelector("#retryBtn").classList.add("hidden");
}

function hideLoading() {
    document.querySelector("#loadingScreen").classList.add("hidden");
}

function waitForRetry() {
    document.querySelector("#loadingScreen").classList.add("is-error");
    document.querySelector("#loadingSpinner").classList.add("hidden");
    document.querySelector("#loadingTitle").textContent = "No se pudo conectar con PokéAPI";
    const loadingMessage = document.querySelector("#loadingMessage");
    loadingMessage.textContent = "Comprueba tu conexión e inténtalo de nuevo.";
    loadingMessage.classList.remove("hidden");
    const retryBtn = document.querySelector("#retryBtn");
    retryBtn.classList.remove("hidden");
    retryBtn.focus();
    return new Promise(resolve => {
        retryBtn.addEventListener("click", resolve, { once: true });
    });
}

// Muestra la pantalla de carga mientras se ejecuta la tarea y, si falla, deja reintentarla
async function withLoading(message, task) {
    while (true) {
        showLoading(message);
        try {
            const result = await task();
            hideLoading();
            return result;
        } catch (error) {
            console.error(error);
            await waitForRetry();
        }
    }
}

async function loadEnemyTeam(fetchTeam = () => getUniqueRandomPokemon(6, 2, enemyPokemonPool)) {
    enemyTeam = await withLoading("Buscando al siguiente rival...", fetchTeam);
    activeEnemyPokemon = enemyTeam[0];
    const enemyPokeballs = document.querySelector("#enemyPokeballs");
    enemyPokeballs.innerHTML = "";
    enemyTeam.forEach(() => {
        const pokeball = document.createElement("span");
        pokeball.classList.add("enemy-pokeball");
        pokeball.textContent = "●";
        enemyPokeballs.appendChild(pokeball);
    });
    updateBattlePokemonUI(activeEnemyPokemon, "enemy");
}

function wait(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

function updateBattlePokemonUI(pokemon, side, currentHp = pokemon.currentHp) {
    const sprite = document.querySelector(`#${side}BattleSprite`);
    const name = document.querySelector(`#${side}BattleName`);
    const types = document.querySelector(`#${side}BattleTypes`);
    const hpText = document.querySelector(`#${side}HpText`);
    const hpBar = document.querySelector(`#${side}HpBar`);
    sprite.src = pokemon.sprite;
    sprite.alt = formatPokemonName(pokemon.name);
    name.textContent = formatPokemonName(pokemon.name);
    types.innerHTML = pokemon.types.map(type => `
        <span class="type-badge" style="--type-color: var(--type-${type})" title="${formatTypeName(type)}" role="img" aria-label="Tipo ${formatTypeName(type)}">
            <img src="https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg" alt="">
        </span>
    `).join("");
    hpText.textContent = `${currentHp} / ${pokemon.maxHp} PS`;
    const hpPercentage = (currentHp / pokemon.maxHp) * 100;
    hpBar.style.width = `${Math.max(0, hpPercentage)}%`;
    hpBar.classList.toggle("warning", hpPercentage > 25 && hpPercentage <= 50);
    hpBar.classList.toggle("critical", hpPercentage <= 25);
}

function scrollBattleLog() {
    const battleLog = document.querySelector("#battleLog");
    battleLog.scrollTop = battleLog.scrollHeight;
}

function addBattleLogMessage(message, type = "system") {
    const battleLog = document.querySelector("#battleLog");
    const logMessage = document.createElement("p");
    logMessage.classList.add("log-message", `log-${type}`);
    logMessage.textContent = message;
    battleLog.appendChild(logMessage);
    scrollBattleLog();
}

function addBattleLogTurn(turnNumber) {
    const battleLog = document.querySelector("#battleLog");
    const turn = document.createElement("div");
    turn.classList.add("log-turn");
    turn.textContent = `Turno ${turnNumber}`;
    battleLog.appendChild(turn);
    scrollBattleLog();
}

function addBattleLogAttack(attack, effects = []) {
    const battleLog = document.querySelector("#battleLog");
    const isPlayer = attack.attacker === activePokemon;
    const attackName = attack.type === "struggle" ? "Forcejeo" : `tipo ${formatTypeName(attack.type)}`;
    const attackBlock = document.createElement("div");
    attackBlock.classList.add("log-attack", isPlayer ? "log-attack-player" : "log-attack-enemy");
    const attackTitle = document.createElement("strong");
    attackTitle.textContent = `${formatPokemonName(attack.attacker.name)} ataca con ${attackName}.`;
    attackBlock.appendChild(attackTitle);
    effects.forEach(effect => {
        const effectLine = document.createElement("span");
        effectLine.textContent = effect;
        attackBlock.appendChild(effectLine);
    });
    battleLog.appendChild(attackBlock);
    scrollBattleLog();
}

function addBattleLogResult(winner, loser) {
    const battleLog = document.querySelector("#battleLog");
    const resultBlock = document.createElement("div");
    const playerWon = winner === activePokemon;
    resultBlock.classList.add("log-result", playerWon ? "log-result-player-win" : "log-result-player-loss");
    resultBlock.innerHTML = `
        <span class="log-result-label">${playerWon ? "Rival debilitado" : "Tu Pokémon se debilitó"}</span>
        <strong class="log-result-name">${formatPokemonName(loser.name)}</strong>
        <span class="log-result-detail">${formatPokemonName(winner.name)} gana el enfrentamiento</span>
    `;
    battleLog.appendChild(resultBlock);
    scrollBattleLog();
}

function addBattleLogDoubleFaint(playerPokemon, enemyPokemon) {
    const battleLog = document.querySelector("#battleLog");
    const resultBlock = document.createElement("div");
    resultBlock.classList.add("log-result", "log-result-double");
    resultBlock.innerHTML = `
        <span class="log-result-label">Doble debilitamiento</span>
        <strong class="log-result-name">${formatPokemonName(playerPokemon.name)} y ${formatPokemonName(enemyPokemon.name)}</strong>
        <span class="log-result-detail">Ambos Pokémon se han debilitado</span>
    `;
    battleLog.appendChild(resultBlock);
    scrollBattleLog();
}

function getEffectivenessMessage(multiplier) {
    if (multiplier === 0) {
        return "No afecta al rival.";
    }
    if (multiplier > 1) {
        return "¡Es supereficaz!";
    }
    if (multiplier < 1) {
        return "No es muy eficaz...";
    }
    return null;
}

function updateEnemyPokeballs() {
    const enemyPokeballs = document.querySelectorAll(".enemy-pokeball");
    enemyTeam.forEach((pokemon, index) => {
        if (!enemyPokeballs[index]) {
            return;
        }
        enemyPokeballs[index].classList.toggle("defeated", pokemon.fainted);
    });
}

function showNextEnemyPokemon() {
    const currentEnemyIndex = enemyTeam.indexOf(activeEnemyPokemon);
    for (let offset = 1; offset <= enemyTeam.length; offset++) {
        const nextIndex = (currentEnemyIndex + offset) % enemyTeam.length;
        const nextEnemyPokemon = enemyTeam[nextIndex];
        if (!nextEnemyPokemon.fainted) {
            activeEnemyPokemon = nextEnemyPokemon;
            updateBattlePokemonUI(activeEnemyPokemon, "enemy");
            updateEnemyPokeballs();
            return true;
        }
    }
    return false;
}

function hasLivingPlayerPokemon() {
    return selectedPokemon.some(pokemon => !pokemon.fainted);
}

function hasLivingEnemyPokemon() {
    return enemyTeam.some(pokemon => !pokemon.fainted);
}

async function startNextTrainer() {
    await loadEnemyTeam();
    document.querySelector("#trainerDefeatedScreen").classList.add("hidden");
    currentTrainer++;
    updateTrainerUI();
    addBattleLogMessage(`Comienza el combate contra ${getCurrentTrainer().name}.`, "important");
    addBattleLogMessage(`${formatPokemonName(activeEnemyPokemon.name)} entra al combate.`);
    document.querySelector("#resolveMatchupBtn").disabled = false;
    showTrainerIntro();
}

// El botón dice en qué punto está el combate: resolviendo, esperando un cambio o listo
function updateResolveButton() {
    const resolveMatchupBtn = document.querySelector("#resolveMatchupBtn");
    const needsChoice = !isBattleBusy && !activePokemon && hasLivingPlayerPokemon();
    if (isBattleBusy) {
        resolveMatchupBtn.textContent = "Combatiendo…";
    } else if (needsChoice) {
        resolveMatchupBtn.textContent = "Elige otro Pokémon";
    } else {
        resolveMatchupBtn.textContent = "Resolver enfrentamiento";
    }
    const battleTeam = document.querySelector(".battle-team");
    const hadToChoose = battleTeam.classList.contains("needs-choice");
    battleTeam.classList.toggle("needs-choice", needsChoice);
    if (needsChoice && !hadToChoose && isMobileLayout()) {
        battleTeam.scrollIntoView({ behavior: "smooth", block: "end" });
    }
}

function isMobileLayout() {
    return window.matchMedia("(max-width: 700px)").matches;
}

async function handleResolveMatchup() {
    if (!activePokemon || !activeEnemyPokemon || isBattleBusy) {
        return;
    }
    isBattleBusy = true;
    updateResolveButton();
    try {
        await resolveMatchupFlow();
    } finally {
        isBattleBusy = false;
        updateResolveButton();
    }
}

async function resolveMatchupFlow() {
    if (!activePokemon || !activeEnemyPokemon) {
        return;
    }
    const resolveMatchupBtn = document.querySelector("#resolveMatchupBtn");
    resolveMatchupBtn.disabled = true;
    if (playerPokemonNeedsEntry) {
        addBattleLogMessage(`${formatPokemonName(activePokemon.name)} entra al combate.`);
        playerPokemonNeedsEntry = false;
    }
    const playerInitialHp = activePokemon.currentHp;
    const enemyInitialHp = activeEnemyPokemon.currentHp;
    const result = resolveMatchup(activePokemon, activeEnemyPokemon);
    if (result.maxRevive.pokemonA) {
        activePokemon.maxRevivesUsed++;
    }
    updateBattlePokemonUI(activePokemon, "player", playerInitialHp);
    updateBattlePokemonUI(activeEnemyPokemon, "enemy", enemyInitialHp);
    addBattleLogMessage(`${formatPokemonName(activePokemon.name)} se enfrenta a ${formatPokemonName(activeEnemyPokemon.name)}.`, "matchup");
    await wait(700);
    for (let turnIndex = 0; turnIndex < result.turns.length; turnIndex++) {
        const turn = result.turns[turnIndex];
        addBattleLogTurn(turnIndex + 1);
        await wait(500);
        for (const attack of turn.attacks) {
            const attackerSide = attack.attacker === activePokemon ? "player" : "enemy";
            const defenderSide = attack.defender === activePokemon ? "player" : "enemy";
            const effects = [];
            const effectivenessMessage = getEffectivenessMessage(attack.multiplier);
            updateBattlePokemonUI(attack.defender, defenderSide, attack.defenderCurrentHp);
            if (attack.defender === activePokemon) {
                updateBattleTeamPokemonHp(activePokemon, attack.defenderCurrentHp);
            }
            if (attack.damageDealt > 0) {
                effects.push(`${formatPokemonName(attack.defender.name)} pierde ${attack.damageDealt} PS.`);
            } else {
                effects.push(`${formatPokemonName(attack.defender.name)} no recibe daño.`);
            }
            if (effectivenessMessage && attack.type !== "struggle") {
                effects.push(effectivenessMessage);
            }
            if (attack.focusBandActivated) {
                effects.push(`¡La Banda Focus permite a ${formatPokemonName(attack.defender.name)} resistir con 1 PS!`);
            }
            if (attack.rockyHelmetDamage > 0) {
                updateBattlePokemonUI(attack.attacker, attackerSide, attack.attackerHpAfterRockyHelmet);
                if (attack.attacker === activePokemon) {
                    updateBattleTeamPokemonHp(activePokemon, attack.attackerHpAfterRockyHelmet);
                }
                effects.push(`${formatPokemonName(attack.attacker.name)} pierde ${attack.rockyHelmetDamage} PS por el Casco Dentado.`);
            }
            if (attack.sitrusHealing > 0) {
                updateBattlePokemonUI(attack.defender, defenderSide, attack.defenderHpAfterSitrus);
                if (attack.defender === activePokemon) {
                    updateBattleTeamPokemonHp(activePokemon, attack.defenderHpAfterSitrus);
                }
                effects.push(`${formatPokemonName(attack.defender.name)} recupera ${attack.sitrusHealing} PS con su Baya Zidra.`);
            }
            if (attack.lifeOrbRecoil > 0) {
                updateBattlePokemonUI(attack.attacker, attackerSide, attack.attackerHpAfterLifeOrb);
                if (attack.attacker === activePokemon) {
                    updateBattleTeamPokemonHp(activePokemon, attack.attackerHpAfterLifeOrb);
                }
                effects.push(`${formatPokemonName(attack.attacker.name)} pierde ${attack.lifeOrbRecoil} PS por la Vidasfera.`);
            }
            addBattleLogAttack(attack, effects);
            await wait(900);
        }
        if (turn.leftovers.pokemonA > 0) {
            updateBattlePokemonUI(activePokemon, "player", turn.leftovers.pokemonAHpAfterLeftovers);
            updateBattleTeamPokemonHp(activePokemon, turn.leftovers.pokemonAHpAfterLeftovers);
            addBattleLogMessage(`${formatPokemonName(activePokemon.name)} recupera ${turn.leftovers.pokemonA} PS con Restos.`, "item");
            await wait(500);
        }
        if (turn.leftovers.pokemonB > 0) {
            updateBattlePokemonUI(activeEnemyPokemon, "enemy", turn.leftovers.pokemonBHpAfterLeftovers);
            addBattleLogMessage(`${formatPokemonName(activeEnemyPokemon.name)} recupera ${turn.leftovers.pokemonB} PS con Restos.`, "item");
            await wait(500);
        }
    }
    if (result.winner) {
        addBattleLogResult(result.winner, result.loser);
        await wait(700);
    } else {
        addBattleLogDoubleFaint(activePokemon, activeEnemyPokemon);
        await wait(700);
    }
    if (result.maxRevive.pokemonA) {
        updateBattlePokemonUI(activePokemon, "player");
        addBattleLogMessage(`¡El Revivir Máximo de ${formatPokemonName(activePokemon.name)} se activa! ${formatPokemonName(activePokemon.name)} vuelve al combate con todos sus PS.`, "item");
        await wait(700);
    }
    if (result.maxRevive.pokemonB) {
        updateBattlePokemonUI(activeEnemyPokemon, "enemy");
        addBattleLogMessage(`¡El Revivir Máximo de ${formatPokemonName(activeEnemyPokemon.name)} se activa! ${formatPokemonName(activeEnemyPokemon.name)} vuelve al combate con todos sus PS.`, "item");
        await wait(700);
    }
    renderBattleTeam();
    updateEnemyPokeballs();
    const playerFainted = activePokemon.fainted;
    const enemyFainted = activeEnemyPokemon.fainted;
    if (!playerFainted && !enemyFainted) {
        resolveMatchupBtn.disabled = false;
        return;
    }
    if (enemyFainted && !hasLivingEnemyPokemon()) {
        activeEnemyPokemon = null;
        addBattleLogMessage(`¡Has derrotado a ${getCurrentTrainer().name}!`, "important");
        resolveMatchupBtn.disabled = true;
        if (gameMode === "adventure") {
            await (routeBattle ? handleRouteBattleWon() : handleAdventureTrainerDefeated());
        } else if (currentTrainer < TOTAL_TRAINERS) {
            await wait(1000);
            const trainer = runTrainers[currentTrainer - 1];
            const trainersLeft = TOTAL_TRAINERS - currentTrainer;
            document.querySelector("#defeatedTrainerName").textContent = trainer.name;
            document.querySelector("#defeatedProgress").textContent = trainersLeft === 1 ? "Solo queda 1 entrenador." : `Quedan ${trainersLeft} entrenadores.`;
            showScreen("#trainerDefeatedScreen");
        } else {
            await wait(1000);
            showResultScreen(true);
        }
        return;
    }
    if (playerFainted && !hasLivingPlayerPokemon()) {
        activePokemon = null;
        addBattleLogMessage("Tu equipo ha caído.", "important");
        resolveMatchupBtn.disabled = true;
        renderBattleTeam();
        await wait(1000);
        if (gameMode === "adventure") {
            if (routeBattle) {
                handleRouteBattleLost();
            } else {
                handleAdventureTeamDefeated();
            }
        } else {
            showResultScreen(false);
        }
        return;
    }
    if (enemyFainted) {
        const hasNextEnemy = showNextEnemyPokemon();
        if (hasNextEnemy) {
            addBattleLogMessage(`${formatPokemonName(activeEnemyPokemon.name)} entra al combate.`);
        }
    }
    if (playerFainted) {
        activePokemon = null;
        addBattleLogMessage("Elige otro Pokémon de tu equipo para continuar.", "important");
        renderBattleTeam();
        resolveMatchupBtn.disabled = true;
        return;
    }
    resolveMatchupBtn.disabled = false;
}

function selectBattlePokemon(pokemon) {
    if (!pokemon || pokemon.fainted) {
        return;
    }
    activePokemon = pokemon;
    playerPokemonNeedsEntry = true;
    updateBattlePokemonUI(activePokemon, "player");
    renderBattleTeam();
    document.querySelector("#resolveMatchupBtn").disabled = false;
    if (isMobileLayout()) {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

function updateBattleTeamPokemonHp(pokemon, currentHp) {
    const card = document.querySelector(`.battle-team-card[data-pokemon-id="${pokemon.id}"]`);
    if (!card) {
        return;
    }
    const hpBar = card.querySelector(".battle-team-hp-bar span");
    const hpText = card.querySelector(".battle-team-hp small");
    const hpPercentage = Math.max(0, (currentHp / pokemon.maxHp) * 100);
    hpBar.style.width = `${hpPercentage}%`;
    hpBar.classList.toggle("warning", hpPercentage > 25 && hpPercentage <= 50);
    hpBar.classList.toggle("critical", hpPercentage <= 25);
    hpText.textContent = `${currentHp} / ${pokemon.maxHp} PS`;
}

function renderBattleTeam() {
    const battleTeamGrid = document.querySelector("#battleTeamGrid");
    battleTeamGrid.innerHTML = "";
    updateResolveButton();
    selectedPokemon.forEach(pokemon => {
        const card = document.createElement("article");
        const hpPercentage = Math.max(0, (pokemon.currentHp / pokemon.maxHp) * 100);
        const hpClass = hpPercentage <= 25 ? "critical" : hpPercentage <= 50 ? "warning" : "";
        card.classList.add("pokemon-card", "battle-team-card");
        card.dataset.pokemonId = pokemon.id;
        if (pokemon === activePokemon) {
            card.classList.add("active");
        }
        if (pokemon.fainted) {
            card.classList.add("fainted");
        }
        const typesHtml = pokemon.types.map(type => `
            <span class="type" style="--type-color: var(--type-${type})">
                <img class="type-icon" src="https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg" alt="">
                ${formatTypeName(type)}
            </span>
        `).join("");
        const itemHtml = pokemon.item ? `
            <div class="battle-team-item" title="${pokemon.item.name}">
                <img src="${pokemon.item.sprite}" alt="">
                <span>${pokemon.item.name}</span>
            </div>
        ` : "";
        if (pokemon === activePokemon) {
            card.setAttribute("aria-current", "true");
        }
        card.innerHTML = `
            <img class="battle-team-sprite" src="${pokemon.sprite}" alt="${formatPokemonName(pokemon.name)}">
            <div class="battle-team-card-info">
                <div class="battle-team-name-row">
                    <h2>${formatPokemonName(pokemon.name)}</h2>
                    <div class="battle-team-hp">
                        <small>${pokemon.currentHp} / ${pokemon.maxHp} PS</small>
                    </div>
                </div>
                <div class="battle-team-meta-row">
                    <div class="pokemon-types">${typesHtml}</div>
                    ${itemHtml}
                </div>
                <div class="battle-team-hp-bar">
                    <span class="${hpClass}" style="width: ${hpPercentage}%"></span>
                </div>
            </div>
        `;
        if (!pokemon.fainted) {
            card.addEventListener("click", () => selectBattlePokemon(pokemon));
        }
        battleTeamGrid.appendChild(card);
    });
}

function getCurrentTrainer() {
    if (gameMode === "adventure") {
        return routeBattle ? routeBattle.trainer : getCurrentStageInfo().trainer;
    }
    return runTrainers[currentTrainer - 1];
}

function getTrainerProgressText() {
    if (gameMode === "adventure") {
        const region = getRegion(adventure.plan.regionIndex).region;
        if (routeBattle) {
            return `${region} · ${adventure.route.name} · Entrenador de la ruta`;
        }
        return `${region} · ${getCurrentStageInfo().progressText}`;
    }
    return `Entrenador ${currentTrainer} de ${TOTAL_TRAINERS}`;
}

function updateTrainerUI() {
    const trainerName = document.querySelector("#trainerName");
    const trainerSprite = document.querySelector("#trainerSprite");
    const trainer = getCurrentTrainer();
    trainerName.textContent = trainer.name;
    document.querySelector("#trainerProgress").textContent = getTrainerProgressText();
    trainerSprite.src = trainer.sprite;
    trainerSprite.alt = trainer.name;
}

function startTrainerBattle() {
    showScreen("#battleScreen");
}

function showTrainerIntro() {
    const trainer = getCurrentTrainer();
    const stages = document.querySelector("#trainerIntroStages");
    stages.classList.toggle("hidden", gameMode !== "adventure");
    if (gameMode === "adventure") {
        renderAdventureProgress("#trainerIntroStages", getStageMarkers(adventure.plan, adventure.stage), getStageLabels(adventure.plan.regionIndex));
    }
    document.querySelector("#trainerIntroSprite").src = trainer.sprite;
    document.querySelector("#trainerIntroSprite").alt = trainer.name;
    document.querySelector("#trainerIntroName").textContent = trainer.name;
    document.querySelector("#trainerIntroProgress").textContent = `${getTrainerProgressText()}.`;
    showScreen("#trainerIntroScreen");
}

function calculateRunScore(trainersDefeated) {
    const survivors = selectedPokemon.filter(pokemon => !pokemon.fainted).length;
    const totalKos = selectedPokemon.reduce((total, pokemon) => total + pokemon.matchupWins, 0);
    const currentHp = selectedPokemon.reduce((total, pokemon) => total + pokemon.currentHp, 0);
    const maxHp = selectedPokemon.reduce((total, pokemon) => total + pokemon.maxHp, 0);
    const maxRevivesUsed = selectedPokemon.reduce((total, pokemon) => total + pokemon.maxRevivesUsed, 0);
    const hpRatio = maxHp > 0 ? currentHp / maxHp : 0;
    return trainersDefeated * 1000 + survivors * 500 + Math.round(hpRatio * 2000) + totalKos * 100 - maxRevivesUsed * 300;
}

function getRunRank(score) {
    if (score >= 11000) {
        return "S";
    }
    if (score >= 9000) {
        return "A";
    }
    if (score >= 7000) {
        return "B";
    }
    return "C";
}

function formatVictories(count) {
    return `${count} ${count === 1 ? "victoria" : "victorias"}`;
}

function getMvpPokemon() {
    if (selectedPokemon.length === 0) {
        return null;
    }
    return selectedPokemon.reduce((mvp, pokemon) => {
        return pokemon.matchupWins > mvp.matchupWins ? pokemon : mvp;
    }, selectedPokemon[0]);
}

function renderResultTeam() {
    const resultTeam = document.querySelector("#resultTeam");
    const mvp = getMvpPokemon();
    resultTeam.innerHTML = "";
    selectedPokemon.forEach(pokemon => {
        const card = document.createElement("article");
        const hpPercentage = Math.max(0, (pokemon.currentHp / pokemon.maxHp) * 100);
        card.classList.add("end-team-card");
        if (pokemon.fainted) {
            card.classList.add("fainted");
        }
        if (mvp && pokemon.id === mvp.id) {
            card.classList.add("mvp");
        }
        const itemHtml = pokemon.item ? `
            <div class="end-team-item">
                <img src="${pokemon.item.sprite}" alt="">
                <span>${pokemon.item.name}</span>
            </div>
        ` : `
            <div class="end-team-item empty">
                <span>Sin objeto</span>
            </div>
        `;
        card.innerHTML = `
            <div class="end-team-pokemon-wrap">
                ${mvp && pokemon.id === mvp.id ? '<span class="end-team-mvp-badge">MVP</span>' : ""}
                <img class="end-team-pokemon" src="${pokemon.sprite}" alt="${formatPokemonName(pokemon.name)}">
                ${pokemon.fainted ? '<span class="end-fainted-badge">Debilitado</span>' : ""}
            </div>
            <h3>${formatPokemonName(pokemon.name)}</h3>
            <div class="end-team-hp">
                <div class="end-team-hp-bar">
                    <span style="width: ${hpPercentage}%"></span>
                </div>
                <small>${pokemon.currentHp} / ${pokemon.maxHp} PS</small>
            </div>
            ${itemHtml}
            <div class="end-team-kos">${formatVictories(pokemon.matchupWins)}</div>
        `;
        resultTeam.appendChild(card);
    });
}

function showResultScreen(victory) {
    const trainersDefeated = victory ? TOTAL_TRAINERS : currentTrainer - 1;
    const survivors = selectedPokemon.filter(pokemon => !pokemon.fainted).length;
    const totalKos = selectedPokemon.reduce((total, pokemon) => total + pokemon.matchupWins, 0);
    const currentHp = selectedPokemon.reduce((total, pokemon) => total + pokemon.currentHp, 0);
    const maxHp = selectedPokemon.reduce((total, pokemon) => total + pokemon.maxHp, 0);
    const maxRevivesUsed = selectedPokemon.reduce((total, pokemon) => total + pokemon.maxRevivesUsed, 0);
    const hpPercentage = maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0;
    const score = calculateRunScore(trainersDefeated);
    const rank = getRunRank(score);
    lastRunResult = {
        victory,
        trainersDefeated,
        survivors,
        totalKos,
        currentHp,
        maxHp,
        hpPercentage,
        maxRevivesUsed,
        score,
        rank
    };
    document.querySelector("#battleScreen").classList.add("hidden");
    document.querySelector("#trainerIntroScreen").classList.add("hidden");
    document.querySelector("#trainerDefeatedScreen").classList.add("hidden");
    document.querySelector("#resultScreen").classList.remove("hidden");
    const resultCard = document.querySelector("#resultCard");
    resultCard.classList.toggle("is-loss", !victory);
    document.querySelector("#resultTitle").textContent = victory ? "¡Victoria!" : "Derrota";
    document.querySelector("#resultMessage").textContent = victory ? "¡Enhorabuena, has vencido a los 5 entrenadores!" : `Tu equipo ha caído ante ${runTrainers[currentTrainer - 1].name}.`;
    document.querySelector("#resultScore").textContent = score;
    document.querySelector("#resultRank").textContent = rank;
    const resultStats = document.querySelector("#resultStats");
    resultStats.innerHTML = `
        <div class="end-stat">
            <span>Entrenadores</span>
            <strong>${trainersDefeated} / ${TOTAL_TRAINERS}</strong>
        </div>
        <div class="end-stat">
            <span>Supervivientes</span>
            <strong>${survivors} / ${TEAM_SIZE}</strong>
        </div>
        <div class="end-stat">
            <span>Victorias 1v1</span>
            <strong>${totalKos}</strong>
        </div>
        <div class="end-stat">
            <span>PS restantes</span>
            <strong>${hpPercentage}%</strong>
        </div>
    `;
    renderResultTeam();
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
}

const CARD_FONT = "Manrope, Arial, sans-serif";
const CARD_COLORS = {
    background: "#000000",
    surface: "#161618",
    text: "#f5f5f7",
    muted: "#a1a1a6",
    accent: "#2997ff"
};

function drawCanvasStat(ctx, label, value, x, y, width) {
    ctx.fillStyle = CARD_COLORS.surface;
    drawRoundedRect(ctx, x, y, width, 118, 24);
    ctx.textAlign = "center";
    ctx.fillStyle = CARD_COLORS.muted;
    ctx.font = `600 17px ${CARD_FONT}`;
    ctx.fillText(label, x + width / 2, y + 40);
    ctx.fillStyle = CARD_COLORS.text;
    ctx.font = `700 34px ${CARD_FONT}`;
    ctx.fillText(value, x + width / 2, y + 86);
}

async function downloadResultCard() {
    if (!lastRunResult) {
        return;
    }
    await Promise.all(["600 16px Manrope", "700 16px Manrope", "800 16px Manrope"].map(font => document.fonts.load(font)));
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    const mvp = getMvpPokemon();
    ctx.fillStyle = CARD_COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = CARD_COLORS.text;
    ctx.font = `800 76px ${CARD_FONT}`;
    ctx.fillText(lastRunResult.victory ? "¡Victoria!" : "Derrota", 540, 140);
    ctx.fillStyle = CARD_COLORS.muted;
    ctx.font = `600 22px ${CARD_FONT}`;
    ctx.fillText(lastRunResult.victory ? "Run completada" : "Run finalizada", 540, 186);
    ctx.fillStyle = lastRunResult.victory ? CARD_COLORS.accent : CARD_COLORS.text;
    ctx.font = `800 150px ${CARD_FONT}`;
    ctx.fillText(lastRunResult.rank, 540, 345);
    ctx.fillStyle = CARD_COLORS.muted;
    ctx.font = `600 20px ${CARD_FONT}`;
    ctx.fillText(`Rango · ${lastRunResult.score} puntos`, 540, 388);
    drawCanvasStat(ctx, "Entrenadores", `${lastRunResult.trainersDefeated} / ${TOTAL_TRAINERS}`, 75, 430, 285);
    drawCanvasStat(ctx, "Supervivientes", `${lastRunResult.survivors} / ${TEAM_SIZE}`, 397.5, 430, 285);
    drawCanvasStat(ctx, "Victorias 1v1", `${lastRunResult.totalKos}`, 720, 430, 285);
    ctx.fillStyle = CARD_COLORS.text;
    ctx.font = `700 26px ${CARD_FONT}`;
    ctx.textAlign = "left";
    ctx.fillText("Equipo de la run", 75, 605);
    const pokemonImages = await Promise.all(selectedPokemon.map(pokemon => loadImage(pokemon.sprite).catch(() => null)));
    selectedPokemon.forEach((pokemon, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const x = 75 + column * 322.5;
        const y = 635 + row * 280;
        const width = 285;
        const height = 260;
        ctx.fillStyle = CARD_COLORS.surface;
        drawRoundedRect(ctx, x, y, width, height, 24);
        ctx.save();
        if (pokemon.fainted) {
            ctx.globalAlpha = 0.32;
        }
        if (pokemonImages[index]) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(pokemonImages[index], x + 57.5, y + 8, 170, 170);
        }
        ctx.restore();
        ctx.textAlign = "center";
        ctx.fillStyle = CARD_COLORS.text;
        ctx.font = `700 24px ${CARD_FONT}`;
        ctx.fillText(formatPokemonName(pokemon.name), x + width / 2, y + 196);
        ctx.fillStyle = pokemon === mvp ? CARD_COLORS.accent : CARD_COLORS.muted;
        ctx.font = `600 16px ${CARD_FONT}`;
        const detail = `${pokemon.currentHp} / ${pokemon.maxHp} PS · ${formatVictories(pokemon.matchupWins)}`;
        ctx.fillText(pokemon === mvp ? `MVP · ${detail}` : detail, x + width / 2, y + 230);
    });
    ctx.textAlign = "center";
    ctx.fillStyle = CARD_COLORS.muted;
    ctx.font = `700 18px ${CARD_FONT}`;
    ctx.fillText("PokéBattle", 540, 1260);
    const link = document.createElement("a");
    link.download = `pokemon-run-${lastRunResult.victory ? "victoria" : "derrota"}-${lastRunResult.score}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function startNewRun() {
    window.location.reload();
}

async function startRun() {
    await loadEnemyTeam();
    document.querySelector("#itemScreen").classList.add("hidden");
    currentTrainer = 1;
    runTrainers = getRandomTrainers(TOTAL_TRAINERS);
    updateTrainerUI();
    activePokemon = selectedPokemon[0];
    playerPokemonNeedsEntry = true;
    updateBattlePokemonUI(activePokemon, "player");
    renderBattleTeam();
    showTrainerIntro();
}

function renderAdventureModeCard() {
    const saved = loadAdventure();
    const continueBtn = document.querySelector("#adventureContinueBtn");
    const newBtn = document.querySelector("#adventureNewBtn");
    const text = document.querySelector("#adventureModeText");
    continueBtn.classList.toggle("hidden", !saved);
    newBtn.classList.toggle("secondary-button", Boolean(saved));
    if (!saved) {
        text.textContent = "Empieza en Kanto con un compañero, vence a los 8 líderes y al Alto Mando, y viaja a la siguiente región.";
        return;
    }
    const region = getRegion(saved.plan.regionIndex).region;
    const nextTrainer = getStageInfo(saved.plan, saved.stage, saved.starterSlot).trainer.name;
    const badges = saved.badges ?? 0;
    text.textContent = `Partida guardada en ${region}: ${badges} ${badges === 1 ? "medalla" : "medallas"}, ${saved.team.length} Pokémon y ${formatMoney(saved.money ?? START_MONEY)}. Próximo combate: ${nextTrainer}.`;
}

function getCurrentStageInfo() {
    return getStageInfo(adventure.plan, adventure.stage, adventure.starterSlot);
}

function saveCurrentAdventure() {
    saveAdventure({
        plan: adventure.plan,
        stage: adventure.stage,
        badges: adventure.badges,
        starterSlot: adventure.starterSlot,
        money: adventure.money,
        bag: adventure.bag,
        route: adventure.route,
        team: selectedPokemon
    });
}

async function startNewAdventure() {
    if (loadAdventure() && !window.confirm("¿Empezar una aventura nueva? Se borrará la partida guardada.")) {
        return;
    }
    gameMode = "adventure";
    adventure = { plan: createRegionPlan(0), stage: 0, badges: 0, starterSlot: 0, money: START_MONEY, bag: [], route: null };
    selectedPokemon = [];
    selectedStarter = null;
    const [starters, startingItems] = await withLoading("Buscando compañeros...", () => Promise.all([
        Promise.all(getStarterIds(0).map(id => getPokemon(id))),
        getRandomItemOffer()
    ]));
    starterOffer = starters;
    // Se empieza con tres objetos normales en la mochila
    adventure.bag = startingItems.filter(item => !item.rare).slice(0, 3).map(createBagItem);
    document.querySelector("#starterMessage").textContent = `Tu aventura empieza en ${getRegion(0).region} con uno de estos tres Pokémon.`;
    renderStarterSelection();
    showScreen("#adventureStarterScreen");
}

function renderStarterSelection() {
    renderPokemonCards(starterOffer, selectedStarter ? [selectedStarter] : [], pokemon => {
        selectedStarter = pokemon;
        renderStarterSelection();
    }, "#starterGrid");
    document.querySelector("#confirmStarterBtn").disabled = !selectedStarter;
}

function confirmStarter() {
    if (!selectedStarter) {
        return;
    }
    selectedPokemon = [selectedStarter];
    adventure.starterSlot = starterOffer.indexOf(selectedStarter);
    saveCurrentAdventure();
    showAdventureItems(enterRoute);
}

function getAdventureItems() {
    const equippedItems = selectedPokemon.filter(pokemon => pokemon.item).map(pokemon => pokemon.item);
    return [...adventure.bag.filter(item => !item.medicine), ...equippedItems];
}

function showAdventureItems(onContinue) {
    itemsContinuation = onContinue;
    selectedItemPokemonId = selectedPokemon[0]?.id ?? null;
    document.querySelector("#startRunBtn").textContent = "Continuar";
    document.querySelector("#itemOfferTitle").textContent = "Tu mochila";
    renderItemSelection();
    showScreen("#itemScreen");
}

async function continueAdventure() {
    const saved = loadAdventure();
    if (!saved) {
        renderAdventureModeCard();
        return;
    }
    gameMode = "adventure";
    adventure = {
        plan: saved.plan,
        stage: saved.stage,
        badges: saved.badges ?? 0,
        starterSlot: saved.starterSlot ?? 0,
        money: saved.money ?? START_MONEY,
        bag: saved.bag ?? [],
        route: saved.route ?? null
    };
    selectedPokemon = saved.team;
    if (adventure.route) {
        showRoute();
        return;
    }
    await startAdventureStage();
}

async function startAdventureBattle(fetchTeam) {
    await loadEnemyTeam(fetchTeam);
    updateTrainerUI();
    activePokemon = selectedPokemon.find(pokemon => !pokemon.fainted) ?? selectedPokemon[0];
    playerPokemonNeedsEntry = true;
    updateBattlePokemonUI(activePokemon, "player");
    renderBattleTeam();
    document.querySelector("#battleLog").innerHTML = "";
    addBattleLogMessage(`Comienza el combate contra ${getCurrentTrainer().name}.`, "important");
    addBattleLogMessage(`${formatPokemonName(activeEnemyPokemon.name)} entra al combate.`);
    document.querySelector("#resolveMatchupBtn").disabled = false;
    showTrainerIntro();
}

async function startAdventureStage() {
    routeBattle = null;
    const { team } = getCurrentStageInfo();
    await startAdventureBattle(() => Promise.all(team.map(name => getPokemon(name))));
}

function showAdventureMessage({ title, text, buttonText, progress, onContinue }) {
    document.querySelector("#adventureMessageTitle").textContent = title;
    document.querySelector("#adventureMessageText").textContent = text;
    document.querySelector("#adventureMessageBtn").textContent = buttonText;
    renderAdventureProgress("#adventureMessageStages", getStageMarkers(progress.plan, progress.stage), getStageLabels(progress.plan.regionIndex));
    adventureMessageAction = onContinue;
    showScreen("#adventureMessageScreen");
}

function getCurrentProgress() {
    return { plan: adventure.plan, stage: adventure.stage };
}

function formatBadgesLeft(badgesLeft, league) {
    if (badgesLeft === 0) {
        return `Ya puedes retar ${league.leagueTo}.`;
    }
    return badgesLeft === 1 ? "Te falta 1 medalla." : `Te faltan ${badgesLeft} medallas.`;
}

async function handleAdventureTrainerDefeated() {
    const info = getCurrentStageInfo();
    const regionIndex = adventure.plan.regionIndex;
    const region = getRegion(regionIndex).region;
    const league = getLeague(regionIndex);
    const reward = getBattleReward(info.kind, adventure.stage);
    adventure.money += reward;
    await wait(1000);
    if (info.kind === "gym") {
        adventure.badges++;
        adventure.stage++;
        healTeam(selectedPokemon);
        saveCurrentAdventure();
        showAdventureMessage({
            title: "Medalla conseguida",
            text: `Has vencido a ${info.trainer.name} y ganas ${formatMoney(reward)}. Tu equipo se ha curado en el Centro Pokémon. ${formatBadgesLeft(getLeagueStart(regionIndex) - adventure.stage, league)}`,
            buttonText: "Elegir recompensa",
            progress: getCurrentProgress(),
            onContinue: () => showAdventureReward({ onDone: () => showAdventureItems(enterRoute) })
        });
        return;
    }
    if (info.kind === "elite") {
        adventure.stage++;
        saveCurrentAdventure();
        const isLastMember = adventure.stage === getStageCount(regionIndex) - 1;
        showAdventureMessage({
            title: "Combate ganado",
            text: `Has vencido a ${info.trainer.name} y ganas ${formatMoney(reward)}. ${isLastMember ? "Solo queda el combate por el campeonato." : `Te espera el siguiente combate ${league.leagueOf}.`} En la Liga tu equipo no se cura entre combates.`,
            buttonText: isLastMember ? "Retar al campeonato" : "Siguiente combate",
            progress: getCurrentProgress(),
            onContinue: startAdventureStage
        });
        return;
    }
    healTeam(selectedPokemon);
    const completedPlan = adventure.plan;
    if (isLastRegion(regionIndex)) {
        clearAdventure();
        showAdventureMessage({
            title: `Liga de ${region} superada`,
            text: `Has vencido a ${info.trainer.name} y has completado todas las regiones. ¡Enhorabuena!`,
            buttonText: "Volver al inicio",
            progress: { plan: completedPlan, stage: getStageCount(regionIndex) },
            onContinue: startNewRun
        });
        return;
    }
    const nextRegion = getRegion(regionIndex + 1).region;
    adventure.plan = createRegionPlan(regionIndex + 1);
    adventure.stage = 0;
    saveCurrentAdventure();
    showAdventureMessage({
        title: `Liga de ${region} superada`,
        text: `Has vencido a ${info.trainer.name} y ganas ${formatMoney(reward)}. Tu equipo se ha curado y tu viaje continúa en ${nextRegion}.`,
        buttonText: `Viajar a ${nextRegion}`,
        progress: { plan: completedPlan, stage: getStageCount(regionIndex) },
        onContinue: () => showAdventureReward({ onDone: () => showAdventureItems(enterRoute) })
    });
}

function handleAdventureTeamDefeated() {
    const info = getCurrentStageInfo();
    const inLeague = info.kind !== "gym";
    healTeam(selectedPokemon);
    if (inLeague) {
        adventure.stage = getLeagueStart(adventure.plan.regionIndex);
    }
    saveCurrentAdventure();
    showAdventureMessage({
        title: "Tu equipo se ha debilitado",
        text: inLeague
            ? `${info.trainer.name} te ha vencido. Tu equipo se ha curado, pero tendrás que volver a empezar la Liga.`
            : `${info.trainer.name} te ha vencido. Tu equipo se ha curado en el Centro Pokémon y, antes de volver a intentarlo, puedes buscar refuerzos.`,
        buttonText: inLeague ? "Volver a la Liga" : "Buscar refuerzos",
        progress: getCurrentProgress(),
        // Tras perder contra un líder se puede sumar un Pokémon, para no quedarse atascado
        onContinue: inLeague ? startAdventureStage : () => showAdventureReward({ onDone: () => showAdventureItems(startAdventureStage) })
    });
}

async function showAdventureReward({ count = 3, message = null, onDone }) {
    const region = getRegion(adventure.plan.regionIndex).region;
    const pool = getRewardPool(adventure.plan.regionIndex, selectedPokemon);
    rewardOffer = await withLoading("Buscando Pokémon...", () => getPokemonFromPools(count, [pool]));
    rewardContinuation = onDone;
    selectedRewardId = null;
    replacedPokemonId = null;
    const defaultMessage = selectedPokemon.length < MAX_TEAM_SIZE
        ? `Elige un Pokémon de ${region} para unirlo a tu equipo (${selectedPokemon.length} de ${MAX_TEAM_SIZE}).`
        : `Elige un Pokémon de ${region} si quieres cambiarlo por uno de tu equipo.`;
    document.querySelector("#rewardMessage").textContent = message ?? defaultMessage;
    renderAdventureReward();
    showScreen("#adventureRewardScreen");
}

function renderAdventureReward() {
    const teamIsFull = selectedPokemon.length >= MAX_TEAM_SIZE;
    const selectedReward = rewardOffer.find(pokemon => pokemon.id === selectedRewardId);
    renderPokemonCards(rewardOffer, selectedReward ? [selectedReward] : [], pokemon => {
        selectedRewardId = pokemon.id;
        renderAdventureReward();
    }, "#rewardGrid");
    document.querySelector("#rewardReplaceSection").classList.toggle("hidden", !teamIsFull);
    if (teamIsFull) {
        const replaced = selectedPokemon.find(pokemon => pokemon.id === replacedPokemonId);
        renderPokemonCards(selectedPokemon, replaced ? [replaced] : [], pokemon => {
            replacedPokemonId = pokemon.id;
            renderAdventureReward();
        }, "#rewardTeamGrid");
    }
    const acceptRewardBtn = document.querySelector("#acceptRewardBtn");
    acceptRewardBtn.textContent = teamIsFull ? "Sustituir" : "Añadir al equipo";
    acceptRewardBtn.disabled = !selectedReward || (teamIsFull && !replacedPokemonId);
}

function acceptAdventureReward() {
    const reward = rewardOffer.find(pokemon => pokemon.id === selectedRewardId);
    if (!reward) {
        return;
    }
    if (selectedPokemon.length >= MAX_TEAM_SIZE) {
        const replaced = selectedPokemon.find(pokemon => pokemon.id === replacedPokemonId);
        if (!replaced) {
            return;
        }
        // El objeto del Pokémon que se va vuelve a la mochila
        if (replaced.item) {
            adventure.bag.push(replaced.item);
        }
        selectedPokemon = selectedPokemon.map(pokemon => pokemon === replaced ? reward : pokemon);
    } else {
        selectedPokemon = [...selectedPokemon, reward];
    }
    saveCurrentAdventure();
    rewardContinuation();
}

async function handleItemScreenContinue() {
    if (gameMode === "adventure") {
        saveCurrentAdventure();
        await itemsContinuation();
        return;
    }
    await startRun();
}

// ---------- Rutas ----------

function enterRoute() {
    adventure.route = createRoute(getRouteName(adventure.stage, getLeagueStart(adventure.plan.regionIndex)));
    saveCurrentAdventure();
    showRoute();
}

function advanceRoute() {
    adventure.route.index++;
    saveCurrentAdventure();
}

function showRoute() {
    const route = adventure.route;
    if (route.index >= ROUTE_LENGTH) {
        adventure.route = null;
        saveCurrentAdventure();
        startAdventureStage();
        return;
    }
    const nextTrainer = getCurrentStageInfo().trainer.name;
    document.querySelector("#routeTitle").textContent = route.name;
    document.querySelector("#routeMessage").textContent = `Parada ${route.index + 1} de ${ROUTE_LENGTH} de camino a ${nextTrainer}. Elige por dónde seguir.`;
    document.querySelector("#routeMoney").textContent = formatMoney(adventure.money);
    renderRouteOptions("#routeOptions", route.steps[route.index], chooseRouteNode);
    renderRouteTeam("#routeTeam", selectedPokemon);
    showScreen("#routeScreen");
}

function showRouteMessage(title, text) {
    showAdventureMessage({ title, text, buttonText: "Seguir por la ruta", progress: getCurrentProgress(), onContinue: showRoute });
}

async function chooseRouteNode(type) {
    if (type === "trainer") {
        await startRouteTrainerBattle();
        return;
    }
    if (type === "shop") {
        await openShop();
        return;
    }
    if (type === "center") {
        healTeam(selectedPokemon);
        advanceRoute();
        showRouteMessage("Centro Pokémon", "Tu equipo ha recuperado todos sus PS.");
        return;
    }
    await runRouteEvent();
}

async function startRouteTrainerBattle() {
    const [trainer] = getRandomTrainers(1);
    const pool = getIdsInGenerations([getRegion(adventure.plan.regionIndex).id]);
    routeBattle = { trainer: { name: trainer.name, sprite: trainer.sprite }, reward: getRouteTrainerReward(adventure.stage) };
    await startAdventureBattle(() => getPokemonFromPools(getRouteTrainerTeamSize(adventure.stage), [pool]));
}

async function handleRouteBattleWon() {
    const { trainer, reward } = routeBattle;
    routeBattle = null;
    adventure.money += reward;
    advanceRoute();
    await wait(1000);
    showRouteMessage("Combate ganado", `Has vencido a ${trainer.name} y ganas ${formatMoney(reward)}. Tu equipo conserva los PS que le quedan.`);
}

function handleRouteBattleLost() {
    const { trainer } = routeBattle;
    routeBattle = null;
    const lostMoney = Math.floor(adventure.money / 2);
    adventure.money -= lostMoney;
    healTeam(selectedPokemon);
    advanceRoute();
    showRouteMessage("Tu equipo se ha debilitado", `${trainer.name} te ha vencido y pierdes ${formatMoney(lostMoney)}. Te llevan al Centro Pokémon, donde tu equipo se recupera.`);
}

async function runRouteEvent() {
    const event = pickEvent();
    const region = getRegion(adventure.plan.regionIndex).region;
    // El combate avanza la ruta al terminar, como una parada de entrenador
    if (event === "trainer") {
        await startRouteTrainerBattle();
        return;
    }
    advanceRoute();
    if (event === "wild") {
        await showAdventureReward({
            count: 2,
            message: `Dos Pokémon salvajes de ${region} se acercan. Si quieres, uno puede unirse a tu equipo.`,
            onDone: showRoute
        });
        return;
    }
    const offer = await withLoading("Buscando...", getRandomItemOffer);
    const item = createBagItem(offer.find(candidate => !candidate.rare) ?? offer[0]);
    adventure.bag.push(item);
    saveCurrentAdventure();
    showRouteMessage("Objeto encontrado", `Has encontrado ${item.name} entre la hierba. Ya está en tu mochila.`);
}

// ---------- Tienda ----------

async function openShop() {
    const [offer, medicineSprites] = await withLoading("Abriendo la tienda...", () => Promise.all([
        getRandomItemOffer(),
        Promise.all(MEDICINES.map(medicine => getItem(medicine.id)))
    ]));
    shopProducts = [
        ...offer.slice(0, 4).map(item => ({ ...item, kind: "item", price: getItemPrice(item), sold: false })),
        ...MEDICINES.map((medicine, index) => ({ ...medicine, kind: "medicine", sprite: medicineSprites[index].sprite }))
    ];
    renderShopScreen();
    showScreen("#shopScreen");
}

function renderShopScreen() {
    document.querySelector("#shopMoney").textContent = formatMoney(adventure.money);
    renderShop("#shopGrid", shopProducts, adventure.money, buyProduct);
}

function buyProduct(product) {
    if (product.sold || adventure.money < product.price) {
        return;
    }
    adventure.money -= product.price;
    if (product.kind === "item") {
        const { kind, price, sold, ...item } = product;
        adventure.bag.push(createBagItem(item));
        product.sold = true;
    } else {
        const { id, name, description, sprite } = product;
        adventure.bag.push(createBagItem({ id, name, description, sprite, medicine: true }));
    }
    saveCurrentAdventure();
    renderShopScreen();
}

function leaveShop() {
    advanceRoute();
    showRoute();
}

init();