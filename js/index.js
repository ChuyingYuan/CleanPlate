document.addEventListener('DOMContentLoaded', function () {
    const greetingElement = document.getElementById('greeting');
    const day3 = document.getElementById('day3message');
    const day7 = document.getElementById('day7message');
    const day14 = document.getElementById('day14message');
    const currentHour = new Date().getHours();
    const today = new Date();

    window.onload = function () {
        updateGreeting();
        displayExpiringItems();
    };

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

    // Function to check for expiring items
    function getExpiringItems(range) {
        const expiringItems = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
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

    // Function to display expiring items
    function displayExpiringItems() {

        const expiringItems3Days = getExpiringItems(3);
        const items3Days = expiringItems3Days.length;

        if (items3Days > 0) {
            day3.textContent = `You have ${items3Days} item(s) about to expire within 3 days!`;
        }
        else {
            day3.textContent = `You have no items expiring in 3 days.`;
        }

        const expiringItems7Days = getExpiringItems(7);
        const items7Days = expiringItems7Days.length;

        if (items7Days > 0) {
            day7.textContent = `You have ${items7Days} item(s) about to expire within 7 days!`;
        }
        else {
            day7.textContent = `You have no items expiring in 7 days.`;
        }

        const expiringItems14Days = getExpiringItems(14);
        const items14Days = expiringItems14Days.length;

        if (items14Days > 0) {
            day14.textContent = `You have ${items14Days} item(s) about to expire within 14 days!`;
        }
        else {
            day14.textContent = `You have no items expiring in 14 days.`;
        }
    }
});