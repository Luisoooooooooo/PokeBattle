import { getUniqueRandomPokemon, getRandomItemOffer } from "./api/pokeapi.js";
import { renderPokemonCards } from "./ui/pokemon-cards.js";
import { renderItemTeam, renderItemOffer } from "./ui/item-selection.js";
import { resolveMatchup } from "./game/battle.js";
import { getRandomTrainers } from "./data/trainers.js";
import { formatPokemonName, formatTypeName } from "./utils/formatters.js";

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
    itemOffer = await getRandomItemOffer();
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

async function init() {
    try {
        pokemonOffer = await getUniqueRandomPokemon(12, 2);
        renderPokemonCards(pokemonOffer, selectedPokemon, togglePokemonSelection);
        updateSelectionUI();
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
    } catch (error) {
        console.error(error);
    }
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
        <span class="log-result-label">${playerWon ? "RIVAL DEBILITADO" : "TU POKÉMON SE DEBILITÓ"}</span>
        <strong class="log-result-name">${formatPokemonName(loser.name)}</strong>
        <span class="log-result-detail">${formatPokemonName(winner.name)} gana el enfrentamiento</span>
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
    document.querySelector("#trainerDefeatedScreen").classList.add("hidden");
    currentTrainer++;
    updateTrainerUI();
    enemyTeam = await getUniqueRandomPokemon(6, 2);
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
                updateBattlePokemonUI(attack.defender, defenderSide, attack.defenderHpAfterSitrus);
                if (attack.defender === activePokemon) {
                    updateBattleTeamPokemonHp(activePokemon, attack.defenderHpAfterSitrus);
                }
                effects.push(`${formatPokemonName(attack.defender.name)} recupera ${attack.sitrusHealing} PS con su Baya Zidra.`);
            }
            if (attack.lifeOrbRecoil > 0) {
                updateBattlePokemonUI(attack.attacker, attackerSide, attack.attackerHpAfterLifeOrb);
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
    if (result.winner) {
        if (result.winner === activePokemon) {
            if (!hasLivingEnemyPokemon()) {
                activeEnemyPokemon = null;
                addBattleLogMessage(`¡Has derrotado al Entrenador ${currentTrainer}!`, "important");
                resolveMatchupBtn.disabled = true;
                if (currentTrainer < TOTAL_TRAINERS) {
                    await wait(1000);
                    const trainer = runTrainers[currentTrainer - 1];
                    document.querySelector("#defeatedTrainerName").textContent = trainer.name;
                    document.querySelector("#battleScreen").classList.add("hidden");
                    document.querySelector("#trainerDefeatedScreen").classList.remove("hidden");
                } else {
                    await wait(1000);
                    showResultScreen(true);
                }
                return;
            }
            const hasNextEnemy = showNextEnemyPokemon();
            if (hasNextEnemy) {
                addBattleLogMessage(`${formatPokemonName(activeEnemyPokemon.name)} entra al combate.`);
                resolveMatchupBtn.disabled = false;
            }
        }
        if (result.loser === activePokemon) {
            if (!hasLivingPlayerPokemon()) {
                activePokemon = null;
                addBattleLogMessage("Tu equipo ha caído.", "important");
                resolveMatchupBtn.disabled = true;
                renderBattleTeam();
                await wait(1000);
                showResultScreen(false);
                return;
            }
            activePokemon = null;
            addBattleLogMessage("Elige otro Pokémon de tu equipo para continuar.", "important");
            renderBattleTeam();
        }
    } else {
        addBattleLogMessage("Ambos Pokémon se han debilitado.", "fainted");
    }
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
            <div class="battle-team-item">
                <img src="${pokemon.item.sprite}" alt="">
                <span>${pokemon.item.name}</span>
            </div>
        ` : `
            <div class="battle-team-item empty">
                <span>Sin objeto</span>
            </div>
        `;
        card.innerHTML = `
            <img class="battle-team-sprite" src="${pokemon.sprite}" alt="${formatPokemonName(pokemon.name)}">
            <div class="battle-team-card-info">
                <div class="battle-team-name-row">
                    <h2>${formatPokemonName(pokemon.name)}</h2>
                    ${pokemon === activePokemon ? '<span class="battle-team-active-label">ACTIVO</span>' : ""}
                </div>
                <div class="pokemon-types">${typesHtml}</div>
                <div class="battle-team-hp">
                    <div class="battle-team-hp-bar">
                        <span class="${hpClass}" style="width: ${hpPercentage}%"></span>
                    </div>
                    <small>${pokemon.currentHp} / ${pokemon.maxHp} PS</small>
                </div>
                ${itemHtml}
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
    trainerName.textContent = `${trainer.name} · ${currentTrainer} / ${TOTAL_TRAINERS}`;
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
    resultTeam.innerHTML = "";
    selectedPokemon.forEach(pokemon => {
        const card = document.createElement("article");
        card.classList.add("pokemon-card");
        if (pokemon.fainted) {
            card.classList.add("fainted");
        }
        card.innerHTML = `
            <img src="${pokemon.sprite}" alt="${formatPokemonName(pokemon.name)}">
            <h2>${formatPokemonName(pokemon.name)}</h2>
            <p>${pokemon.currentHp} / ${pokemon.maxHp} PS</p>
            <p>${pokemon.matchupWins} victorias 1v1</p>
        `;
        resultTeam.appendChild(card);
    });
}

