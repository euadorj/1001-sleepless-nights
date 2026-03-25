let chosenPokemon = null;

function startNewGame() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('pokemon-selection').style.display = 'block';
    fetchPokemons();
}

function fetchPokemons() {
    fetch('/api/pokemon/')
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById('pokemon-list');
            list.innerHTML = "";
            data.forEach(pokemon => {
                const button = document.createElement('button');
                button.innerText = pokemon.name;
                button.onclick = () => selectPokemon(pokemon);
                list.appendChild(button);
            });
        });
}

function selectPokemon(pokemon) {
    chosenPokemon = pokemon;
    document.getElementById('confirm-selection').style.display = 'block';
    alert(`You selected: ${pokemon.name}. It is a type ${pokemon.type_1}.`);
}

function confirmSelection() {
    if (chosenPokemon) {
        fetch(`/api/users/1/choose_pokemon/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pokemon_id: chosenPokemon.id })
        }).then(response => {
            if (response.ok) {
                alert("Pokemon confirmed. You cannot change later, but you can catch more in the wild.");
                // Redirect to the main menu or next screen
            }
        });
    }
}

function loadGame() {
    // Implement load game functionality
}

function exitGame() {
    window.close(); 
}
