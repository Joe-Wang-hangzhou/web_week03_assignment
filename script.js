// Meal Explorer Logic

const API_BASE = "https://www.themealdb.com/api/json/v1/1/";
const ENDPOINT_SEARCH = `${API_BASE}search.php?s=`;
const ENDPOINT_DETAIL = `${API_BASE}lookup.php?i=`;

const formSearch = document.getElementById("search-form");
const inputSearch = document.getElementById("search-input");
const containerGrid = document.getElementById("recipe-grid");
const boxStatus = document.getElementById("status-message");

const modalRecipe = document.getElementById("recipe-modal");
const btnClose = document.getElementById("close-modal");
const btnBack = document.getElementById("btn-back");
const bgModal = document.querySelector(".modal-bg");

const imgRecipe = document.getElementById("recipe-img");
const titleRecipe = document.getElementById("recipe-title");
const badgeCategory = document.getElementById("recipe-category");
const textInstructions = document.getElementById("recipe-instructions");
const listIngredients = document.getElementById("ingredient-list");
const linkYoutube = document.getElementById("youtube-link");

formSearch.addEventListener("submit", processSearch);
btnClose.addEventListener("click", hideModal);
btnBack.addEventListener("click", hideModal);
bgModal.addEventListener("click", hideModal);

const MEMORY_KEY = "last_meal_search";

window.addEventListener("DOMContentLoaded", () => {
  const previousSearch = localStorage.getItem(MEMORY_KEY);
  if (previousSearch) {
    inputSearch.value = previousSearch;
    fetchMeals(previousSearch);
  }
});

function processSearch(e) {
  e.preventDefault();
  const query = inputSearch.value.trim();

  if (!query) {
    displayStatus("Please type something to search.", true);
    containerGrid.innerHTML = "";
    return;
  }

  fetchMeals(query);
}

async function fetchMeals(query) {
  try {
    displayStatus("Looking up meals...", false);
    const res = await fetch(`${ENDPOINT_SEARCH}${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Fetch failed");
    
    const data = await res.json();
    const results = data.meals || [];

    if (results.length === 0) {
      containerGrid.innerHTML = "";
      displayStatus(`We couldn't find anything for "${query}".`, true);
      return;
    }

    localStorage.setItem(MEMORY_KEY, query);
    buildGrid(results);
    displayStatus(`Success! Found ${results.length} results.`, false);
  } catch (err) {
    containerGrid.innerHTML = "";
    displayStatus("Error connecting to the database.", true);
    console.error(err);
  }
}

function buildGrid(meals) {
  containerGrid.innerHTML = meals.map(m => `
    <article class="meal-card" data-mealid="${m.idMeal}" tabindex="0">
      <img src="${m.strMealThumb}" alt="${m.strMeal}" />
      <div class="card-details">
        <h3>${m.strMeal}</h3>
        <p><i class="fas fa-bookmark"></i> ${m.strCategory || "Misc"}</p>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".meal-card").forEach(card => {
    card.addEventListener("click", () => fetchDetail(card.dataset.mealid));
    card.addEventListener("keydown", e => {
      if (e.key === "Enter") fetchDetail(card.dataset.mealid);
    });
  });
}

async function fetchDetail(id) {
  try {
    const res = await fetch(`${ENDPOINT_DETAIL}${id}`);
    if (!res.ok) throw new Error("Detail fetch failed");
    
    const data = await res.json();
    const detail = data.meals ? data.meals[0] : null;

    if (!detail) {
      displayStatus("Could not load details.", true);
      return;
    }

    populateModal(detail);
    modalRecipe.classList.remove("hidden");
    modalRecipe.setAttribute("aria-hidden", "false");
  } catch (err) {
    displayStatus("Failed to get recipe info.", true);
  }
}

function populateModal(data) {
  imgRecipe.src = data.strMealThumb;
  titleRecipe.textContent = data.strMeal;
  badgeCategory.textContent = data.strCategory || "General";
  textInstructions.textContent = data.strInstructions || "No instructions.";

  const items = [];
  for (let i = 1; i <= 20; i++) {
    const ing = data[`strIngredient${i}`];
    const msr = data[`strMeasure${i}`];
    if (ing && ing.trim()) {
      items.push(msr ? `${msr.trim()} ${ing.trim()}` : ing.trim());
    }
  }

  listIngredients.innerHTML = items.map(i => `<li><i class="fas fa-angle-right"></i> ${i}</li>`).join("");

  if (data.strYoutube) {
    linkYoutube.href = data.strYoutube;
    linkYoutube.classList.remove("hidden");
  } else {
    linkYoutube.href = "#";
    linkYoutube.classList.add("hidden");
  }
}

function hideModal() {
  modalRecipe.classList.add("hidden");
  modalRecipe.setAttribute("aria-hidden", "true");
}

function displayStatus(msg, error) {
  boxStatus.textContent = msg;
  boxStatus.classList.remove("hidden");
  if (error) {
    boxStatus.classList.add("error-state");
  } else {
    boxStatus.classList.remove("error-state");
  }
}
