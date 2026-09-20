import { getUniqueRandomPokemon, getRandomItemOffer } from "./api/pokeapi.js";
import { renderPokemonCards } from "./ui/pokemon-cards.js";
import { renderItemTeam, renderItemOffer } from "./ui/item-selection.js";
import { resolveMatchup } from "./game/battle.js";
import { getRandomTrainers } from "./data/trainers.js";

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


function updateSelectionUI() {
    const selectionCount = document.querySelector("#selectionCount");
    const continueBtn = document.querySelector("#continueBtn");
    selectionCount.textContent = `${selectedPokemon.length} / ${TEAM_SIZE} seleccionados`;
    continueBtn.disabled = selectedPokemon.length !== TEAM_SIZE;
}

function togglePokemonSelection(pokemon) {
    const isSelected = selectedPokemon.some(
        selected => selected.id === pokemon.id
    );
    if (isSelected) {
        selectedPokemon = selectedPokemon.filter(
            selected => selected.id !== pokemon.id
        );
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
    const hpText = document.querySelector(`#${side}HpText`);
    const hpBar = document.querySelector(`#${side}HpBar`);
    sprite.src = pokemon.sprite;
    sprite.alt = pokemon.name;
    name.textContent = pokemon.name;
    hpText.textContent = `${currentHp} / ${pokemon.maxHp} PS`;
    const hpPercentage = (currentHp / pokemon.maxHp) * 100;
    hpBar.style.width = `${Math.max(0, hpPercentage)}%`;
}

function addBattleLogMessage(message) {
    const battleLog = document.querySelector("#battleLog");
    const logMessage = document.createElement("p");
    logMessage.textContent = message;
    battleLog.appendChild(logMessage);
    battleLog.scrollTop = battleLog.scrollHeight;
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

function showNextEnemyPokemon() {
    const currentEnemyIndex = enemyTeam.findIndex(pokemon => pokemon.id === activeEnemyPokemon.id);
    const nextEnemyPokemon = enemyTeam[currentEnemyIndex + 1];
    if (!nextEnemyPokemon) {
        return false;
    }
    activeEnemyPokemon = nextEnemyPokemon;
    updateBattlePokemonUI(activeEnemyPokemon, "enemy");
    const enemyPokeballs = document.querySelectorAll(".enemy-pokeball");
    if (enemyPokeballs[currentEnemyIndex]) {
        enemyPokeballs[currentEnemyIndex].classList.add("defeated");
    }
    return true;
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

    addBattleLogMessage(`Comienza el combate contra el Entrenador ${currentTrainer}.`);
    addBattleLogMessage(`${activeEnemyPokemon.name} entra al combate.`);

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
        addBattleLogMessage(`${activePokemon.name} entra al combate.`);
        playerPokemonNeedsEntry = false;
    }
    const playerInitialHp = activePokemon.currentHp;
    const enemyInitialHp = activeEnemyPokemon.currentHp;
    const result = resolveMatchup(activePokemon, activeEnemyPokemon);
    updateBattlePokemonUI(activePokemon, "player", playerInitialHp);
    updateBattlePokemonUI(activeEnemyPokemon, "enemy", enemyInitialHp);
    addBattleLogMessage(`${activePokemon.name} se enfrenta a ${activeEnemyPokemon.name}.`);
    await wait(700);
    for (let turnIndex = 0; turnIndex < result.turns.length; turnIndex++) {
        const turn = result.turns[turnIndex];
        addBattleLogMessage(`Turno ${turnIndex + 1}`);
        await wait(500);
        for (const attack of turn.attacks) {
            const attackerSide = attack.attacker === activePokemon ? "player" : "enemy";
            const defenderSide = attack.defender === activePokemon ? "player" : "enemy";
            addBattleLogMessage(`${attack.attacker.name} ataca con tipo ${attack.type}.`);
            await wait(500);
            const effectivenessMessage = getEffectivenessMessage(attack.multiplier);
            if (effectivenessMessage) {
                addBattleLogMessage(effectivenessMessage);
                await wait(400);
            }
            updateBattlePokemonUI(attack.defender, defenderSide, attack.defenderCurrentHp);
            if (attack.damageDealt > 0) {
                addBattleLogMessage(`${attack.defender.name} pierde ${attack.damageDealt} PS.`);
            } else {
                addBattleLogMessage(`${attack.defender.name} no recibe daño.`);
            }
            await wait(600);
            if (attack.focusBandActivated) {
                addBattleLogMessage(`¡La Banda Focus permite a ${attack.defender.name} resistir con 1 PS!`);
                await wait(500);
            }
            if (attack.rockyHelmetDamage > 0) {
                updateBattlePokemonUI(attack.attacker, attackerSide, attack.attackerHpAfterRockyHelmet);
                addBattleLogMessage(`${attack.attacker.name} pierde ${attack.rockyHelmetDamage} PS por el Casco Dentado.`);
                await wait(500);
            }
            if (attack.sitrusHealing > 0) {
                updateBattlePokemonUI(attack.defender, defenderSide, attack.defenderHpAfterSitrus);
                addBattleLogMessage(`${attack.defender.name} recupera ${attack.sitrusHealing} PS con su Baya Zidra.`);
                await wait(500);
            }
            if (attack.lifeOrbRecoil > 0) {
                updateBattlePokemonUI(attack.attacker, attackerSide, attack.attackerHpAfterLifeOrb);
                addBattleLogMessage(`${attack.attacker.name} pierde ${attack.lifeOrbRecoil} PS por la Vidasfera.`);
                await wait(500);
            }
        }
        if (turn.leftovers.pokemonA > 0) {
            updateBattlePokemonUI(activePokemon, "player", turn.leftovers.pokemonAHpAfterLeftovers);
            addBattleLogMessage(`${activePokemon.name} recupera ${turn.leftovers.pokemonA} PS con Restos.`);
            await wait(500);
        }
        if (turn.leftovers.pokemonB > 0) {
            updateBattlePokemonUI(activeEnemyPokemon, "enemy", turn.leftovers.pokemonBHpAfterLeftovers);
            addBattleLogMessage(`${activeEnemyPokemon.name} recupera ${turn.leftovers.pokemonB} PS con Restos.`);
            await wait(500);
        }
    }
    renderBattleTeam();
    if (result.winner) {
        addBattleLogMessage(`${result.loser.name} se ha debilitado.`);
        await wait(500);
        addBattleLogMessage(`${result.winner.name} gana el enfrentamiento.`);
        await wait(700);
        if (result.winner === activePokemon) {
            if (!hasLivingEnemyPokemon()) {
                const enemyPokeballs = document.querySelectorAll(".enemy-pokeball");
                enemyPokeballs.forEach(pokeball => {
                    pokeball.classList.add("defeated");
                });
                activeEnemyPokemon = null;
                addBattleLogMessage(`¡Has derrotado al Entrenador ${currentTrainer}!`);
                resolveMatchupBtn.disabled = true;
                if (currentTrainer < TOTAL_TRAINERS) {
                    await wait(1000);

                    const trainer = runTrainers[currentTrainer - 1];

                    document.querySelector("#defeatedTrainerName").textContent = trainer.name;
                    document.querySelector("#battleScreen").classList.add("hidden");
                    document.querySelector("#trainerDefeatedScreen").classList.remove("hidden");
                } else {
                    addBattleLogMessage("¡Has derrotado a los 5 entrenadores!");
                }
                return;
            }
            const hasNextEnemy = showNextEnemyPokemon();
            if (hasNextEnemy) {
                addBattleLogMessage(`${activeEnemyPokemon.name} entra al combate.`);
                resolveMatchupBtn.disabled = false;
            }
        }
        if (result.loser === activePokemon) {
            if (!hasLivingPlayerPokemon()) {
                activePokemon = null;
                addBattleLogMessage("Tu equipo ha caído.");
                resolveMatchupBtn.disabled = true;
                renderBattleTeam();
                return;
            }
            activePokemon = null;
            addBattleLogMessage("Elige otro Pokémon de tu equipo para continuar.");
            renderBattleTeam();
        }
    } else {
        addBattleLogMessage("Ambos Pokémon se han debilitado.");
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

function renderBattleTeam() {
    const battleTeamGrid = document.querySelector("#battleTeamGrid");
    battleTeamGrid.innerHTML = "";
    selectedPokemon.forEach(pokemon => {
        const card = document.createElement("article");
        card.classList.add("pokemon-card");
        if (pokemon === activePokemon) {
            card.classList.add("active");
        }
        if (pokemon.fainted) {
            card.classList.add("fainted");
        }
        card.innerHTML = `
            <img src="${pokemon.sprite}" alt="${pokemon.name}">
            <h2>${pokemon.name}</h2>
            <p>${pokemon.currentHp} / ${pokemon.maxHp} PS</p>
            <p>${pokemon.item ? pokemon.item.name : "Sin objeto"}</p>
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

async function startRun() {
    document.querySelector("#itemScreen").classList.add("hidden");
    currentTrainer = 1;
    runTrainers = getRandomTrainers(TOTAL_TRAINERS);
    updateTrainerUI();
    showTrainerIntro();
    activePokemon = selectedPokemon[0];
    playerPokemonNeedsEntry = true;
    document.querySelector("#playerBattleSprite").src = activePokemon.sprite;
    document.querySelector("#playerBattleSprite").alt = activePokemon.name;
    document.querySelector("#playerBattleName").textContent = activePokemon.name;
    document.querySelector("#playerHpText").textContent = `${activePokemon.currentHp} / ${activePokemon.maxHp} PS`;
    const playerHpPercentage = (activePokemon.currentHp / activePokemon.maxHp) * 100;
    document.querySelector("#playerHpBar").style.width = `${playerHpPercentage}%`;
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
    document.querySelector("#enemyBattleSprite").src = activeEnemyPokemon.sprite;
    document.querySelector("#enemyBattleSprite").alt = activeEnemyPokemon.name;
    document.querySelector("#enemyBattleName").textContent = activeEnemyPokemon.name;
    document.querySelector("#enemyHpText").textContent = `${activeEnemyPokemon.currentHp} / ${activeEnemyPokemon.maxHp} PS`;
    const enemyHpPercentage = (activeEnemyPokemon.currentHp / activeEnemyPokemon.maxHp) * 100;
    document.querySelector("#enemyHpBar").style.width = `${enemyHpPercentage}%`;
}

init();