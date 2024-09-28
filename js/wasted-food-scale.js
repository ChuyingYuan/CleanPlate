let score = 0;
let totalWaste = 0;
let co2Reduction = 0;

if (localStorage.getItem('score')) {
    score = parseInt(localStorage.getItem('score'));
}

if (localStorage.getItem('totalWaste')) {
    totalWaste = parseFloat(localStorage.getItem('totalWaste'));
}

if (localStorage.getItem('co2Reduction')) {
    co2Reduction = parseFloat(localStorage.getItem('co2Reduction'));
}

updateDashboard();

function isFoodEdible(answer) {
    document.getElementById('isEdible').classList.add('hidden');

    if (answer === 'yes') {
        document.getElementById('planToConsume').classList.remove('hidden');
    } else {
        document.getElementById('compostCheck').classList.remove('hidden');
    }
}

function consumeOrDonate(decision) {
    document.getElementById('planToConsume').classList.add('hidden');

    if (decision === 'consume') {
        score += 3;
        showFeedback(decision, "Great! Plan to eat it within your next meal(s) or use it in a recipe.");
    } else {
        score += 2;
        showFeedback(decision, "Donate the food to a local food bank or community kitchen.");
    }
    navigateToRelatedPage(decision);
    localStorage.setItem('score', score);
}

function compostOrLandfill(decision) {
    document.getElementById('compostCheck').classList.add('hidden');

    if (decision === 'compost') {
        score += 1;
        showFeedback(decision, "Compost it at home or through community composting.");
    } else {
        score += 0;
        showFeedback(decision, "Dispose of it properly and work on reducing waste in the future.");
    }
    navigateToRelatedPage(decision);
    localStorage.setItem('score', score);
}

function showFeedback(decision, message) {
    document.getElementById('finalDecision').classList.remove('hidden');
    document.getElementById('finalDecisionText').textContent = message;
    if (decision != 'landfill') {
        document.getElementById('inputTracker').classList.remove('hidden');
    }
}

function navigateToRelatedPage(decision) {
    const navigatingDiv = document.getElementById('navigating');
    const navigatingText = document.getElementById('navigatingText');
    const navigateButton = document.getElementById('navigateButton');

    navigatingDiv.classList.remove('hidden');
    navigateButton.classList.remove('hidden');

    if (decision === 'consume') {
        navigatingText.innerHTML = "Click the button below to find recipe ideas!";
        navigateButton.textContent = "Go to Search for Recipes";
        navigateButton.onclick = () => {
            window.open('recipe.html', '_blank');
        };
    }
    else if (decision === 'donate') {
        navigatingText.textContent = "Click the button below to find local food banks!";
        navigateButton.textContent = "Go to Donation Resources";
        navigateButton.onclick = () => {
            window.open('donate.html', '_blank');
        };
    }
    else if (decision === 'compost') {
        navigatingText.textContent = "Click the button below to explore composting resources!";
        navigateButton.textContent = "Go to Composting Resources";
        navigateButton.onclick = () => {
            window.open('compost.html', '_blank');
        };
    } else {
        navigatingDiv.classList.add('hidden');
        navigatingText.classList.add('hidden');
        navigateButton.classList.add('hidden');
    }
}

async function logWaste() {
    const wasteAmount = parseFloat(document.getElementById('wasteAmount').value);

    if (!isNaN(wasteAmount) && wasteAmount > 0) {
        try {
            const response = await fetch('https://api.climatiq.io/data/v1/estimate', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer B08A8BYFXX0CKDS061DKKD945R',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    emission_factor: {
                        activity_id: 'waste-type_food_waste-disposal_method_landfilled',
                        data_version: '^0'
                    },
                    parameters: {
                        weight: wasteAmount,
                        weight_unit: 'kg'
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const co2Emission = data.co2e;
                console.log("CO2 emission:", co2Emission);

                totalWaste += wasteAmount;
                co2Reduction += co2Emission;

                localStorage.setItem('totalWaste', totalWaste.toFixed(2));
                localStorage.setItem('co2Reduction', co2Reduction.toFixed(2));
                localStorage.setItem('score', score);

                updateDashboard();
                restartTool();
            } else {
                console.error("API error:", response.statusText);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while recording the waste. Please try again.");
        }
    } else {
        console.log("Invalid input: Please enter a valid waste amount.");
        alert("Please enter a valid amount.");
    }
}

function restartTool() {
    document.getElementById('isEdible').classList.add('hidden');
    document.getElementById('planToConsume').classList.add('hidden');
    document.getElementById('compostCheck').classList.add('hidden');
    document.getElementById('finalDecision').classList.add('hidden');
    document.getElementById('inputTracker').classList.add('hidden');
    document.getElementById('isEdible').classList.remove('hidden');
    document.getElementById('wasteAmount').value = '';
    document.getElementById('navigating').classList.add('hidden');
    document.getElementById('navigateButton').classList.add('hidden');

    updateDashboard();
}

function updateDashboard() {
    const storedTotalWaste = localStorage.getItem('totalWaste') || 0;
    const storedCo2Reduction = localStorage.getItem('co2Reduction') || 0;
    const storedScore = localStorage.getItem('score') || 0;

    document.getElementById('totalWaste').textContent = storedTotalWaste;
    document.getElementById('co2Reduction').textContent = storedCo2Reduction;
    document.getElementById('score').textContent = storedScore;
}

// TODO: Render the local resources based on the user's location
function findResources() {
    document.getElementById('localResources').classList.remove('hidden');
    document.getElementById('resourceResult').textContent = "Mock: Compost centers and food banks in your area.";
}
