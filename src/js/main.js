import { getUniqueRandomPokemon, getRandomItemOffer } from "./api/pokeapi.js";
import { renderPokemonCards } from "./ui/pokemon-cards.js";
import { renderItemTeam, renderItemOffer } from "./ui/item-selection.js";
import { resolveMatchup } from "./game/battle.js";
import { getRandomTrainers } from "./data/trainers.js";
import { formatPokemonName, formatTypeName } from "./utils/formatters.js";
import { FINAL_EVOLUTION_IDS } from "./data/final-evolutions.js";
import { ALL_GENERATION_IDS, getIdsInGenerations } from "./data/generations.js";
import { renderGenerationFilter } from "./ui/generation-filter.js";

const TEAM_SIZE = 6;
const TOTAL_TRAINERS = 5;
const CLASSIC_GENERATIONS_KEY = "pokebattle.classicGenerations";
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
let classicGenerationIds = loadClassicGenerations();
let playerPokemonPool = FINAL_EVOLUTION_IDS;
let enemyPokemonPool = null;

function loadClassicGenerations() {
    try {
        const saved = JSON.parse(localStorage.getItem(CLASSIC_GENERATIONS_KEY));
        if (Array.isArray(saved) && saved.length > 0 && saved.every(id => ALL_GENERATION_IDS.includes(id))) {
            return saved;
        }
    } catch (error) {
        console.warn(error);
    }
    return [...ALL_GENERATION_IDS];
}

function saveClassicGenerations() {
    try {
        localStorage.setItem(CLASSIC_GENERATIONS_KEY, JSON.stringify(classicGenerationIds));
    } catch (error) {
        console.warn(error);
    }
}

function showScreen(selector) {
    document.querySelectorAll("main > section").forEach(section => {
        section.classList.toggle("hidden", !section.matches(selector));
    });
    window.scrollTo(0, 0);
}

function showClassicSetup() {
    renderClassicSetup();
    showScreen("#classicSetupScreen");
}

function renderClassicSetup() {
    renderGenerationFilter(classicGenerationIds, toggleClassicGeneration);
    const count = classicGenerationIds.length;
    document.querySelector("#generationCount").textContent = `${count} de ${ALL_GENERATION_IDS.length} generaciones`;
    document.querySelector("#startClassicBtn").disabled = count === 0;
}

function toggleClassicGeneration(generationId) {
    if (classicGenerationIds.includes(generationId)) {
        classicGenerationIds = classicGenerationIds.filter(id => id !== generationId);
    } else {
        classicGenerationIds = [...classicGenerationIds, generationId].sort((a, b) => a - b);
    }
    saveClassicGenerations();
    renderClassicSetup();
}

function setAllClassicGenerations(selectAll) {
    classicGenerationIds = selectAll ? [...ALL_GENERATION_IDS] : [];
    saveClassicGenerations();
    renderClassicSetup();
}

async function startClassicSelection() {
    if (classicGenerationIds.length === 0) {
        return;
    }
    playerPokemonPool = getIdsInGenerations(classicGenerationIds, FINAL_EVOLUTION_IDS);
    enemyPokemonPool = getIdsInGenerations(classicGenerationIds);
    selectedPokemon = [];
    pokemonOffer = await withLoading("Buscando Pokémon salvajes...", () => getUniqueRandomPokemon(12, 2, playerPokemonPool));
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
    renderItemTeam(selectedPokemon, selectedItemPokemonId, selectItemPokemon);
    renderItemOffer(itemOffer, selectedPokemon, equipItem);
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
    pokemon.item = item;
    renderItemSelection();
}

function init() {
    document.querySelector("#classicModeBtn").addEventListener("click", showClassicSetup);
    document.querySelector("#backToModesBtn").addEventListener("click", () => showScreen("#modeScreen"));
    document.querySelector("#startClassicBtn").addEventListener("click", startClassicSelection);
    document.querySelector("#selectAllGenerationsBtn").addEventListener("click", () => setAllClassicGenerations(true));
    document.querySelector("#clearGenerationsBtn").addEventListener("click", () => setAllClassicGenerations(false));
    const continueBtn = document.querySelector("#continueBtn");
    continueBtn.addEventListener("click", confirmTeam);
    const startRunBtn = document.querySelector("#startRunBtn");
    startRunBtn.addEventListener("click", startRun);
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

async function loadEnemyTeam() {
    enemyTeam = await withLoading("Buscando al siguiente rival...", () => getUniqueRandomPokemon(6, 2, enemyPokemonPool));
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
        <span class="type" style="--type-color: var(--type-${type})">
            <img class="type-icon" src="https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg" alt="">
            ${formatTypeName(type)}
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
    addBattleLogMessage(`Comienza el combate contra el Entrenador ${currentTrainer}.`, "important");
    addBattleLogMessage(`${formatPokemonName(activeEnemyPokemon.name)} entra al combate.`);
    document.querySelector("#resolveMatchupBtn").disabled = false;
    showTrainerIntro();
}

async function handleResolveMatchup() {
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
        addBattleLogMessage(`¡Has derrotado al Entrenador ${currentTrainer}!`, "important");
        resolveMatchupBtn.disabled = true;
        if (currentTrainer < TOTAL_TRAINERS) {
            await wait(1000);
            const trainer = runTrainers[currentTrainer - 1];
            const trainersLeft = TOTAL_TRAINERS - currentTrainer;
            document.querySelector("#defeatedTrainerName").textContent = trainer.name;
            document.querySelector("#defeatedProgress").textContent = trainersLeft === 1 ? "Solo queda 1 entrenador." : `Quedan ${trainersLeft} entrenadores.`;
            document.querySelector("#battleScreen").classList.add("hidden");
            document.querySelector("#trainerDefeatedScreen").classList.remove("hidden");
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
        showResultScreen(false);
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

function updateTrainerUI() {
    const trainerName = document.querySelector("#trainerName");
    const trainerSprite = document.querySelector("#trainerSprite");
    const trainer = runTrainers[currentTrainer - 1];
    trainerName.textContent = trainer.name;
    document.querySelector("#trainerProgress").textContent = `Entrenador ${currentTrainer} de ${TOTAL_TRAINERS}`;
    trainerSprite.src = trainer.sprite;
    trainerSprite.alt = trainer.name;
}

function startTrainerBattle() {
    document.querySelector("#trainerIntroScreen").classList.add("hidden");
    document.querySelector("#battleScreen").classList.remove("hidden");
}

function showTrainerIntro() {
    const trainer = runTrainers[currentTrainer - 1];
    document.querySelector("#trainerIntroSprite").src = trainer.sprite;
    document.querySelector("#trainerIntroSprite").alt = trainer.name;
    document.querySelector("#trainerIntroName").textContent = trainer.name;
    document.querySelector("#trainerIntroProgress").textContent = `Entrenador ${currentTrainer} de ${TOTAL_TRAINERS}.`;
    document.querySelector("#trainerIntroScreen").classList.remove("hidden");
    document.querySelector("#battleScreen").classList.add("hidden");
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

init();