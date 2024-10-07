window.onload = function () {
    updateGreeting();
    initMap();
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

// Display recipes and their ingredients
const groceries =
    JSON.parse(localStorage.getItem("groceries")) || [];
const ingredientsListContainer = document.getElementById(
    "ingredients-list-container"
);

if (!groceries.length) {
    const noDataMessage = document.createElement("p");
    noDataMessage.className = "text-lg text-center sub-text font-bold";
    noDataMessage.textContent = "No recipe is saved.";
    ingredientsListContainer.appendChild(noDataMessage);
}

groceries.forEach((grocery) => {
    const recipeContainer = document.createElement("div");
    recipeContainer.className = "mb-4 px-5";

    const recipeName = document.createElement("h3");
    recipeName.className = "text-lg font-bold";
    recipeName.textContent = grocery.name;

    const ingredientList = document.createElement("ul");
    ingredientList.className = "list-disc mt-2 px-8";

    grocery.ingredients.forEach((ingredient) => {
        const li = document.createElement("li");
        li.textContent = ingredient;
        ingredientList.appendChild(li);
    });

    const divider = document.createElement("hr");
    divider.className = "my-4 border-gray-300";

    recipeContainer.appendChild(recipeName);
    recipeContainer.appendChild(ingredientList);
    recipeContainer.appendChild(divider);
    ingredientsListContainer.appendChild(recipeContainer);
});

let map;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    map = new Map(document.getElementById("map"), {
        zoom: 13,
        center: { lat: -37.8136, lng: 144.9631 },
        mapTypeControl: false,
        mapId: "DEMO_MAP_ID",
    });

    // Fetch data from the API
    fetch("https://rvtkdasc90.execute-api.ap-southeast-2.amazonaws.com/prod/grocery-store")
        .then((response) => {
            // Check if the response is OK (status in the range 200-299)
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(async (responseData) => {
            const data = JSON.parse(responseData.body);

            // Check if the data is an array
            if (!Array.isArray(data)) {
                console.error("Data is not an array:", data);
                return; // Exit if data is not an array
            }

            // Loop through each store entry
            data.forEach((store) => {
                // Check if Longitude and Latitude are defined
                let lat = store.Latitude;
                let lng = store.Longitude;

                if (lat === null || lng === null) {
                    console.error("Missing coordinates for store:", store);
                    return; // Skip this store
                }

                lat = parseFloat(lat);
                lng = parseFloat(lng);

                // Ensure the coordinates are valid numbers
                if (isNaN(lat) || isNaN(lng)) {
                    console.error("Invalid coordinates for store:", store);
                    return; // Skip this store
                }

                let type = store["Industry_ANZSIC4_description"];

                // Default to "Others" if type is missing or unknown
                if (!type) {
                    type = "Others";
                }

                let markerColor;

                // Determine marker color based on store type
                switch (type) {
                    case "Supermarket and Grocery Stores":
                        markerColor = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
                        break;
                    case "Fruit and Vegetable Retailing":
                        markerColor = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
                        break;
                    case "Fresh Meat, Fish and Poultry Retailing":
                        markerColor = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
                        break;
                    case "Others": // Assign color for 'Others'
                        markerColor = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
                        break;
                    default:
                        markerColor = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
                        break;
                }

                if (markerColor) {
                    const marker = new google.maps.Marker({
                        position: { lat: lat, lng: lng },
                        map: map,
                        icon: markerColor,
                        title: store.Building_Name || "Unknown Store",
                    });

                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div>
                                <h4 class="font-bold">${store.Trading_name}</h4>
                                <p>${store.Business_address}</p>
                                <p>${store.CLUE_small_area}</p>
                                <p>${store.Industry_ANZSIC4_description}</p>
                            </div>
                        `,
                    });

                    marker.addListener("click", () => {
                        infoWindow.open(map, marker);
                    });
                }
            });
        })
        .catch((error) => {
            console.error("Error fetching data from API:", error);
        });
}

initMap();
