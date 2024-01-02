// Firebase configuration
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
  firebase.initializeApp(firebaseConfig);
  
  // Function to fetch data from Firestore
  async function fetchRecipeData() {
      const recipeId = new URLSearchParams(window.location.search).get('id');
      try {
          const recipeRef = firebase.firestore().doc(`recipes/${recipeId}`);
          const doc = await recipeRef.get();
          if (doc.exists) {
              return doc.data();
          } else {
              console.log("No such document!");
          }
      } catch (error) {
          console.error('Error fetching recipe data:', error);
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
            // Hide the parent element of stepTimerElement
            const timerChipElement = clone.querySelector('[recipe="meta-timer-chip"]');
            if (timerChipElement) {
                timerChipElement.style.display = 'none';
            }
        }

        // ... update/hide other parts of the clone as necessary

        listElement.appendChild(clone);
    });
}

// Function for updating recipe page data
function updatePageWithRecipeData(recipeData) {
    // Update simple text fields
    document.querySelector('[recipe="recipe-title"]').textContent = recipeData.title || "Recipe title";
    document.querySelector('[recipe="recipe-description"]').textContent = recipeData.description || "No description provided";
    document.querySelector('[recipe="created-on"]').textContent = recipeData.time_created || "Date not available";
    document.querySelector('[recipe="created-by"]').textContent = recipeData.public_author || "Author not available";
    document.querySelector('[recipe="quantity"]').textContent = recipeData.quantity || "Quantity not available";
    document.querySelector('[recipe="quantity"]').textContent = recipeData.quantity || "Quantity not available";

    // Update image
    updateImageSrc(recipeData);

    // Update format
    updateFormatElements(recipeData);

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
    const recipeData = await fetchRecipeData();
    if (recipeData) {
        updatePageWithRecipeData(recipeData);
    }
}

main();