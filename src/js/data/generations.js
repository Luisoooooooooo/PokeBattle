export const GENERATIONS = [
    { id: 1, region: "Kanto", firstId: 1, lastId: 151, previewIds: [3, 6, 9] },
    { id: 2, region: "Johto", firstId: 152, lastId: 251, previewIds: [154, 157, 160] },
    { id: 3, region: "Hoenn", firstId: 252, lastId: 386, previewIds: [254, 257, 260] },
    { id: 4, region: "Sinnoh", firstId: 387, lastId: 493, previewIds: [389, 392, 395] },
    { id: 5, region: "Teselia", firstId: 494, lastId: 649, previewIds: [497, 500, 503] },
    { id: 6, region: "Kalos", firstId: 650, lastId: 721, previewIds: [652, 655, 658] },
    { id: 7, region: "Alola", firstId: 722, lastId: 809, previewIds: [724, 727, 730] },
    { id: 8, region: "Galar", firstId: 810, lastId: 905, previewIds: [812, 815, 818] },
    { id: 9, region: "Paldea", firstId: 906, lastId: 1025, previewIds: [908, 911, 914] }
];

export const ALL_GENERATION_IDS = GENERATIONS.map(generation => generation.id);

const POKEMON_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function getPokemonSpriteUrl(id) {
    return `${POKEMON_SPRITE_BASE}/${id}.png`;
}

function isInGenerations(id, generations) {
    return generations.some(generation => id >= generation.firstId && id <= generation.lastId);
}

// Devuelve los IDs de las generaciones indicadas; con idPool, solo los que estén en esa lista
export function getIdsInGenerations(generationIds, idPool = null) {
    const generations = GENERATIONS.filter(generation => generationIds.includes(generation.id));
    if (idPool) {
        return idPool.filter(id => isInGenerations(id, generations));
    }
    return generations.flatMap(generation => {
        return Array.from({ length: generation.lastId - generation.firstId + 1 }, (_, index) => generation.firstId + index);
    });
}
