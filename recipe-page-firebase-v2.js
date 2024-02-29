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

// Example calculation functions (implement these based on your actual data structure)
function calculateTotalWeight(ingredients) {
    return ingredients.reduce((total, {weight}) => total + weight, 0);
}

function calculateFlourWeight(ingredients) {
    return ingredients.filter(({type}) => type === "Flour").reduce((total, {weight}) => total + weight, 0);
}

function calculateHydration(flourWeight, fluidWeight) {
    // Make sure to calculate hydration as a number
    return flourWeight > 0 ? (fluidWeight / flourWeight) * 100 : 0;
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

// Update the recipe page with fetched data
function updateRecipePage(recipeData) {
    // Update basic information
    document.querySelector('[recipe="recipe-title"]').textContent = recipeData.title;
    document.querySelector('.recipe-image').src = recipeData.image_url;
    document.querySelector('[recipe="recipe-description"]').textContent = recipeData.description;
    document.querySelector('[recipe="created-on"]').textContent = formatDate(recipeData.created_on);
    document.querySelector('[recipe="created-by"]').textContent = recipeData.created_by;

    // Update ingredients and calculations
    updateIngredientsAndCalculations(recipeData.ingredients);

    // Update recipe steps
    updateRecipeSteps(recipeData.steps);

    // Update format
    updateFormatElements(recipeData);

    // Hide loader after page is loaded
    hideLoader();
}

// Update ingredients lists and calculations
function updateIngredientsAndCalculations(ingredients) {
    const doughIngredients = ingredients.filter(ingredient => !ingredient.preferment && ingredient.type !== 'Extra');
    const prefermentIngredients = ingredients.filter(ingredient => ingredient.preferment);
    const extraIngredients = ingredients.filter(ingredient => ingredient.type === 'Extra');

    // Assume functions calculateTotalWeight, calculateFlourWeight, and calculateHydration exist
    // Example of calculating and updating the dough weight
    const totalDoughWeight = calculateTotalWeight(doughIngredients.concat(prefermentIngredients));
    document.querySelector('[recipe="dough-weight"]').textContent = `${totalDoughWeight}g`;

    // Update ingredients lists
    updateIngredientsList('[recipe="dough-flour-list"]', doughIngredients.filter(ingredient => ingredient.type === 'Flour'));
    updateIngredientsList('[recipe="dough-fluid-list"]', doughIngredients.filter(ingredient => ingredient.type === 'Fluid'));
    updateIngredientsList('[recipe="dough-basics-list"]', doughIngredients.filter(ingredient => ['Starter', 'Salt', 'Yeast'].includes(ingredient.type)));
    updateIngredientsList('[recipe="dough-additions-list"]', doughIngredients.filter(ingredient => ingredient.type === 'Addition'));

    // Update Preferment Ingredients
    updatePrefermentLists(prefermentIngredients);

    // Update Extras Ingredients
    updateExtrasList(extraIngredients);}

// Render list of ingredients to the DOM
function updateIngredientsList(selector, ingredients) {
    const listElement = document.querySelector(selector);
    listElement.innerHTML = ''; // Clear existing list items
    ingredients.forEach(ingredient => {
        const li = document.createElement('li');
        li.className = 'ingredient-list-item';
        li.innerHTML = `
            <div class="ingredient-name">${ingredient.name}</div>
            <div class="ingredient-weight">${ingredient.weight}g</div>
            <div class="ingredient-percent">${calculateIngredientPercent(ingredient, ingredients)}%</div>
        `;
        listElement.appendChild(li);
    });
}

// Update Preferment Lists
function updatePrefermentLists(prefermentIngredients) {
    const totalPrefermentFlourWeight = calculateFlourWeight(prefermentIngredients);
    const prefermentFluidWeight = prefermentIngredients
        .filter(({type}) => type === "Fluid")
        .reduce((total, {weight}) => total + weight, 0);
    const prefermentWeight = calculateTotalWeight(prefermentIngredients);
    const prefermentHydration = calculateHydration(totalPrefermentFlourWeight, prefermentFluidWeight);

    // Now prefermentHydration is a number, and toFixed can be used safely
    document.querySelector('[recipe="preferment-weight"]').textContent = `${prefermentWeight}g`;
    document.querySelector('[recipe="preferment-flour-weight"]').textContent = `${totalPrefermentFlourWeight}g`;
    document.querySelector('[recipe="preferment-hydration"]').textContent = `${prefermentHydration.toFixed(1)}%`;


    // Update lists for preferment ingredients
    updateIngredientsList('[recipe="preferment-flour-list"]', prefermentIngredients.filter(ingredient => ingredient.type === 'Flour'));
    updateIngredientsList('[recipe="preferment-fluid-list"]', prefermentIngredients.filter(ingredient => ingredient.type === 'Fluid'));
    // For basics and additions, adjust based on your data structure, including if other types are part of the preferment
    updateIngredientsList('[recipe="preferment-basics-list"]', prefermentIngredients.filter(ingredient => ['Starter', 'Salt', 'Yeast'].includes(ingredient.type)));
    updateIngredientsList('[recipe="preferment-additions-list"]', prefermentIngredients.filter(ingredient => ingredient.type === 'Addition'));
}

// Update Extras List
function updateExtrasList(extraIngredients) {
    updateIngredientsList('[recipe="extras-list"]', extraIngredients);
    // Check if there are any extra ingredients to decide whether to show or hide the extras section
    const extrasSection = document.querySelector('[recipe="extras-section"]');
    if (extraIngredients.length > 0) {
        extrasSection.style.display = ''; // Show
    } else {
        extrasSection.style.display = 'none'; // Hide
    }
}

// Calculate ingredient percent based on total flour weight in the recipe
function calculateIngredientPercent(ingredient, ingredients) {
    const totalFlourWeight = calculateFlourWeight(ingredients); // Assume this function is implemented
    return ((ingredient.weight / totalFlourWeight) * 100).toFixed(1);
}

// Update recipe steps on the page
function updateRecipeSteps(steps) {
    const stepsListElement = document.querySelector('[recipe="steps-list"]');
    stepsListElement.innerHTML = ''; // Clear existing steps
    steps.forEach((step, index) => {
        const li = document.createElement('li');
        li.className = 'recipe-step';
        li.innerHTML = `
            <div class="step-title">${index + 1}. ${step.title}</div>
            <div class="step-description">${step.description}</div>
        `;
        stepsListElement.appendChild(li);
    });
}

// Main function to load the recipe data and update the page
async function main() {
    const recipeId = new URLSearchParams(window.location.search).get('id');
    const recipeData = await fetchRecipeData(recipeId);
    if (recipeData) {
        updateRecipePage(recipeData);
    } else {
        console.error('Failed to load recipe data');
    }
}

main();
