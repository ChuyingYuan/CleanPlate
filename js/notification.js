document.addEventListener("DOMContentLoaded", function () {
    const greetingElement = document.getElementById('greeting');
    const searchResults = document.getElementById("searchResults");
    const searchHeading = document.getElementById("searchHeading");
    const calendar = document.getElementById('calendarView');
    const currentHour = new Date().getHours();
    const today = new Date();
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let currentWeek = getWeekNumber(currentDate) - 1;
    let currentDay = currentDate.getDate();
    let currentView = 'monthly';
    const localStorage = window.localStorage;
    const listView = document.getElementById('listView');
    const listTitle = document.getElementById('list-title');
    const todaybtn = document.getElementById('today');
    const day3btn = document.getElementById('day3btn');
    const day15btn = document.getElementById('day15btn');
    const hideFromSearch = document.getElementById("hideFromSearch");
    const expiringItemsPopup = document.getElementById('expiringItemsPopup');
    const popupTitle = document.getElementById('popup-title');
    const popupContent = document.getElementById('popup-content');
    const ITEMS_PER_PAGE = 5;
    let currentPage = 1;
    const pagination = document.getElementById('pagination');

    window.onload = function () {
        resetAll();
        if (isMobileDevice()) {
            console.log("Mobile device detected");
        } else {
            console.log("Desktop device detected");
        }
    };

    window.resetAll = function resetAll() {
        hideFromSearch.classList.remove("hidden");
        expiringItemsPopup.classList.add('hidden');
        getExpiringItems(0);
        updateGreeting();
        resetSearchResults();
        renderCalendar(currentView);
    }

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

    function isMobileDevice() {
        return /Mobi|Android|iPad|iPhone|Tablet/i.test(navigator.userAgent);
    }

    // Function to search for specific item(s)
    window.performSearch = function performSearch(event) {
        event.preventDefault();
        console.log("Perform Search");
        const searchQuery = document
            .getElementById("simple-search")
            .value.toLowerCase()
            .trim();
        searchResults.innerHTML = "";

        if (!searchQuery) {
            const noResultsMessage = document.createElement("p");
            noResultsMessage.className = "text-center text-gray-500 mb-5";
            noResultsMessage.textContent = "Please enter a search term.";
            searchResults.appendChild(noResultsMessage);
            return;
        }

        let resultsFound = false;

        searchHeading.style.display = "block";
        hideFromSearch.classList.add("hidden");

        // Loop through all product items in the local storage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count'].includes(key)) {
                continue;
            }
            const product = JSON.parse(localStorage.getItem(key));

            // Check if the search query is found in the product name
            if (
                product &&
                product.productName &&
                product.productName.toLowerCase().includes(searchQuery)
            ) {
                resultsFound = true;

                const card = document.createElement("div");
                card.className = "food-list-card";
                const category =
                    product.category.charAt(0).toUpperCase() +
                    product.category.slice(1);

                const cardContent = `
                <div class="p-5">
                    <span class="category-label text-xs font-bold">${category}</span>
                    <div class="image-container">
                        <img src="${product.imageUrl}" alt="${product.productName}" class="my-4 rounded-lg" />
                    </div>
                    <p class="mt-2 text">${product.productName}</p>
                    <p class="mt-2 sub-text">Expires On: ${formatDateToAustralian(product.expirationDate)}</p>
                    <button class="mt-2 text-xs text-white bg-red-500 px-2 py-1 rounded-full" onclick="deleteProduct('${key}')">Delete</button>
                </div>
                `;

                card.innerHTML = cardContent;
                searchResults.appendChild(card);
            }
        }

        // Display message if no results are found
        if (!resultsFound) {
            searchHeading.style.display = "none";
            const noResultsMessage = document.createElement("p");
            noResultsMessage.className = "text-center text-gray-500 mb-5";
            noResultsMessage.textContent = "No results found";
            searchResults.appendChild(noResultsMessage);
        }
    };

    // Function to reset the search results
    function resetSearchResults() {
        searchHeading.style.display = "none";
        searchResults.innerHTML = "";
    }

    // Function to format the date in Australian format for display
    function formatDateToAustralian(dateStr) {
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    // Function to handle change of view
    window.changeView = function changeView(view) {
        currentView = view;
        renderCalendar(currentView);
    }

    // Function to render the calendar based on the view (common layout for all views)
    function renderCalendar(view) {
        calendar.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'flex items-center justify-between gap-3 mb-2';

        const headerLeft = document.createElement('div');
        headerLeft.className = 'flex items-center gap-4';

        const monthYearTitle = document.createElement('h5');
        monthYearTitle.className = 'text-l leading-8 font-semibold text-gray-900';
        monthYearTitle.id = 'currentMonthYear';
        monthYearTitle.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
        headerLeft.appendChild(monthYearTitle);

        header.appendChild(headerLeft);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'flex items-center gap-2';

        const todaybtn = document.createElement('button');
        todaybtn.className = 'flex text-sm px-4 py-2 rounded-full me-2 border border-gray-300 my-2';
        todaybtn.id = 'todayButton';
        todaybtn.innerHTML = `<svg
                class="pointer-events-none w-5 h-5 text-gray-600 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="none"
            >
                <path
                    d="M11.3333 3L11.3333 3.65L11.3333 3ZM4.66666 3.00002L4.66666 2.35002L4.66666 3.00002ZM5.36719 9.98333C5.72617 9.98333 6.01719 9.69232 6.01719 9.33333C6.01719 8.97435 5.72617 8.68333 5.36719 8.68333V9.98333ZM5.33385 8.68333C4.97487 8.68333 4.68385 8.97435 4.68385 9.33333C4.68385 9.69232 4.97487 9.98333 5.33385 9.98333V8.68333ZM5.36719 11.9833C5.72617 11.9833 6.01719 11.6923 6.01719 11.3333C6.01719 10.9743 5.72617 10.6833 5.36719 10.6833V11.9833ZM5.33385 10.6833C4.97487 10.6833 4.68385 10.9743 4.68385 11.3333C4.68385 11.6923 4.97487 11.9833 5.33385 11.9833V10.6833ZM8.03385 9.98333C8.39284 9.98333 8.68385 9.69232 8.68385 9.33333C8.68385 8.97435 8.39284 8.68333 8.03385 8.68333V9.98333ZM8.00052 8.68333C7.64154 8.68333 7.35052 8.97435 7.35052 9.33333C7.35052 9.69232 7.64154 9.98333 8.00052 9.98333V8.68333ZM8.03385 11.9833C8.39284 11.9833 8.68385 11.6923 8.68385 11.3333C8.68385 10.9743 8.39284 10.6833 8.03385 10.6833V11.9833ZM8.00052 10.6833C7.64154 10.6833 7.35052 10.9743 7.35052 11.3333C7.35052 11.6923 7.64154 11.9833 8.00052 11.9833V10.6833ZM10.7005 9.98333C11.0595 9.98333 11.3505 9.69232 11.3505 9.33333C11.3505 8.97435 11.0595 8.68333 10.7005 8.68333V9.98333ZM10.6672 8.68333C10.3082 8.68333 10.0172 8.97435 10.0172 9.33333C10.0172 9.69232 10.3082 9.98333 10.6672 9.98333V8.68333ZM10.7005 11.9833C11.0595 11.9833 11.3505 11.6923 11.3505 11.3333C11.3505 10.9743 11.0595 10.6833 10.7005 10.6833V11.9833ZM10.6672 10.6833C10.3082 10.6833 10.0172 10.9743 10.0172 11.3333C10.0172 11.6923 10.3082 11.9833 10.6672 11.9833V10.6833ZM5.98333 2C5.98333 1.64101 5.69232 1.35 5.33333 1.35C4.97435 1.35 4.68333 1.64101 4.68333 2H5.98333ZM4.68333 4C4.68333 4.35898 4.97435 4.65 5.33333 4.65C5.69232 4.65 5.98333 4.35898 5.98333 4H4.68333ZM11.3167 2C11.3167 1.64101 11.0257 1.35 10.6667 1.35C10.3077 1.35 10.0167 1.64101 10.0167 2H11.3167ZM10.0167 4C10.0167 4.35898 10.3077 4.65 10.6667 4.65C11.0257 4.65 11.3167 4.35898 11.3167 4H10.0167ZM4.66666 3.65002L11.3333 3.65L11.3333 2.35L4.66666 2.35002L4.66666 3.65002ZM13.35 5.66667V11.3334H14.65V5.66667H13.35ZM11.3333 13.35H4.66667V14.65H11.3333V13.35ZM2.65 11.3334V5.66668H1.35V11.3334H2.65ZM4.66667 13.35C4.01975 13.35 3.59995 13.3486 3.29025 13.307C2.99924 13.2679 2.90451 13.2042 2.85014 13.1499L1.9309 14.0691C2.26707 14.4053 2.68186 14.5369 3.11703 14.5954C3.53349 14.6514 4.0565 14.65 4.66667 14.65V13.35ZM1.35 11.3334C1.35 11.9435 1.34862 12.4665 1.40461 12.883C1.46312 13.3182 1.59474 13.733 1.9309 14.0691L2.85014 13.1499C2.79578 13.0955 2.73214 13.0008 2.69302 12.7098C2.65138 12.4001 2.65 11.9803 2.65 11.3334H1.35ZM13.35 11.3334C13.35 11.9803 13.3486 12.4001 13.307 12.7098C13.2679 13.0008 13.2042 13.0955 13.1499 13.1499L14.0691 14.0691C14.4053 13.733 14.5369 13.3182 14.5954 12.883C14.6514 12.4665 14.65 11.9435 14.65 11.3334H13.35ZM11.3333 14.65C11.9435 14.65 12.4665 14.6514 12.883 14.5954C13.3181 14.5369 13.7329 14.4053 14.0691 14.0691L13.1499 13.1499C13.0955 13.2042 13.0008 13.2679 12.7098 13.307C12.4 13.3486 11.9802 13.35 11.3333 13.35V14.65ZM11.3333 3.65C11.9802 3.65 12.4 3.65138 12.7098 3.69302C13.0008 3.73215 13.0955 3.79578 13.1499 3.85015L14.0691 2.93091C13.7329 2.59474 13.3181 2.46312 12.883 2.40461C12.4665 2.34862 11.9435 2.35 11.3333 2.35L11.3333 3.65ZM14.65 5.66667C14.65 5.05651 14.6514 4.53349 14.5954 4.11703C14.5369 3.68187 14.4053 3.26707 14.0691 2.93091L13.1499 3.85015C13.2042 3.90451 13.2679 3.99924 13.307 4.29025C13.3486 4.59996 13.35 5.01976 13.35 5.66667H14.65ZM4.66666 2.35002C4.0565 2.35002 3.53349 2.34864 3.11702 2.40463C2.68186 2.46314 2.26707 2.59476 1.9309 2.93092L2.85014 3.85016C2.90451 3.7958 2.99924 3.73216 3.29025 3.69304C3.59995 3.6514 4.01975 3.65002 4.66666 3.65002L4.66666 2.35002ZM2.65 5.66668C2.65 5.01977 2.65138 4.59997 2.69302 4.29027C2.73214 3.99926 2.79578 3.90452 2.85014 3.85016L1.9309 2.93092C1.59474 3.26709 1.46312 3.68188 1.40461 4.11704C1.34862 4.53351 1.35 5.05652 1.35 5.66668H2.65ZM2 7.31667H14V6.01667H2V7.31667ZM5.36719 8.68333H5.33385V9.98333H5.36719V8.68333ZM5.36719 10.6833H5.33385V11.9833H5.36719V10.6833ZM8.03385 8.68333H8.00052V9.98333H8.03385V8.68333ZM8.03385 10.6833H8.00052V11.9833H8.03385V10.6833ZM10.7005 8.68333H10.6672V9.98333H10.7005V8.68333ZM10.7005 10.6833H10.6672V11.9833H10.7005V10.6833ZM4.68333 2V4H5.98333V2H4.68333ZM10.0167 2V4H11.3167V2H10.0167Z"
                    fill="#000000"
                ></path>
            </svg>
            Today`;
        todaybtn.onclick = () => {
            currentDate = new Date();
            currentMonth = currentDate.getMonth();
            currentYear = currentDate.getFullYear();
            currentWeek = getWeekNumber(currentDate) - 1;
            renderCalendar(currentView);
        };
        buttonsDiv.appendChild(todaybtn);

        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&lt;';
        prevButton.id = 'prevBtn';
        if (view === 'monthly') {
            prevButton.onclick = () => changeMonth(-1);
        } else if (view === 'weekly') {
            prevButton.onclick = () => changeWeek(-1);
        } else if (view === 'daily') {
            prevButton.onclick = () => changeDay(-1);
        }
        prevButton.className = 'text-gray-500 hover:text-gray-900 text-sm px-2 py-2 rounded-full border border-gray-300 my-2';
        buttonsDiv.appendChild(prevButton);

        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&gt;';
        nextButton.id = 'nextBtn';
        if (view === 'monthly') {
            nextButton.onclick = () => changeMonth(1);
        } else if (view === 'weekly') {
            nextButton.onclick = () => changeWeek(1);
        } else if (view === 'daily') {
            nextButton.onclick = () => changeDay(1);
        }
        nextButton.className = 'text-gray-500 hover:text-gray-900 text-sm px-2 py-2 rounded-full border border-gray-300 my-2';
        buttonsDiv.appendChild(nextButton);

        const headerMiddle = document.createElement('div');
        headerMiddle.className = 'flex items-center gap-2';

        headerMiddle.appendChild(buttonsDiv);
        header.appendChild(headerMiddle);

        // Dropdown button for view selection (mobile)
        const dropdownButton = document.createElement('button');
        dropdownButton.className = 'block lg:hidden px-4 py-2 rounded-full border border-gray-300 text-sm font-medium';
        dropdownButton.textContent = 'View';
        dropdownButton.id = 'dropdownButton';

        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'relative right-0 hidden bg-white border border-gray-300 mt-2 rounded-md shadow-lg';
        dropdownMenu.id = 'dropdownMenu';

        const createDropdownItem = (text, view) => {
            const item = document.createElement('button');
            item.className = 'block w-full px-4 py-2 text-left rounded-md hover:bg-gray-100';
            item.textContent = text;
            item.onclick = () => {
                currentDate = new Date();
                currentMonth = currentDate.getMonth();
                currentYear = currentDate.getFullYear();
                currentWeek = getWeekNumber(currentDate) - 1;
                changeView(view);
            };
            return item;
        };

        dropdownMenu.appendChild(createDropdownItem('Monthly', 'monthly'));
        dropdownMenu.appendChild(createDropdownItem('Weekly', 'weekly'));
        dropdownMenu.appendChild(createDropdownItem('Daily', 'daily'));

        const createButton = (text, view) => {
            const button = document.createElement('button');
            button.className = 'hidden lg:block px-4 py-2 rounded-full border border-gray-300 text-sm font-medium';
            button.id = `${view}ViewBtn`;
            button.textContent = text;
            button.onclick = () => {
                currentDate = new Date();
                currentMonth = currentDate.getMonth();
                currentYear = currentDate.getFullYear();
                currentWeek = getWeekNumber(currentDate) - 1;
                changeView(view);
            };
            return button;
        };

        const monthlyButton = createButton('Monthly', 'monthly');
        const weeklyButton = createButton('Weekly', 'weekly');
        const dailyButton = createButton('Daily', 'daily');

        const headerRight = document.createElement('div');
        headerRight.className = 'flex items-center gap-4';

        headerRight.appendChild(dropdownButton);
        headerRight.appendChild(dropdownMenu);
        headerRight.appendChild(monthlyButton);
        headerRight.appendChild(weeklyButton);
        headerRight.appendChild(dailyButton);

        header.appendChild(headerRight);
        calendar.appendChild(header);

        dropdownButton.addEventListener('click', () => {
            dropdownMenu.classList.toggle('hidden');
        });

        // Legend for the calendar
        const legend = document.createElement('div');
        legend.className = 'flex items-center justify-center gap-5 mb-2';

        const expired = document.createElement('span');
        expired.className = 'bg-red-100 text-black rounded-full px-5 py-2 mb-1 mr-4 text-xs';
        expired.textContent = 'Expired';

        const today = document.createElement('span');
        today.className = 'today text-black rounded-full px-5 py-2 mb-1 mr-4 text-xs';
        today.textContent = 'Today';

        const upcomingExpiring = document.createElement('span');
        upcomingExpiring.className = 'upcoming-expiring text-black rounded-full px-5 py-2 mb-1 mr-4 text-xs';
        upcomingExpiring.textContent = 'Upcoming';

        legend.appendChild(expired);
        legend.appendChild(today);
        legend.appendChild(upcomingExpiring);
        calendar.appendChild(legend);

        // Render the calendar based on the view
        if (view === 'monthly') {
            monthlyButton.classList.add('selected');
            renderMonthlyView();
        } else if (view === 'weekly') {
            weeklyButton.classList.add('selected');
            renderWeeklyView();
        } else if (view === 'daily') {
            dailyButton.classList.add('selected');
            legend.classList.add('hidden');
            renderDailyView();
        }
    }

    // Function to render monthly view
    function renderMonthlyView() {
        // Days of the Week 
        const daysHeader = document.createElement('div');
        daysHeader.className = 'grid grid-cols-7 divide-gray-200 mb-3';

        ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'].forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'text-center text-sm font-medium text-gray-900';
            dayElement.textContent = day;
            daysHeader.appendChild(dayElement);
        });

        calendar.appendChild(daysHeader);

        // Calendar Days
        const daysGrid = document.createElement('div');
        daysGrid.className = 'grid grid-cols-7 divide-gray-200';

        const firstDay = new Date(currentYear, currentMonth).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Fill the days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            daysGrid.appendChild(emptyDay);
        }

        // Fill the days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            const dayDate = new Date(currentYear, currentMonth, day);

            dayElement.className = 'relative p-3 calendar-grid border border-gray-200 flex justify-between text-sm font-medium text-gray-900';
            dayElement.innerHTML = `<span class="text-sm font-medium text-gray-900">${day}</span>`;

            // Check for expiring items on this date
            const expiringItems = checkExpiringItems(dayDate);

            if (expiringItems.length > 0) {
                if (dayDate > today) {
                    dayElement.classList.add('upcoming-expiring');
                } else {
                    dayElement.classList.add('bg-red-100');
                }

                // Badge element showing the number of expiring items
                const badge = document.createElement('span');
                badge.className = 'absolute bottom-0 right-0 bg-red-500 text-white rounded-full px-2 py-1 mb-2 mr-2 text-xs cursor-pointer badgeBtn';

                // Display popup modal to show the expiring items
                badge.onclick = () => {
                    expiringItemsPopup.classList.remove('hidden');
                    popupTitle.textContent = 'Expiring Items on ' + dayDate.toDateString().slice(4, 15);
                    popupContent.innerHTML = '';
                    for (const item of expiringItems) {
                        const category = item.category.charAt(0).toUpperCase() + item.category.slice(1);
                        const content = `
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <p class="mt-2 text">${item.productName}</p>
                            </div>
                            <div class="ml-auto">
                                <span class="category-label text-xs font-bold">${category}</span>
                            </div>
                        </div>
                        <hr class="h-px my-4 bg-gray-200 border-0" />
                        `;
                        popupContent.innerHTML += content;
                    }
                };
                badge.textContent = expiringItems.length;
                dayElement.appendChild(badge);
            }

            // Highlight today's date
            if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            daysGrid.appendChild(dayElement);
        }
        calendar.appendChild(daysGrid);
    }

    // Function to render weekly view
    function renderWeeklyView() {
        const daysHeader = document.createElement('div');
        daysHeader.className = 'grid grid-cols-7 divide-gray-200 mb-3';

        // Days of the Week
        ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'].forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'text-center text-sm font-medium text-gray-900';
            dayElement.textContent = day;
            daysHeader.appendChild(dayElement);
        });

        calendar.appendChild(daysHeader);

        const firstDayOfWeek = getFirstDayOfWeek(currentWeek + 1, currentYear);

        const daysGrid = document.createElement('div');
        daysGrid.className = 'grid grid-cols-7 divide-gray-200';

        // Fill the days of the week
        for (let i = 0; i < 7; i++) {
            const dayElement = document.createElement('div');
            const dayDate = new Date(firstDayOfWeek.getTime() + i * 24 * 60 * 60 * 1000);

            const isCurrentMonth = dayDate.getMonth() === currentMonth;

            dayElement.className = `relative p-3 calendar-grid border border-gray-200 text-sm font-medium ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`;

            dayElement.innerHTML = dayDate.getDate();

            const expiringItems = checkExpiringItems(dayDate);

            if (expiringItems.length > 0) {
                if (dayDate > today) {
                    dayElement.classList.add('upcoming-expiring');
                } else {
                    dayElement.classList.add('bg-red-100');
                }

                // Badge element showing the number of expiring items
                const badge = document.createElement('button');
                badge.className = 'absolute bottom-0 right-0 bg-red-500 text-white rounded-full px-2 py-1 mb-2 mr-2 text-xs cursor-pointer badgeBtn';

                // Display popup modal to show the expiring items
                badge.onclick = () => {
                    expiringItemsPopup.classList.remove('hidden');
                    popupTitle.textContent = 'Expiring Items on ' + dayDate.toDateString().slice(4, 15);
                    popupContent.innerHTML = '';
                    for (const item of expiringItems) {
                        const category = item.category.charAt(0).toUpperCase() + item.category.slice(1);
                        const content = `
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <p class="mt-2 text">${item.productName}</p>
                            </div>
                            <div class="ml-auto">
                                <span class="category-label text-xs font-bold">${category}</span>
                            </div>
                        </div>
                        <hr class="h-px my-4 bg-gray-200 border-0" />
                        `;
                        popupContent.innerHTML += content;
                    }
                };
                badge.textContent = expiringItems.length;
                dayElement.appendChild(badge);
            }

            if (dayDate.getDate() === today.getDate() && dayDate.getMonth() === today.getMonth() && dayDate.getFullYear() === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            daysGrid.appendChild(dayElement);
        }
        calendar.appendChild(daysGrid);
    }

    // Function to render daily view
    function renderDailyView() {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'text-center mb-3 text-xl font-semibold text-gray-900';
        currentMonth = currentDate.getMonth();
        currentYear = currentDate.getFullYear();
        currentDay = currentDate.getDate();
        dayHeader.textContent = `${getMonthName(currentMonth)} ${currentDay}, ${currentYear}`;
        calendar.appendChild(dayHeader);

        const expiringItems = checkExpiringItems(currentDate);

        const itemContainer = document.createElement('div');
        itemContainer.className = 'p-4 sub-text';
        itemContainer.innerHTML = '';
        if (expiringItems.length > 0) {
            for (const item of expiringItems) {
                const category = item.category.charAt(0).toUpperCase() + item.category.slice(1);
                const content = ` 
                        <div class="flex items-center justify-between">
                            <div class="flex-1">
                                <p class="mt-2 text">${item.productName}</p>
                            </div>
                            <div class="ml-auto">
                                <span class="category-label text-xs font-bold">${category}</span>
                            </div>
                        </div>
                        <hr class="h-px my-4 bg-gray-200 border-0" />
            `;
                itemContainer.innerHTML += content;
            }
        } else {
            itemContainer.textContent = 'No expiring item';
        }
        calendar.appendChild(itemContainer);
    }

    // Functions to change the month, week, and day
    function changeMonth(direction) {
        currentMonth += direction;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        } else if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentView);
    }

    function changeWeek(direction) {
        currentWeek += direction;
        const maxWeeksInYear = getWeekNumber(new Date(currentYear, 11, 31));

        if (currentWeek < 1) {
            currentYear--;
            currentWeek = getWeekNumber(new Date(currentYear, 11, 31));
        } else if (currentWeek > maxWeeksInYear) {
            currentYear++;
            currentWeek = 1;
        }

        const firstDayOfWeek = getFirstDayOfWeek(currentWeek, currentYear);
        currentMonth = firstDayOfWeek.getMonth();
        renderCalendar(currentView);
    }

    function changeDay(direction) {
        currentDate.setDate(currentDate.getDate() + direction);
        currentDay = currentDate.getDate();
        currentMonth = currentDate.getMonth();
        currentYear = currentDate.getFullYear();
        renderCalendar(currentView);
    }

    // Function to get the month name
    function getMonthName(month) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return monthNames[month];
    }

    // Function to get the week number
    function getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    // Function to get the first day of the week
    function getFirstDayOfWeek(weekNumber, year) {
        const janFirst = new Date(year, 0, 1);
        const daysOffset = (weekNumber - 1) * 7;
        const dayOfWeek = janFirst.getDay();
        const firstDayOfWeek = new Date(janFirst.setDate(janFirst.getDate() - dayOfWeek + daysOffset));
        return firstDayOfWeek;
    }

    // Function to handle change the day range of List view
    window.changeListView = function changeListView(range) {
        if (range === 0) {
            console.log("Today");
            todaybtn.classList.add('selected');
            day3btn.classList.remove('selected');
            day15btn.classList.remove('selected');
            listTitle.textContent = 'Items Expiring Today';
        } else if (range === 3) {
            console.log("3 Days");
            day3btn.classList.add("selected");
            todaybtn.classList.remove('selected');
            day15btn.classList.remove('selected');
            listTitle.textContent = 'Items Expiring Within 3 Days';
        } else {
            console.log("15 Days");
            day15btn.classList.add("selected");
            todaybtn.classList.remove('selected');
            day3btn.classList.remove('selected');
            listTitle.textContent = 'Items Expiring Within 15 Days';
        }
        listView.innerHTML = '';
        getExpiringItems(range);
    }

    // Function to get expiring items on a specific day
    function checkExpiringItems(day) {
        const expiringItems = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count'].includes(key)) {
                continue;
            }
            const product = JSON.parse(localStorage.getItem(key));

            if (product?.expirationDate) {
                const expirationDate = new Date(product.expirationDate);

                if (expirationDate.getDate() === day.getDate() && expirationDate.getMonth() === day.getMonth() && expirationDate.getFullYear() === day.getFullYear()) {
                    expiringItems.push({
                        key: key,
                        productName: product.productName,
                        category: product.category,
                        expirationDate: product.expirationDate,
                        imageUrl: product.imageUrl
                    });
                }
            }
        }
        return expiringItems;
    }

    // Function to check for expiring items
    function getExpiringItems(range) {
        const expiringItems = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count'].includes(key)) {
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
        renderList(expiringItems);
    }

    // Function to render the list of expiring items with pagination
    function renderList(expiringItems) {
        listView.innerHTML = '';

        if (expiringItems.length === 0) {
            const element = document.createElement('div');
            element.className = 'sub-text';
            element.innerHTML = 'No expiring item';
            listView.appendChild(element);
            pagination.innerHTML = '';
            return;
        }

        expiringItems.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

        const totalPages = Math.ceil(expiringItems.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const itemsToDisplay = expiringItems.slice(startIndex, endIndex);

        for (const item of itemsToDisplay) {
            const element = document.createElement('div');
            element.className = 'block mt-4';
            const category = item.category.charAt(0).toUpperCase() + item.category.slice(1);
            const content = `
            <div>
                <span class="category-label text-xs font-bold">${category}</span>
                <div class="flex mt-2 items-center justify-between">
                    <div class="flex-1">
                        <p class="mt-2 text">${item.productName}</p>
                        <p class="mt-2 sub-text">Expires On: ${formatDateToAustralian(item.expirationDate)}</p>
                    </div>
                    <div class="ml-auto">
                        <img src="${item.imageUrl}" alt="${item.productName}" class="w-12 h-12 rounded-lg" />
                    </div>
                </div>
                <hr class="h-px my-4 bg-gray-200 border-0" />
            </div>
        `;
            element.innerHTML = content;
            listView.appendChild(element);
        }

        pagination.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'pageBtn px-2 py-1 border rounded-full my-1 mx-1';
            pageButton.innerText = i;

            if (i === currentPage) {
                pageButton.classList.add('selected');
            }

            pageButton.onclick = () => {
                currentPage = i;
                renderList(expiringItems);
            };
            pagination.appendChild(pageButton);
        }
    }

    // Function to hide the popup modal of expiring items
    window.hidePopup = function hidePopup() {
        expiringItemsPopup.classList.add('hidden');
    }
});