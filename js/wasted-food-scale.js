let score = 0;
let totalWaste = 0;
let co2Reduction = 0;
let wasteLog = [];

if (localStorage.getItem('score')) {
    score = parseInt(localStorage.getItem('score'));
}

if (localStorage.getItem('totalWaste')) {
    totalWaste = parseFloat(localStorage.getItem('totalWaste'));
}

if (localStorage.getItem('co2Reduction')) {
    co2Reduction = parseFloat(localStorage.getItem('co2Reduction'));
}

if (localStorage.getItem('wasteLog')) {
    wasteLog = JSON.parse(localStorage.getItem('wasteLog'));
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

    // Save score in local storage
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

    // Save score in local storage
    localStorage.setItem('score', score);
}

function showFeedback(decision, message) {
    document.getElementById('finalDecision').classList.remove('hidden');
    document.getElementById('finalDecisionText').textContent = message;
    if (decision != 'landfill') {
        document.getElementById('inputTracker').classList.remove('hidden');
    }
}

function logWaste() {
    const wasteAmount = parseFloat(document.getElementById('wasteAmount').value);

    if (!isNaN(wasteAmount) && wasteAmount > 0) {
        totalWaste += wasteAmount;
        co2Reduction += wasteAmount * 1.37;

        wasteLog.push({
            amount: wasteAmount.toFixed(2),
            co2Saved: (wasteAmount * 1.37).toFixed(2),
            currentScore: score
        });

        localStorage.setItem('totalWaste', totalWaste);
        localStorage.setItem('co2Reduction', co2Reduction);
        localStorage.setItem('score', score)
        localStorage.setItem('wasteLog', JSON.stringify(wasteLog));

        updateDashboard();
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

    updateDashboard();
}

function updateDashboard() {
    document.getElementById('totalWaste').textContent = totalWaste.toFixed(2);
    document.getElementById('co2Reduction').textContent = co2Reduction.toFixed(2);
    document.getElementById('score').textContent = score;
}

function findResources() {
    document.getElementById('localResources').classList.remove('hidden');
    document.getElementById('resourceResult').textContent = "Mock: Compost centers and food banks in your area.";
}
