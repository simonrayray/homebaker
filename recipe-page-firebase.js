// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

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

// Function for calculating total dough weight
function calculateTotalWeight(recipeData) {
    if (!recipeData || !recipeData.ingredients) {
        console.error("Invalid input format");
        return 0;
    }

    const totalWeight = recipeData.ingredients.reduce((total, ingredient) => {
        return total + (ingredient.weight || 0);
    }, 0);

    const doughWeightElement = document.querySelector('[recipe="dough-weight"]');
    if (doughWeightElement) {
        doughWeightElement.textContent = totalWeight;
    }
}

// Function for calculating flour weight
function calculateFlourWeight(recipeData) {
    if (!recipeData || !recipeData.ingredients) {
        console.error("Invalid input format");
        return 0;
    }

    const totalFlourWeight = recipeData.ingredients.reduce((total, ingredient) => {
        if (ingredient.type === "Flour") {
            return total + (ingredient.weight || 0);
        }
        return total;
    }, 0);

    const flourWeightElement = document.querySelector('[recipe="flour-weight"]');
    if (flourWeightElement) {
        flourWeightElement.textContent = totalFlourWeight;
    }
}

// Function for calculating hydration
function calculateFluidToFlourPercentage(recipeData) {
    if (!recipeData || !recipeData.ingredients) {
        console.error("Invalid input format");
        return;
    }

    let totalFlourWeight = 0;
    let totalFluidWeight = 0;

    recipeData.ingredients.forEach(ingredient => {
        if (ingredient.type === "Flour") {
            totalFlourWeight += ingredient.weight || 0;
        } else if (ingredient.type === "Fluid") {
            totalFluidWeight += ingredient.weight || 0;
        }
    });

    // Return 0% if either flour weight or fluid weight is 0
    if (totalFlourWeight === 0 || totalFluidWeight === 0) {
        const percentageElement = document.querySelector('[recipe="hydration"]');
        if (percentageElement) {
            percentageElement.textContent = "0.0%";
        }
        return;
    }

    const percentage = (totalFluidWeight / totalFlourWeight) * 100;
    const formattedPercentage = percentage.toFixed(1) + '%';

    const percentageElement = document.querySelector('[recipe="hydration"]');
    if (percentageElement) {
        percentageElement.textContent = formattedPercentage;
    }
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
            ovenTempElement.textContent = item.ambient_temperature;
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

// Function for updating recipe page data
function updatePageWithRecipeData(recipeData) {
    // Update simple text fields
    document.querySelector('[recipe="recipe-title"]').textContent = recipeData.title || "Recipe title";
    document.querySelector('[recipe="recipe-description"]').textContent = recipeData.description || "No description provided";
    document.querySelector('[recipe="created-on"]').textContent = formatDate(recipeData.time_created);
    document.querySelector('[recipe="created-by"]').textContent = recipeData.public_author || "Author not available";
    document.querySelector('[recipe="quantity"]').textContent = recipeData.quantity || "Quantity not available";
    document.querySelector('[recipe="quantity"]').textContent = recipeData.quantity || "Quantity not available";

    // Update image
    updateImageSrc(recipeData);

    // Update format
    updateFormatElements(recipeData);

    // Set total dough weight
    calculateTotalWeight(recipeData);

    // Set flour weight
    calculateFlourWeight(recipeData);

    // Set hydration
    calculateFluidToFlourPercentage(recipeData);

    // Update recipe steps
    const stepsListElement = document.querySelector('ul[recipe="steps-list"]');
    
    if (stepsListElement && stepsListElement.children.length > 0) {
        const templateElement = stepsListElement.children[0];
        const templateHTML = templateElement.innerHTML;
        const templateClass = templateElement.className;
        renderListItems(stepsListElement, recipeData.steps, templateHTML, templateClass);
    }

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
