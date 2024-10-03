window.onload = function () {
    updateGreeting();
    initMap();
    populateList();
    const currentYear = new Date().getFullYear();
    document.getElementById("current-year").textContent = currentYear;
};

function updateGreeting() {
    const currentHour = new Date().getHours();
    const greetingElement = document.getElementById("greeting");
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

async function fetchDataFromAPI() {
    const apiUrl = 'https://rvtkdasc90.execute-api.ap-southeast-2.amazonaws.com/prod/food-donation';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        const locations = JSON.parse(data.body);
        return locations;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function populateList() {
    const locations = await fetchDataFromAPI();
    const listElement = document.getElementById("donate-list");

    if (!locations || !Array.isArray(locations)) {
        console.error("No valid locations found");
        return;
    }

    locations.forEach((location) => {
        const listItem = document.createElement("li");
        listItem.classList.add("list-item");
        listItem.innerHTML = `
        ${location.Organization}<br>
        ${location["Building Name"]}<br>
        ${location.Address}<br>
        Phone: ${location.Phone_number ? location.Phone_number : "N/A"}<br>
        <button
            onclick="window.open('${location.Link}', '_blank')"
            class="w-full lg:w-auto px-3 py-2 rounded-full border border-gray-300 text-sm font-medium button mt-2 mb-2"
        >
            More Info
        </button>`;
        listElement.appendChild(listItem);
    });
}

let map;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const locations = await fetchDataFromAPI();

    map = new Map(document.getElementById("map"), {
        zoom: 12,
        center: { lat: -37.8136, lng: 144.9631 },
        mapTypeControl: false,
        mapId: "DEMO_MAP_ID",
    });

    const geocoder = new google.maps.Geocoder();

    if (!locations || !Array.isArray(locations)) {
        console.error("No valid locations found");
        return;
    }

    locations.forEach((location) => {
        geocodeAddress(geocoder, map, location);
    });
}

function geocodeAddress(geocoder, map, location) {
    geocoder.geocode({ address: location.Address }, (results, status) => {
        if (status === "OK") {
            const position = results[0].geometry.location;

            const marker = new google.maps.marker.AdvancedMarkerElement({
                position: position,
                map: map,
                title: location.Organization,
            });

            const infoWindowContent = `
                <div class="mb-4">
                    <strong>${location.Organization}</strong><br>
                    ${location["Building Name"]}<br>
                    ${location.Address}<br>
                </div>
            `;

            const infoWindow = new google.maps.InfoWindow({
                content: infoWindowContent,
            });

            marker.addListener("click", () => {
                infoWindow.open(map, marker);
            });
        } else {
            console.log(
                "Geocode was not successful for the following reason: " + status
            );
        }
    });
}