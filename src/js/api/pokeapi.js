const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";

export async function getPokemon(id) {
    const response = await fetch(`${POKEAPI_BASE_URL}/${id}`);

    if (!response.ok) {
        throw new Error(`Error al cargar el Pokémon con ID ${id}`);
    }

    const data = await response.json();

    return data;
}