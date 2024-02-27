// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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

// Create a ReCaptchaEnterpriseProvider instance using your reCAPTCHA Enterprise
// site key and pass it to initializeAppCheck().
const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider("6LfCxUEpAAAAAE3wRJS-dHk7bNKzhxgzD6f0pYUY"),
    isTokenAutoRefreshEnabled: true // Set to true to allow auto-refresh.
  });

// Function to fetch data from Firestore
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
        console.error('Detailed error message:', error.message);
    }
}

// Function to hide the page loader
function hideLoader() {
    const loader = document.querySelector('.loader-wrapper');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Function to update the recipe image
function updateImageSrc(recipeData) {

    const imageUrl = recipeData.image_url

    const thumbnailImageElement = document.querySelector('.recipe-image');
    if (thumbnailImageElement && recipeData.image_url) {
        thumbnailImageElement.src = imageUrl;
    }
}

// Functions for getting recipe format and then updating all format elements
function getUnit(recipeData) {
    if (recipeData.format === 'grams') {
        return 'g';
    } else if (recipeData.format === 'ounces') {
        return 'oz';
    }
    return 'Unknown unit'; // Optional: default case if format is neither 'grams' nor 'ounces'
}

function updateFormatElements(recipeData) {
    const unit = getUnit(recipeData);
    const formatElements = document.querySelectorAll('[recipe="format"]');

    formatElements.forEach(element => {
        element.textContent = unit;
    });
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

// Example calculation functions (implement these based on your actual data structure)
function calculateTotalWeight(ingredients) {
    return ingredients.reduce((total, {weight}) => total + weight, 0);
}

function calculateFlourWeight(ingredients) {
    return ingredients.filter(({type}) => type === "Flour").reduce((total, {weight}) => total + weight, 0);
}

function calculateHydration(flourWeight, ingredients) {
    const fluidWeight = ingredients.filter(({type}) => type === "Fluid").reduce((total, {weight}) => total + weight, 0);
    return (fluidWeight / flourWeight) * 100; // This is the hydration percentage
}

// Function to render the recipe steps list
function renderListItems(listElement, items, templateHTML, templateClass) {
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
// Ingredients list function
function renderIngredientsList(listElement, ingredients, types, totalFlourWeight) {
    if (!listElement || listElement.children.length === 0) {
        console.error("No template found in the list.");
        return;
    }

    const templateElement = listElement.children[0].cloneNode(true); // Clone the template
    listElement.innerHTML = ''; // Clear the list

    const filteredIngredients = ingredients.filter(ingredient => 
        types.includes(ingredient.type));

    // Hide the list wrapper if no ingredients of these types
    const listWrapper = listElement.parentElement;
    if (filteredIngredients.length === 0) {
        listWrapper.style.display = 'none';
        return;
    } else {
        listWrapper.style.display = '';
    }

    filteredIngredients.forEach(ingredient => {
        const clone = templateElement.cloneNode(true);

        const percent = totalFlourWeight ? (ingredient.weight / totalFlourWeight) * 100 : 0;

        // Set the text elements
        clone.querySelector('[recipe="ingredient-name"]').textContent = ingredient.name;
        clone.querySelector('[recipe="ingredient-weight"]').textContent = `${ingredient.weight}`;
        clone.querySelector('[recipe="ingredient-percent"]').textContent = `${percent.toFixed(1)}%`;

        listElement.appendChild(clone);
    });
}

// Organizes ingredients into categories based on type and preferment status
function organizeIngredients(ingredients) {
    let doughIngredients = [], prefermentIngredients = [], extras = [];

    // Categorize each ingredient
    ingredients.forEach(ingredient => {
        if (ingredient.preferment) {
            prefermentIngredients.push(ingredient);
        } else if (ingredient.type === 'Extra') {
            extras.push(ingredient);
        } else {
            doughIngredients.push(ingredient);
        }
    });

    return { doughIngredients, prefermentIngredients, extras };
}

// Updates ingredient lists based on their category (dough or preferment)
function updateIngredientsLists(ingredients, category) {
    ['Flour', 'Fluid', 'Starter', 'Addition'].forEach(type => {
        const listElement = document.querySelector(`[recipe="${category}-${type.toLowerCase()}-list"]`);
        if (listElement) {
            renderIngredientsList(listElement, ingredients.filter(ingredient => ingredient.type === type));
        }
    });
}

// Renders a single type of ingredients list (e.g., Extras)
function updateIngredientsList(ingredients, category) {
    const listElement = document.querySelector(`[recipe="${category}-list"]`);
    if (listElement) {
        renderIngredientsList(listElement, ingredients);
    }
}

// Toggles the visibility of the preferment section based on its content
function togglePrefermentSectionVisibility(prefermentIngredients) {
    const prefermentSection = document.querySelector('[recipe="preferment-section"]');
    if (prefermentIngredients.length > 0) {
        prefermentSection.classList.remove('is-hidden');
    } else {
        prefermentSection.classList.add('is-hidden');
    }
}

function updateIngredientsLists(ingredients) {
    const totalFlourWeight = ingredients.reduce((total, ingredient) => {
        return ingredient.type === "Flour" ? total + ingredient.weight : total;
    }, 0);

    renderIngredientsList(document.querySelector('[recipe="flour-list"]'), ingredients, ["Flour"], totalFlourWeight);
    renderIngredientsList(document.querySelector('[recipe="fluid-list"]'), ingredients, ["Fluid"], totalFlourWeight);
    renderIngredientsList(document.querySelector('[recipe="basics-list"]'), ingredients, ["Starter", "Yeast", "Salt"], totalFlourWeight);
    renderIngredientsList(document.querySelector('[recipe="additions-list"]'), ingredients, ["Addition"], totalFlourWeight);
}

function calculateAndUpdateDoughAndPrefermentInfo(ingredients) {
    // Calculations for the entire dough (including preferment ingredients)
    const totalDoughWeight = calculateTotalWeight(ingredients); // Includes all ingredients
    const totalFlourWeight = calculateFlourWeight(ingredients); // Includes all flour types
    const hydration = calculateHydration(totalFlourWeight, ingredients); // Based on all ingredients
    
    // Preferment-specific calculations
    const prefermentIngredients = ingredients.filter(ingredient => ingredient.preferment);
    const prefermentWeight = calculateTotalWeight(prefermentIngredients);
    const prefermentFlourWeight = calculateFlourWeight(prefermentIngredients);
    const prefermentHydration = calculateHydration(prefermentFlourWeight, prefermentIngredients);

    // Update DOM for dough
    document.querySelector('[recipe="dough-weight"]').textContent = `${totalDoughWeight}g`;
    document.querySelector('[recipe="flour-weight"]').textContent = `${totalFlourWeight}g`;
    document.querySelector('[recipe="hydration"]').textContent = `${hydration.toFixed(1)}%`;

    // Update DOM for preferment (if applicable)
    if(prefermentIngredients.length > 0) {
        document.querySelector('[recipe="preferment-weight"]').textContent = `${prefermentWeight}g`;
        document.querySelector('[recipe="preferment-flour-weight"]').textContent = `${prefermentFlourWeight}g`;
        document.querySelector('[recipe="preferment-hydration"]').textContent = `${prefermentHydration.toFixed(1)}%`;
        document.querySelector('[recipe="preferment-dough-item"] [recipe="ingredient-weight"]').textContent = `${prefermentWeight}g`;
        // Show the preferment section if hidden
        document.querySelector('[recipe="preferment-section"]').classList.remove("is-hidden");
    } else {
        // Hide the preferment section if no preferment ingredients
        document.querySelector('[recipe="preferment-section"]').classList.add("is-hidden");
    }
}

// Function for updating recipe page data
function updatePageWithRecipeData(recipeData) {
    // Update simple text fields
    document.querySelector('[recipe="recipe-title"]').textContent = recipeData.title || "Recipe title";
    document.querySelector('[recipe="recipe-description"]').textContent = recipeData.description || "No description provided";
    document.querySelector('[recipe="created-on"]').textContent = formatDate(recipeData.time_created);
    document.querySelector('[recipe="created-by"]').textContent = recipeData.public_author || "Author not available";
    document.querySelector('[recipe="quantity"]').textContent = recipeData.quantity || "Quantity not available";

    // Update image
    updateImageSrc(recipeData);

    // Update dough and preferment weight and hydration
    calculateAndUpdateDoughAndPrefermentInfo(recipeData.ingredients);


    // Update recipe steps
    const stepsListElement = document.querySelector('ul[recipe="steps-list"]');
    
    if (stepsListElement && stepsListElement.children.length > 0) {
        const templateElement = stepsListElement.children[0];
        const templateHTML = templateElement.innerHTML;
        const templateClass = templateElement.className;
        renderListItems(stepsListElement, recipeData.steps, templateHTML, templateClass);
    }

     // Organize ingredients by type and preferment status
     const organizedIngredients = organizeIngredients(recipeData.ingredients);

     // Update lists and sections for dough, preferment, and extras
     updateIngredientsLists(organizedIngredients.doughIngredients, 'dough');
     updateIngredientsLists(organizedIngredients.prefermentIngredients, 'preferment');
     updateIngredientsList(organizedIngredients.extras, 'extras'); // Extras handled separately
 
     // Update preferment section visibility
     togglePrefermentSectionVisibility(organizedIngredients.prefermentIngredients);

    // Update format
    updateFormatElements(recipeData);

    // Hide loader after page is loaded
    hideLoader();
}

// Main function
async function main() {
    const recipeId = new URLSearchParams(window.location.search).get('id');
    const recipeData = await fetchRecipeData(recipeId);
    if (recipeData) {
        updatePageWithRecipeData(recipeData);
    }
}

main();