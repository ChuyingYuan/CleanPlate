let score = 0;
let totalWaste = 0;
let co2Reduction = 0;
let count = 0;
let percent = 0;
let isAuthenticated = false;

// Retrieve stored values from local storage
if (localStorage.getItem('count')) {
    count = parseInt(localStorage.getItem('count'));
}

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

if (localStorage.getItem('userID')) {
    isAuthenticated = true;
}

// Function to store the user's data in the DynamoDB table
async function storeData(userID, products, score, totalWaste, co2Reduction, count) {
    const url = "https://rvtkdasc90.execute-api.ap-southeast-2.amazonaws.com/prod/user-data";

    const data = {
        userID: userID,
        products: products,
        score: score,
        totalWaste: totalWaste,
        co2Reduction: co2Reduction,
        count: count
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ body: JSON.stringify(data) })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Data stored successfully:');
    } catch (error) {
        console.error('Error storing data:', error);
    }
}

// Function to handle the user's response to whether the food is edible
function isFoodEdible(answer) {
    document.getElementById('isEdible').classList.add('hidden');

    if (answer === 'yes') {
        document.getElementById('planToConsume').classList.remove('hidden');
    } else {
        document.getElementById('feedAnimalsCheck').classList.remove('hidden');
    }
}

// Function to handle the user's response to whether they plan to consume or donate the food
function consumeOrDonate(decision) {
    document.getElementById('planToConsume').classList.add('hidden');

    if (decision === 'consume') {
        score += 5;
        count += 1;
        showFeedback(decision, "Great! Plan to eat it within your next meal(s) or use it in a recipe.");
    } else {
        score += 4;
        count += 1;
        showFeedback(decision, "Donate the food to a local food bank or community kitchen.");
    }
    navigateToRelatedPage(decision);
    localStorage.setItem('count', count);
    localStorage.setItem('score', score);
    updateDashboard();
}

// Function to handle the user's response to whether they plan to compost or use for biofuel
function compostOrBiofuel(decision) {
    document.getElementById('compostCheck').classList.add('hidden');

    if (decision === 'compost') {
        score += 1;
        count += 1
        showFeedback(decision, "Compost it at home or through community composting.");
    } else {
        document.getElementById('biofuelCheck').classList.remove('hidden');
    }
    navigateToRelatedPage(decision);
    localStorage.setItem('count', count);
    localStorage.setItem('score', score);
    updateDashboard();
}

// Function to handle the user's response to whether the food is suitable for animals
function isFoodForAnimals(answer) {
    document.getElementById('feedAnimalsCheck').classList.add('hidden');

    if (answer === 'yes') {
        score += 2;
        count += 1;
        showFeedback('Feed Animals', "Repurpose the food scraps for animal feed.");
        navigateToRelatedPage('Feed Animals');
    } else {
        document.getElementById('compostCheck').classList.remove('hidden');
    }
    localStorage.setItem('count', count);
    localStorage.setItem('score', score);
    updateDashboard();
}

// Function to handle the user's response to whether the food can be used for anaerobic digestion
function canUseForBiofuel(answer) {
    document.getElementById('biofuelCheck').classList.add('hidden');
    let decision = '';

    if (answer === 'yes') {
        score += 1;
        count += 1;
        decision = 'Anaerobic Digestion';
        showFeedback(decision, "Participate in a local food waste-to-energy program (Anaerobic Digestion).");
    } else {
        count += 1;
        decision = 'landfill';
        showFeedback(decision, "Dispose of it properly and work on reducing waste in the future.");
    }
    navigateToRelatedPage(decision);
    localStorage.setItem('count', count);
    localStorage.setItem('score', score);
    updateDashboard();
}

// Function to display the final decision and feedback to the user
function showFeedback(decision, message) {
    if (isAuthenticated) {
        storeData(localStorage.getItem('userID'), [], score, totalWaste.toFixed(2), co2Reduction.toFixed(2), count);
    }
    document.getElementById('finalDecision').classList.remove('hidden');
    document.getElementById('finalDecisionText').textContent = message;
    if (decision != 'landfill') {
        document.getElementById('inputTracker').classList.remove('hidden');
    }
}

// Function to navigate to related page based on user's decision
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
            window.open('local-resources.html', '_blank');
        };
    }
    else {
        navigatingDiv.classList.add('hidden');
        navigatingText.classList.add('hidden');
        navigateButton.classList.add('hidden');
    }
}

// Function to log the waste amount and calculate the CO2 emission
async function logWaste() {
    const wasteAmount = parseFloat(document.getElementById('wasteAmount').value);

    // Check if the input is a valid number
    if (!isNaN(wasteAmount) && wasteAmount > 0) {
        try {
            // Call the Climatiq API to estimate the CO2 emission
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

            // If the response is successful, update the dashboard and restart the tool
            if (response.ok) {
                const data = await response.json();
                const co2Emission = data.co2e;
                console.log("CO2 emission:", co2Emission);

                totalWaste += wasteAmount;
                co2Reduction += co2Emission;

                localStorage.setItem('totalWaste', totalWaste.toFixed(2));
                localStorage.setItem('co2Reduction', co2Reduction.toFixed(2));
                localStorage.setItem('score', score);

                if (isAuthenticated) {
                    storeData(localStorage.getItem('userID'), [], score, totalWaste.toFixed(2), co2Reduction.toFixed(2), count);
                }
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

// Function to restart the tool
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
    document.getElementById('feedAnimalsCheck').classList.add('hidden');
    document.getElementById('biofuelCheck').classList.add('hidden');

    updateDashboard();
}

// Function to update the dashboard with the stored values
function updateDashboard() {
    const storedTotalWaste = localStorage.getItem('totalWaste') || 0;
    const storedCo2Reduction = localStorage.getItem('co2Reduction') || 0;
    const storedScore = localStorage.getItem('score') || 0;
    const storedCount = localStorage.getItem('count') || 0;

    document.getElementById('totalWaste').textContent = storedTotalWaste;
    document.getElementById('co2Reduction').textContent = storedCo2Reduction;
    document.getElementById('score').textContent = storedScore;
    document.getElementById('count').textContent = storedCount;

    if (count > 0) {
        percent = (score / (count * 5)) * 100;
    } else {
        percent = 0;
    }

    renderGauge(percent);
}

// Function to render the gauge with the given percentage
function renderGauge(percentage) {
    // console.log("Rendering gauge with percentage:", percentage);
    const progressPath = document.getElementById("gauge-progress");
    const gaugeText = document.getElementById("gauge-text");

    const validPercentage = Math.min(Math.max(percentage, 0), 100);
    // console.log("Valid percentage:", validPercentage);

    const arcLength = 41;

    const dashArrayValue = (validPercentage / 100) * arcLength;
    progressPath.setAttribute(
        "stroke-dasharray",
        `${dashArrayValue} ${arcLength}`
    );

    gaugeText.textContent = validPercentage.toFixed(0) + "%";
}
