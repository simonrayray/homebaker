// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyBd37AU1wyrBl8ZWdzski377CLpp6jXtik",
  authDomain: "homebaker-pro.firebaseapp.com",
  projectId: "homebaker-pro",
  storageBucket: "homebaker-pro.appspot.com",
  messagingSenderId: "967759562179",
  appId: "1:967759562179:web:0edfd7e2a7cf748b072976",
  measurementId: "G-Y3MT8XGF3K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider("6LfCxUEpAAAAAE3wRJS-dHk7bNKzhxgzD6f0pYUY"),
  isTokenAutoRefreshEnabled: true
});

// Function to fetch data from Firestore
export async function fetchRecipeData(recipeId) {
  const db = getFirestore(app);
  try {
    const docRef = doc(db, "recipes", recipeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error('Error fetching recipe data:', error);
  }
}

// Utility Functions
function hideLoader() {
  document.querySelector('.loader-wrapper').style.display = 'none';
}

function getUnit(format) {
  return format === 'grams' ? 'g' : format === 'ounces' ? 'oz' : 'Unknown unit';
}

// Function for formatting date
function formatDate(firestoreTimestamp) {
    if (!firestoreTimestamp || typeof firestoreTimestamp.toDate !== 'function') {
        return "Date not available";
    }

    const dateObject = firestoreTimestamp.toDate();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return dateObject.toLocaleDateString('en-US', options);
}

function calculateTotalWeight(ingredients) {
  return ingredients.reduce((total, ingredient) => total + ingredient.weight, 0);
}

function calculateFlourWeight(ingredients) {
  return ingredients.filter(ingredient => ingredient.type === "Flour").reduce((total, ingredient) => total + ingredient.weight, 0);
}

function calculateHydration(flourWeight, ingredients) {
  const waterWeight = ingredients.filter(ingredient => ingredient.type === "Fluid").reduce((total, ingredient) => total + ingredient.weight, 0);
  return (waterWeight / flourWeight) * 100;
}

// Update Ingredients List
function updateIngredientsList(selector, ingredients) {
      const list = document.querySelector(selector);
      const template = listElement.children[0].cloneNode(true); // Clone the template
      listElement.innerHTML = ''; // Clear the list
    
      // Hide the list wrapper if no ingredients of these types
      const listWrapper = listElement.parentElement;
        if (filteredIngredients.length === 0) {
         listWrapper.style.display = 'none';
         return;
     } else {
        listWrapper.style.display = '';
        }

      list.innerHTML = ''; // Clear the list
      const percent = totalFlourWeight ? (ingredient.weight / totalFlourWeight) * 100 : 0;
      ingredients.forEach(ingredient => {
        const clone = document.importNode(template, true);
        clone.querySelector('[recipe="ingredient-name"]').textContent = ingredient.name;
        clone.querySelector('[recipe="ingredient-weight"]').textContent = `${ingredient.weight}g`;
        clone.querySelector('[recipe="ingredient-percent"]').textContent = `${percent.toFixed(1)}%`;
        list.appendChild(clone);
      });
    }


// Main Update Function
function updatePageWithRecipeData(recipeData) {
  document.querySelector('[recipe="recipe-title"]').textContent = recipeData.title;
  document.querySelector('.recipe-image').src = recipeData.image_url;
  document.querySelector('[recipe="recipe-description"]').textContent = recipeData.description;
  document.querySelector('[recipe="created-on"]').textContent = formatDate(recipeData.created_on);
  document.querySelector('[recipe="created-by"]').textContent = recipeData.created_by;

  const unit = getUnit(recipeData.format);
  document.querySelectorAll('[recipe="format"]').forEach(element => element.textContent = unit);
  
  // Update recipe steps
  const stepsListElement = document.querySelector('ul[recipe="steps-list"]');
    
  if (stepsListElement && stepsListElement.children.length > 0) {
      const templateElement = stepsListElement.children[0];
      const templateHTML = templateElement.innerHTML;
      const templateClass = templateElement.className;
      renderStepsListItems(stepsListElement, recipeData.steps, templateHTML, templateClass);
  }

  // Calculate and update weights and hydration
  const doughIngredients = recipeData.ingredients.filter(ingredient => !ingredient.preferment && ingredient.type !== 'Extra');
  const prefermentIngredients = recipeData.ingredients.filter(ingredient => ingredient.preferment);
  const extraIngredients = recipeData.ingredients.filter(ingredient => ingredient.type === 'Extra');

  // Calculate dough stats
  const totalDoughWeight = calculateTotalWeight(doughIngredients);
  const totalFlourWeight = calculateFlourWeight(doughIngredients);
  const hydration = calculateHydration(totalFlourWeight, doughIngredients);

  // Calculate preferment stats
  const totalPrefermentDoughWeight = calculateTotalWeight(prefermentIngredients);
  const totalPrefermentFlourWeight = calculateFlourWeight(prefermentIngredients);
  const prefermentHydration = calculateHydration(totalPrefermentFlourWeight, prefermentIngredients);

  // Dough stats overview
  document.querySelector('[recipe="dough-weight"]').textContent = `${totalDoughWeight}g`;
  document.querySelector('[recipe="flour-weight"]').textContent = `${totalFlourWeight}g`;
  document.querySelector('[recipe="hydration"]').textContent = `${hydration.toFixed(1)}%`;

  // Preferment stats overview
  document.querySelector('[recipe="preferment-weight"]').textContent = `${totalPrefermentDoughWeight}g`;
  document.querySelector('[recipe="preferment-flour-weight"]').textContent = `${totalPrefermentFlourWeight}g`;
  document.querySelector('[recipe="preferment-hydration"]').textContent = `${prefermentHydration.toFixed(1)}%`;

  // Update dough ingredients lists
  updateIngredientsList('[recipe="dough-flour-list"]', doughIngredients.filter(ingredient => ingredient.type === 'Flour'));
  updateIngredientsList('[recipe="dough-fluid-list"]', doughIngredients.filter(ingredient => ingredient.type === 'Fluid'));
  updateIngredientsList('[recipe="dough-basics-list"]', doughIngredients.filter(ingredient => ['Starter', 'Salt', 'Yeast'].includes(ingredient.type)));
  updateIngredientsList('[recipe="dough-additions-list"]', doughIngredients.filter(ingredient => ingredient.type === 'Addition'));
  
  // Update preferment ingredients lists
  updateIngredientsList('[recipe="preferment-flour-list"]', prefermentIngredients.filter(ingredient => ingredient.type === 'Flour'));
  updateIngredientsList('[recipe="preferment-fluid-list"]', prefermentIngredients.filter(ingredient => ingredient.type === 'Fluid'));
  updateIngredientsList('[recipe="preferment-basics-list"]', prefermentIngredients.filter(ingredient => ['Starter', 'Salt', 'Yeast'].includes(ingredient.type)));
  updateIngredientsList('[recipe="preferment-additions-list"]', prefermentIngredients.filter(ingredient => ingredient.type === 'Addition'));

  // Update extra ingredients lists
  updateIngredientsList('[recipe="extras-list"]', extraIngredients);

  // Update preferment item in dough list

  hideLoader();
}

// Function to render the recipe steps list
function renderStepsListItems(listElement, items, templateHTML, templateClass) {
    // Clear the list before adding new items
    listElement.innerHTML = '';

    items.forEach((item, index) => {
        const clone = document.createElement('li');
        clone.innerHTML = templateHTML;
        clone.className = templateClass;

        // Update the clone with data
        clone.querySelector('[recipe="step-title"]').textContent = `${index + 1}. ${item.title}`;
        clone.querySelector('[recipe="step-description"]').textContent = item.notes;

        // Conditionally update/hide step timer
        const stepTimerElement = clone.querySelector('[recipe="step-timer"]');
        if (item.timer_duration) {
            stepTimerElement.textContent = item.timer_duration;
        } else {
            // Hide the parent element
            const timerChipElement = clone.querySelector('[recipe="meta-timer-chip"]');
            if (timerChipElement) {
                timerChipElement.style.display = 'none';
            }
        }

        // Conditionally update/hide dough temp
        const doughTempElement = clone.querySelector('[recipe="dough-temp"]');
        if (item.dough_temperature) {
            doughTempElement.textContent = item.dough_temperature;
        } else {
            // Hide the parent element
            const doughChipElement = clone.querySelector('[recipe="meta-dough-chip"]');
            if (doughChipElement) {
                doughChipElement.style.display = 'none';
            }
        }

        // Conditionally update/hide oven temp
        const ovenTempElement = clone.querySelector('[recipe="oven-temp"]');
        if (item.oven_temperature) {
            ovenTempElement.textContent = item.oven_temperature;
        } else {
            // Hide the parent element
            const ovenChipElement = clone.querySelector('[recipe="meta-oven-chip"]');
            if (ovenChipElement) {
                ovenChipElement.style.display = 'none';
            }
        }

                // Conditionally update/hide ambient temp
        const ambientTempElement = clone.querySelector('[recipe="ambient-temp"]');
        if (item.ambient_temperature) {
            ambientTempElement.textContent = item.ambient_temperature;
        } else {
            // Hide the parent element
            const ambientChipElement = clone.querySelector('[recipe="meta-ambient-chip"]');
            if (ambientChipElement) {
                ambientChipElement.style.display = 'none';
            }
        }

        listElement.appendChild(clone);
    });
}



async function main() {
  const recipeId = new URLSearchParams(window.location.search).get('id');
  const recipeData = await fetchRecipeData(recipeId);
  if (recipeData) {
    updatePageWithRecipeData(recipeData);
  }
}

main();
