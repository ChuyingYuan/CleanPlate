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
let markers = [];
let currentFilter = null;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    map = new Map(document.getElementById("map"), {
        zoom: 13,
        center: { lat: -37.8136, lng: 144.9631 },
        mapTypeControl: false,
        mapId: "DEMO_MAP_ID",
    });

    // Fetch data from the API
    fetch("https://rvtkdasc90.execute-api.ap-southeast-2.amazonaws.com/prod/grocery-store")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(async (responseData) => {
            const data = JSON.parse(responseData.body);

            if (!Array.isArray(data)) {
                console.error("Data is not an array:", data);
                return;
            }

            data.forEach((store) => {
                let lat = store.Latitude;
                let lng = store.Longitude;

                if (lat === null || lng === null) {
                    console.error("Missing coordinates for store:", store);
                    return;
                }

                lat = parseFloat(lat);
                lng = parseFloat(lng);

                if (isNaN(lat) || isNaN(lng)) {
                    console.error("Invalid coordinates for store:", store);
                    return;
                }

                let type = store["Industry_ANZSIC4_description"] || "Others";

                let backgroundColor, glyphText, borderColor;

                switch (type) {
                    case "Fresh Meat, Fish and Poultry Retailing":
                    case "Meat, Poultry and Smallgoods Wholesaling":
                        type = "Fresh Meat, Fish and Poultry Retailing";
                        backgroundColor = "rgba(3, 227, 76, 0.5)";
                        glyphText = "M";
                        borderColor = "#03E34C";
                        break;

                    case "Supermarket and Grocery Stores":
                        type = "Supermarket and Grocery Stores";
                        backgroundColor = "rgba(253, 118, 103, 0.5)";
                        glyphText = "S";
                        borderColor = "#FD7667";
                        break;

                    case "Fruit and Vegetable Retailing":
                    case "Fruit and Vegetable Wholesaling":
                        type = "Fruit and Vegetable Retailing";
                        backgroundColor = "rgba(105, 145, 248, 0.5)";
                        glyphText = "F";
                        borderColor = "#6991F8";
                        break;

                    default:
                        return;
                }

                // Create the PinElement with custom background, border, and glyph color
                const pinBackground = new PinElement({
                    background: backgroundColor,
                    glyph: glyphText,
                    glyphColor: "white",
                    borderColor: borderColor,
                });

                // Create the AdvancedMarkerElement with the custom PinElement
                const marker = new AdvancedMarkerElement({
                    position: { lat: lat, lng: lng },
                    map: map,
                    content: pinBackground.element,
                    title: store.Trading_name || "Unknown Store",
                });

                markers.push({ marker, type });

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

                // Add click event to show info window
                marker.addListener("click", () => {
                    infoWindow.open(map, marker);
                });
            });
        })
        .catch((error) => {
            console.error("Error fetching data from API:", error);
        });

    // Setup toggle filter function as a global function
    window.toggleFilter = function toggleFilter(selectedType) {
        const legendButtons = document.querySelectorAll("button");

        // Check if the selected type is already the current filter
        if (currentFilter === selectedType) {
            currentFilter = null;
            legendButtons.forEach(button => button.classList.remove("selected"));
        } else {
            currentFilter = selectedType;
            legendButtons.forEach(button => button.classList.remove("selected"));
            event.currentTarget.classList.add("selected");
        }

        // Show/hide markers based on the selected type
        markers.forEach(({ marker, type }) => {
            if (currentFilter) {
                marker.setMap(type === currentFilter ? map : null);
            } else {
                marker.setMap(map);
            }
        });
    }
}

initMap();