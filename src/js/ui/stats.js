import { formatPokemonName } from "../utils/formatters.js";
import { getPokemonRanking } from "../game/stats.js";
import { formatMoney } from "../game/routes.js";

function formatNumber(value) {
    return value.toLocaleString("es-ES");
}

const TILES = [
    { key: "battlesWon", label: "Combates ganados", format: formatNumber },
    { key: "battlesLost", label: "Combates perdidos", format: formatNumber },
    { key: "knockouts", label: "Rivales debilitados", format: formatNumber },
    { key: "damageDealt", label: "Daño causado", format: formatNumber },
    { key: "moneyEarned", label: "Dinero ganado", format: formatMoney },
    { key: "moneySpent", label: "Dinero gastado", format: formatMoney },
    { key: "medicinesUsed", label: "Medicinas usadas", format: formatNumber },
    { key: "pokemonJoined", label: "Reclutados", format: formatNumber }
];

function renderPokemonRow(entry, index, teamIds) {
    const isMvp = index === 0 && entry.knockouts > 0;
    const inTeam = teamIds.has(entry.id);
    return `
        <li class="stats-pokemon-row${inTeam ? "" : " gone"}">
            <img src="${entry.sprite}" alt="">
            <div class="stats-pokemon-name">
                <strong>${formatPokemonName(entry.name)}${isMvp ? ' <span class="stats-mvp">MVP</span>' : ""}</strong>
                ${inTeam ? "" : "<small>Ya no está en tu equipo</small>"}
            </div>
            <div class="stats-pokemon-figure">
                <strong>${formatNumber(entry.knockouts)}</strong>
                <small>${entry.knockouts === 1 ? "rival" : "rivales"}</small>
            </div>
            <div class="stats-pokemon-figure">
                <strong>${formatNumber(entry.damageDealt)}</strong>
                <small>daño</small>
            </div>
        </li>
    `;
}

export function renderStats(totals, pokemonBucket, team) {
    document.querySelector("#statsTiles").innerHTML = TILES.map(tile => `
        <div class="end-stat">
            <span>${tile.label}</span>
            <strong>${tile.format(totals[tile.key])}</strong>
        </div>
    `).join("");
    const teamIds = new Set(team.map(pokemon => pokemon.id));
    const ranking = getPokemonRanking(pokemonBucket);
    document.querySelector("#statsPokemon").innerHTML = ranking.length > 0
        ? ranking.map((entry, index) => renderPokemonRow(entry, index, teamIds)).join("")
        : '<li class="stats-empty">Todavía no has combatido.</li>';
}
