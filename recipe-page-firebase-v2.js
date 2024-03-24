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

// Global toggle state for including starter in calculations
let includeStarterInCalculations = true;

// Function to handle checkbox state change
function handleStarterToggleChange() {
    includeStarterInCalculations = document.getElementById('starterToggle').checked;
    updateCalculations();
}

function updateCalculations() {
    const recipeId = new URLSearchParams(window.location.search).get('id');
    fetchRecipeData(recipeId).then(recipeData => {
        if (recipeData) {
            updatePageWithRecipeData(recipeData);
        } else {
            // Handle the case where no recipe data is returned
            console.error("Failed to fetch recipe data.");
        }
    }).catch(error => {
        // Handle any errors that occur during fetch
        console.error("Error fetching recipe data:", error);
    });
}


// Utility Functions
function hideLoader() {
    document.querySelector('.loader-wrapper').style.display = 'none';
}

function getUnit(format) {
    return format === 'grams' ? 'g' : format === 'ounces' ? 'oz' : 'Unknown unit';
}

// Function to update the recipe image or hide it if not available
function updateImageSrc(recipeData) {
    const imageUrl = recipeData.image_url;
    const thumbnailImageElement = document.querySelector('.recipe-image');
    const imageWrapper = thumbnailImageElement ? thumbnailImageElement.parentElement : null;

    if (thumbnailImageElement && imageUrl) {
        thumbnailImageElement.src = imageUrl;
        // Ensure the wrapper is visible in case it was previously hidden
        if (imageWrapper) imageWrapper.classList.remove('is-hidden');
    } else {
        // Hide the wrapper if no image URL is provided
        if (imageWrapper) imageWrapper.classList.add('is-hidden');
    }
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
    // Ensure ingredients is an array and not undefined or null
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return 0; // Return 0 if ingredients is not an array or is empty
    }

    return ingredients.reduce((total, ingredient) => {
        // Use display_weight for "Starter" ingredients if it's present and hydration is undefined
        if (ingredient.type === "Starter" && ingredient.hydration === undefined) {
            return total + (Number(ingredient.displayWeight) || 0);
        }
        // Otherwise, use weight
        return total + (Number(ingredient.weight) || 0);
    }, 0);
}


// Function to calculate total fluid weight, including starter water
function calculateTotalFluidWeight(ingredients) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return 0;
    }

    return ingredients.reduce((total, ingredient) => {
        if (ingredient.type === 'Fluid') {
            return total + (Number(ingredient.weight) || 0);
        } else if (ingredient.starter && ingredient.type === 'Starter' && ingredient.hydration === undefined) {
            return total + (Number(ingredient.displayWeight) || 0);
        }
        return total;
    }, 0);
}

// Function to calculate total flour weight, including starter flour
function calculateTotalFlourWeight(ingredients) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return 0;
    }

    return ingredients.reduce((total, ingredient) => {
        if (ingredient.type === 'Flour') {
            return total + (Number(ingredient.weight) || 0);
        } else if (ingredient.starter && ingredient.type === 'Starter' && ingredient.hydration === undefined) {
            return total + (Number(ingredient.displayWeight) || 0);
        }
        return total;
    }, 0);
}

// Function to calculate hydration
function calculateHydration(flourWeight, waterWeight) {
    return flourWeight > 0 ? (waterWeight / flourWeight) * 100 : 0;
}


function toggleIngredientSectionsVisibility(prefermentIngredients, extraIngredients) {
    // Toggle preferment section visibility
    const prefermentSection = document.querySelector('[recipe="preferment-section"]');
    if (prefermentIngredients.length > 0) {
        prefermentSection.classList.remove('is-hidden');
    } else {
        prefermentSection.classList.add('is-hidden');
    }

    // Toggle preferment item visibility
    const prefermentItem = document.querySelector('[recipe="preferment-dough-item"]');
    if (prefermentIngredients.length < 1) {
        prefermentItem.classList.add('is-hidden');
    } else {
        prefermentItem.classList.remove('is-hidden');
        // Additionally, ensure the parent element of the dough-basics-list is visible if there are preferment items
        const doughBasicsListWrapper = document.querySelector('[recipe="dough-basics-list"]').parentElement;
        if (doughBasicsListWrapper) {
            doughBasicsListWrapper.classList.remove('is-hidden');
            doughBasicsListWrapper.style.display = ''; // Ensure it's visible by resetting any inline display style
        }
    }


    // Toggle extras section visibility
    const extrasSection = document.querySelector('[recipe="extras-section"]');
    if (extraIngredients.length > 0) {
        extrasSection.classList.remove('is-hidden');
    } else {
        extrasSection.classList.add('is-hidden');
    }
}