function renderResultMvp() {
    const mvp = getMvpPokemon();
    const resultMvp = document.querySelector("#resultMvp");
    if (!mvp) {
        resultMvp.innerHTML = "";
        return;
    }
    resultMvp.innerHTML = `
        <span>MVP DE LA RUN</span>
        <img src="${mvp.sprite}" alt="${formatPokemonName(mvp.name)}">
        <strong>${formatPokemonName(mvp.name)}</strong>
        <p>${mvp.matchupWins} victorias 1v1</p>
    `;
}

function showResultScreen(victory) {
    const trainersDefeated = victory ? TOTAL_TRAINERS : currentTrainer - 1;
    const survivors = selectedPokemon.filter(pokemon => !pokemon.fainted).length;
    const totalKos = selectedPokemon.reduce((total, pokemon) => total + pokemon.matchupWins, 0);
    const score = calculateRunScore(trainersDefeated);
    const rank = getRunRank(score);
    lastRunResult = {
        victory,
        trainersDefeated,
        survivors,
        totalKos,
        score,
        rank
    };
    document.querySelector("#battleScreen").classList.add("hidden");
    document.querySelector("#trainerIntroScreen").classList.add("hidden");
    document.querySelector("#trainerDefeatedScreen").classList.add("hidden");
    document.querySelector("#resultScreen").classList.remove("hidden");
    document.querySelector("#resultLabel").textContent = victory ? "🏆 RUN COMPLETADA" : "RUN FINALIZADA";
    document.querySelector("#resultTitle").textContent = victory ? "¡VICTORIA!" : "DERROTA";
    document.querySelector("#resultMessage").textContent = victory ? "¡Enhorabuena, has vencido a los 5 entrenadores!" : `Tu equipo ha caído ante ${runTrainers[currentTrainer - 1].name}.`;
    document.querySelector("#resultTrainers").textContent = `${trainersDefeated} / ${TOTAL_TRAINERS}`;
    document.querySelector("#resultSurvivors").textContent = `${survivors} / ${TEAM_SIZE}`;
    document.querySelector("#resultKos").textContent = totalKos;
    document.querySelector("#resultScore").textContent = score;
    document.querySelector("#resultRank").textContent = rank;
    renderResultMvp();
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

async function downloadResultCard() {
    if (!lastRunResult) {
        return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    const mvp = getMvpPokemon();
    ctx.fillStyle = "#f4f6f8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.font = "700 28px Arial";
    ctx.fillText(lastRunResult.victory ? "POKÉBATTLE · RUN COMPLETADA" : "POKÉBATTLE · RUN FINALIZADA", 540, 85);
    ctx.font = "700 72px Arial";
    ctx.fillText(lastRunResult.victory ? "¡VICTORIA!" : "DERROTA", 540, 175);
    ctx.font = "700 22px Arial";
    ctx.fillText(`RANGO ${lastRunResult.rank}`, 540, 230);
    ctx.font = "700 52px Arial";
    ctx.fillText(`${lastRunResult.score} PUNTOS`, 540, 295);
    const statLabels = ["ENTRENADORES", "SUPERVIVIENTES", "VICTORIAS 1V1"];
    const statValues = [`${lastRunResult.trainersDefeated} / ${TOTAL_TRAINERS}`, `${lastRunResult.survivors} / ${TEAM_SIZE}`, `${lastRunResult.totalKos}`];
    statLabels.forEach((label, index) => {
        const x = 250 + index * 290;
        ctx.font = "700 17px Arial";
        ctx.fillText(label, x, 370);
        ctx.font = "700 34px Arial";
        ctx.fillText(statValues[index], x, 415);
    });
    ctx.font = "700 26px Arial";
    ctx.fillText("TU EQUIPO", 540, 500);
    const pokemonImages = await Promise.all(selectedPokemon.map(pokemon => loadImage(pokemon.sprite).catch(() => null)));
    selectedPokemon.forEach((pokemon, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const x = 210 + column * 330;
        const y = 610 + row * 300;
        ctx.save();
        if (pokemon.fainted) {
            ctx.globalAlpha = 0.35;
        }
        if (pokemonImages[index]) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(pokemonImages[index], x - 80, y - 80, 160, 160);
        }
        ctx.fillStyle = "#111111";
        ctx.font = "700 24px Arial";
        ctx.fillText(formatPokemonName(pokemon.name).toUpperCase(), x, y + 110);
        ctx.font = "18px Arial";
        ctx.fillText(`${pokemon.matchupWins} victorias 1v1`, x, y + 145);
        ctx.restore();
    });
    if (mvp) {
        ctx.fillStyle = "#111111";
        ctx.font = "700 20px Arial";
        ctx.fillText("MVP DE LA RUN", 540, 1160);
        ctx.font = "700 32px Arial";
        ctx.fillText(`${formatPokemonName(mvp.name).toUpperCase()} · ${mvp.matchupWins} VICTORIAS 1V1`, 540, 1205);
    }
    ctx.font = "700 18px Arial";
    ctx.fillText("POKÉBATTLE", 540, 1290);
    const link = document.createElement("a");
    link.download = `pokemon-run-${lastRunResult.victory ? "victoria" : "derrota"}-${lastRunResult.score}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function startNewRun() {
    window.location.reload();
}

async function startRun() {
    document.querySelector("#itemScreen").classList.add("hidden");
    currentTrainer = 1;
    runTrainers = getRandomTrainers(TOTAL_TRAINERS);
    updateTrainerUI();
    showTrainerIntro();
    activePokemon = selectedPokemon[0];
    playerPokemonNeedsEntry = true;
    updateBattlePokemonUI(activePokemon, "player");
    renderBattleTeam();
    enemyTeam = await getUniqueRandomPokemon(6, 2);
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

init();