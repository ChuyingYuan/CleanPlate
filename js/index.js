document.addEventListener('DOMContentLoaded', function () {
    const greetingElement = document.getElementById('greeting');
    const day3 = document.getElementById('day3message');
    const day7 = document.getElementById('day7message');
    const day15 = document.getElementById('day15message');
    const currentHour = new Date().getHours();
    const today = new Date();
    let score = 0;
    let count = 0;
    let percent = 0;

    // Retrieve stored values from local storage
    if (localStorage.getItem("count")) {
        count = parseInt(localStorage.getItem("count"));
    }

    if (localStorage.getItem("score")) {
        score = parseInt(localStorage.getItem("score"));
    }

    // List of features with their corresponding data
    const featureData = {
        'expiry-tracker': {
            title: 'Expiry Tracker',
            description: ['Scan / Upload Barcode', 'Upload Receipt', 'Food Recognition'],
            link: '../html/expiry-date-tracker.html',
            screenshot: '../static/expiry-tracker.png'
        },
        'recipe-search': {
            title: 'Recipe Search',
            description: ['Search by Ingredients', 'Search by Recipe Name', 'Calories'],
            link: '../html/recipe.html',
            screenshot: '../static/recipe.png'
        },
        'notification': {
            title: 'Notification',
            description: ['View Total Number of Upcoming Expiring Items ', 'Calendar', 'List'],
            link: '../html/notification.html',
            screenshot: '../static/notification.png'
        },
        'dashboard': {
            title: 'Dashboard',
            description: ['Overview of Food Waste in Australia', 'Track WasteInsights on Waste Produced by Households', 'Estimated Melbourne Food Waste (Per Year)'],
            link: '../html/dashboard.html',
            screenshot: '../static/dashboard.png'
        },
        'wastedFoodScale': {
            title: 'Wasted Food Scale',
            description: ['Guided Decision Making Tool', 'Effort Tracker'],
            link: '../html/wasted-food-scale.html',
            screenshot: '../static/wastedFoodScale.png'
        }

    };

    window.onload = function () {
        updateGreeting();
        displayExpiringItems();

        if (count > 0) {
            percent = (score / (count * 5)) * 100;
        } else {
            percent = 0;
        }

        renderGauge(percent);
    };

    // Function to update the greeting based on the current time
    function updateGreeting() {
        let greeting;
        if (currentHour < 12) {
            greeting = `
            <h1 class="page-label text-xl font-bold">
                Good Morning <img src="https://img.icons8.com/?size=100&id=648&format=png&color=000000" class="w-6 h-6 ml-2 inline-block"/>
            </h1>`;
        } else if (currentHour < 18) {
            greeting = `
            <h1 class="page-label text-xl font-bold">
                Good Afternoon <img src="https://img.icons8.com/?size=100&id=648&format=png&color=000000" class="w-6 h-6 ml-2 inline-block"/>
            </h1>`;
        } else {
            greeting = `
            <h1 class="page-label text-xl font-bold">
                Good Evening <img src="https://img.icons8.com/?size=100&id=25031&format=png&color=000000" class="w-6 h-6 ml-2 inline-block"/>
            </h1>`;
        }
        greetingElement.innerHTML = greeting;
    }

    // Event listener for displaying feature info card
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', function (event) {
            event.preventDefault();
            const featureKey = this.getAttribute('data-feature');
            const feature = featureData[featureKey];

            // Remove selected class from all cards and add it to the clicked card
            document.querySelectorAll('.feature-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('feature-title').innerText = feature.title;

            // Display feature description
            const featureDescriptionElement = document.getElementById('feature-description');
            featureDescriptionElement.innerHTML = '';
            feature.description.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = item;
                featureDescriptionElement.appendChild(listItem);
            });

            // Update feature link and screenshot
            document.getElementById('feature-link').setAttribute('href', feature.link);
            document.getElementById('feature-screenshot').setAttribute('src', feature.screenshot);
            document.getElementById('feature-info-box').classList.remove('hidden');
        });
    });

    // Function to check for expiring items within the given range
    function getExpiringItems(range) {
        const expiringItems = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count', 'userID', 'currentUser', 'groceries'].includes(key)) {
                continue;
            }
            const product = JSON.parse(localStorage.getItem(key));

            if (product?.expirationDate) {
                const expirationDate = new Date(product.expirationDate);
                const daysUntilExpiry = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= range && daysUntilExpiry >= 0) {
                    expiringItems.push({
                        key: key,
                        productName: product.productName,
                        category: product.category,
                        expirationDate: product.expirationDate,
                        imageUrl: product.imageUrl,
                        daysUntilExpiry: daysUntilExpiry
                    });
                }
            }
        }
        return expiringItems;
    }

    // Function to display expiring items in different time frames (3, 7, 15)
    function displayExpiringItems() {
        // Display message for items expiring in 3 days
        const expiringItems3Days = getExpiringItems(3);
        const items3Days = expiringItems3Days.length;

        if (items3Days > 0) {
            day3.textContent = `You have ${items3Days} item(s) about to expire within 3 days!`;
        }
        else {
            day3.textContent = `You have no items expiring in 3 days.`;
        }

        // Display message for items expiring in 7 days
        const expiringItems7Days = getExpiringItems(7);
        const items7Days = expiringItems7Days.length;

        if (items7Days > 0) {
            day7.textContent = `You have ${items7Days} item(s) about to expire within 7 days!`;
        }
        else {
            day7.textContent = `You have no items expiring in 7 days.`;
        }

        // Display message for items expiring in 15 days
        const expiringItems15Days = getExpiringItems(15);
        const items15Days = expiringItems15Days.length;

        if (items15Days > 0) {
            day15.textContent = `You have ${items15Days} item(s) about to expire within 15 days!`;
        }
        else {
            day15.textContent = `You have no items expiring in 15 days.`;
        }
    }

    // Function to render the gauge with the given percentage
    function renderGauge(percentage) {
        // console.log("Rendering gauge with percentage:", percentage);
        const progressPath = document.getElementById("gauge-progress");
        const gaugeText = document.getElementById("gauge-text");

        const validPercentage = Math.min(Math.max(percentage, 0), 100);
        // console.log("Valid percentage:", validPercentage);

        const radius = 13;
        const circumference = 2 * Math.PI * radius;

        const dashArrayValue = (validPercentage / 100) * circumference;
        const remainingLength = circumference;

        progressPath.setAttribute(
            "stroke-dasharray",
            `${dashArrayValue} ${remainingLength}`
        );

        gaugeText.textContent = validPercentage.toFixed(0) + "%";
    }
});