// Update Ingredients List
function updateIngredientsList(selector, ingredients, totalDoughIngredients) {
    const list = document.querySelector(selector);
    const template = list.children[0].cloneNode(true); // Clone the template
    list.innerHTML = ''; // Clear the list
    // Hide the list wrapper if no ingredients of these types
    const listWrapper = list.parentElement;
    if (ingredients.length === 0) {
        listWrapper.style.display = 'none';
        return;
    } else {
        listWrapper.style.display = '';
    }

    list.innerHTML = ''; // Clear the list
    ingredients.forEach(ingredient => {
        // Skip rendering starter ingredients in flour and fluid lists
        if (ingredient.starter) {
            return; // Skip this iteration if the ingredient is part of a starter
        }

        const clone = document.importNode(template, true);

        // Set name
        clone.querySelector('[recipe="ingredient-name"]').textContent = ingredient.name;

        // Set weight, adjusting for starter ingredients if needed
        const weight = ingredient.type === "Starter" && ingredient.displayWeight ? ingredient.displayWeight : ingredient.weight;
        clone.querySelector('[recipe="ingredient-weight"]').textContent = `${weight}`;

        // Handling hydration percent visibility (if applicable to the list)
        const hydrationPercentElement = clone.querySelector('[recipe="hydration-percent"]');
        if (hydrationPercentElement) {
            const hydrationPercentWrapper = hydrationPercentElement.parentElement;
            if (ingredient.hydration !== undefined) {
                hydrationPercentElement.textContent = `${ingredient.hydration}%`;
                hydrationPercentWrapper.classList.remove('is-hidden');
            } else {
                hydrationPercentWrapper.classList.add('is-hidden');
            }
        }

        // Setting percent value for ingredients except 'Extra'
        if (ingredient.type !== 'Extra') {
            const percentElement = clone.querySelector('[recipe="ingredient-percent"]');
            if (percentElement) {
                // Calculate the total flour weight based on checkbox state
                let flourWeightForCalculation;
                if (includeStarterInCalculations) {
                    // If including starter, use the total flour weight that includes starter flour
                    flourWeightForCalculation = calculateTotalFlourWeight(totalDoughIngredients);
                } else {
                    // If excluding starter, use a modified total that excludes starter flour
                    flourWeightForCalculation = totalDoughIngredients.filter(i => !i.starter || i.type !== 'Starter').reduce((total, i) => total + (i.weight || 0), 0);
                }

                // Calculate and set the percentage
                const weight = ingredient.displayWeight || ingredient.weight;
                const percent = (weight / flourWeightForCalculation) * 100;
                percentElement.textContent = `${percent.toFixed(1)}%`;
            }
        }

        list.appendChild(clone);
    });
}

// Main Update Function
function updatePageWithRecipeData(recipeData) {
    document.querySelector('[recipe="recipe-title"]').textContent = recipeData.title || "Recipe title";
    document.querySelector('[recipe="recipe-description"]').textContent = recipeData.description || "No description provided";
    document.querySelector('[recipe="created-on"]').textContent = formatDate(recipeData.time_created);
    document.querySelector('[recipe="created-by"]').textContent = recipeData.public_author || "Author not available";
    document.querySelector('[recipe="quantity"]').textContent = recipeData.quantity || "Quantity not available";

    // Update image
    updateImageSrc(recipeData);

    const unit = getUnit(recipeData.format);
    document.querySelectorAll('[recipe="format"]').forEach(element => element.textContent = unit);

    // Hide steps header if no steps in list
    const stepsSection = document.getElementById('steps');
    if (recipeData.steps && recipeData.steps.length < 1) {
        // If there are no steps, hide the steps section
        if (stepsSection) {
            stepsSection.classList.add('is-hidden');
        }
    } else {
        // If there are steps, make sure the section is visible
        if (stepsSection) {
            stepsSection.classList.remove('is-hidden');
        }
    
        // Update recipe steps
        const stepsListElement = document.querySelector('ul[recipe="steps-list"]');

        if (stepsListElement && stepsListElement.children.length > 0) {
            const templateElement = stepsListElement.children[0];
            const templateHTML = templateElement.innerHTML;
            const templateClass = templateElement.className;
            renderStepsListItems(stepsListElement, recipeData.steps, templateHTML, templateClass);
        }
    }

        // Calculate and update weights and hydration
        const doughIngredients = recipeData.ingredients.filter(ingredient => !ingredient.preferment && ingredient.type !== 'Extra');
        const totalDoughIngredients = recipeData.ingredients.filter(ingredient => ingredient.type !== 'Extra');
        const prefermentIngredients = recipeData.ingredients.filter(ingredient => ingredient.preferment);
        const extraIngredients = recipeData.ingredients.filter(ingredient => ingredient.type === 'Extra');

        // Calculate dough stats
        const totalDoughWeight = calculateTotalWeight(totalDoughIngredients);
        const totalFlourWeight = calculateTotalFlourWeight(totalDoughIngredients);

        // Calculate preferment stats
        const totalPrefermentDoughWeight = calculateTotalWeight(prefermentIngredients);
        const totalPrefermentFlourWeight = calculateTotalFlourWeight(prefermentIngredients);

        // Calculate hydration for dough
        const doughFlourWeight = calculateTotalFlourWeight(totalDoughIngredients);
        const doughWaterWeight = calculateTotalFluidWeight(totalDoughIngredients);
        const doughHydration = calculateHydration(doughFlourWeight, doughWaterWeight);

        // Calculate hydration for preferment
        const prefermentFlourWeight = calculateTotalFlourWeight(prefermentIngredients);
        const prefermentWaterWeight = calculateTotalFluidWeight(prefermentIngredients);
        const prefermentHydration = calculateHydration(prefermentFlourWeight, prefermentWaterWeight);

        // Dough stats overview
        document.querySelector('[recipe="dough-weight"]').textContent = `${totalDoughWeight}`;
        document.querySelector('[recipe="flour-weight"]').textContent = `${totalFlourWeight}`;
        document.querySelector('[recipe="hydration"]').textContent = `${doughHydration.toFixed(1)}%`;

        // Preferment stats overview
        document.querySelectorAll('[recipe="preferment-weight"]').forEach((element) => {
            element.textContent = `${totalPrefermentDoughWeight}`;
        });
        document.querySelector('[recipe="preferment-flour-weight"]').textContent = `${totalPrefermentFlourWeight}`;
        document.querySelector('[recipe="preferment-hydration"]').textContent = `${prefermentHydration.toFixed(1)}%`;

        // Update dough ingredients lists
        updateIngredientsList('[recipe="dough-flour-list"]', doughIngredients.filter(ingredient => ingredient.type === 'Flour'), totalDoughIngredients);
        updateIngredientsList('[recipe="dough-fluid-list"]', doughIngredients.filter(ingredient => ingredient.type === 'Fluid'), totalDoughIngredients);
        updateIngredientsList('[recipe="dough-basics-list"]', doughIngredients.filter(ingredient => ['Starter', 'Salt', 'Yeast'].includes(ingredient.type)), totalDoughIngredients);
        updateIngredientsList('[recipe="dough-additions-list"]', doughIngredients.filter(ingredient => ingredient.type === 'Addition'), totalDoughIngredients);

        // Update preferment ingredients lists
        updateIngredientsList('[recipe="preferment-flour-list"]', prefermentIngredients.filter(ingredient => ingredient.type === 'Flour'), totalDoughIngredients);
        updateIngredientsList('[recipe="preferment-fluid-list"]', prefermentIngredients.filter(ingredient => ingredient.type === 'Fluid'), totalDoughIngredients);
        updateIngredientsList('[recipe="preferment-basics-list"]', prefermentIngredients.filter(ingredient => ['Starter', 'Salt', 'Yeast'].includes(ingredient.type)), totalDoughIngredients);
        updateIngredientsList('[recipe="preferment-additions-list"]', prefermentIngredients.filter(ingredient => ingredient.type === 'Addition'), totalDoughIngredients);


        // Assuming totalPrefermentDoughWeight and totalFlourWeight are already calculated
        const prefermentPercent = (totalPrefermentDoughWeight / totalFlourWeight) * 100;

        // Update all elements with the recipe attribute preferment-percent
        document.querySelectorAll('[recipe="preferment-percent"]').forEach((element) => {
            element.textContent = `${prefermentPercent.toFixed(1)}%`;
        });

        // Update extra ingredients lists
        updateIngredientsList('[recipe="extras-list"]', extraIngredients);

        // Toggle visibility of preferment and extras sections based on their content
        toggleIngredientSectionsVisibility(prefermentIngredients, extraIngredients);

        // Update the page title with the recipe title and " | Made with Homebaker"
        document.title = `${recipeData.title || "Recipe made with Homebaker"} | Made with Homebaker`;

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

        // Attach event listener to toggle
        document.getElementById('starterToggle').addEventListener('change', handleStarterToggleChange);

    }

    main();
