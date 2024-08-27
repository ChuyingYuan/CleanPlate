document.addEventListener("DOMContentLoaded", function () {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const barcodeImg = document.getElementById('barcodeImg');
    const fileInput = document.getElementById('fileInput');
    const uploadBarcodeBtn = document.getElementById('uploadBarcode');
    const scanBarcodeBtn = document.getElementById('scanBarcode');
    const uploadReceiptBtn = document.getElementById('uploadReceipt');
    const scanReceiptBtn = document.getElementById('scanReceipt');
    const options = document.getElementById('options');
    const popup = document.getElementById('popup');
    const popupBtn = document.getElementById("showPopup");
    const close = document.getElementsByClassName("close")[0];
    const resultElement = document.getElementById('result');
    const productElement = document.getElementById('product');
    const criticalFood = document.getElementById('criticalFood');
    const ingredientList = document.getElementById('ingredientList');
    const foodList = document.getElementById('foodList');
    const identifiedFood = document.getElementById('identifiedFood');

    const ingredients = [
        {
            name: 'Vegetable',
            category: 'Vegetables',
            icon: "https://img.icons8.com/?size=100&id=64432&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        },
        {
            name: 'Fruit',
            category: 'Fruit',
            icon: "https://img.icons8.com/?size=100&id=18957&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        },
        {
            name: 'Meat',
            category: 'Meat',
            icon: "https://img.icons8.com/?size=100&id=13306&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        },
        {
            name: 'Seafood',
            category: 'Seafood',
            icon: "https://img.icons8.com/?size=100&id=dcNXeTC0SjGX&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        },
        {
            name: 'Dairy',
            category: 'Dairy',
            icon: "https://img.icons8.com/?size=100&id=12874&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        },
        {
            name: 'Others',
            category: 'Others',
            icon: "https://img.icons8.com/?size=100&id=32236&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        }
    ];

    let barcodeDetector;
    let mediaStream = null;
    let selectedIngredient = null;

    resetAll();

    // Check BarcodeDetector support
    if (!("BarcodeDetector" in globalThis)) {
        resultElement.textContent = "Barcode Detector is not supported by this browser.";
        return;
    }

    barcodeDetector = new BarcodeDetector({
        formats: ["code_39", "codabar", "ean_13"],
    });

    // Popup window
    popupBtn.onclick = function () {
        popup.style.display = "flex";
        reset();
    }

    close.onclick = function () {
        popup.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == popup) {
            popup.style.display = "none";
        }
    }

    // Reset all UI elements
    function resetAll() {
        displayIdentifiedFoodItem();
        selectedIngredient = null;
        renderIngredientList();
        listAllStoredProducts();
        checkExpirations();
        reset();
    }

    // Reset elements in popup window
    function reset() {
        options.style.display = 'block';
        canvas.style.display = 'none';
        video.style.display = 'none';
        takePhotoBtn.style.display = 'none';
        fileInput.style.display = 'none';
        resultElement.innerHTML = '';
        productElement.innerHTML = '';
    }

    // Barcode
    uploadBarcodeBtn.addEventListener('click', function () {
        console.log("Upload Barcode");
        options.style.display = 'none';
        fileInput.style.display = 'block';
        fileInput.focus();
        resetSearchResults();
    });

    scanBarcodeBtn.addEventListener('click', function () {
        console.log("Scan Barcode");
        takePhotoBtn.style.display = 'block';
        startCamera();
        options.style.display = 'none';
        resetSearchResults();
    });

    // Receipt
    uploadReceiptBtn.addEventListener('click', function () {
        console.log("Upload Receipt");
        options.style.display = 'none';
        resetSearchResults();
    });

    scanReceiptBtn.addEventListener('click', function () {
        console.log("Scan Receipt");
        takePhotoBtn.style.display = 'block';
        startCamera();
        options.style.display = 'none';
        resetSearchResults();
    });

    // Take Photo
    takePhotoBtn.addEventListener('click', function () {
        if (video.srcObject) {
            captureAndStopCamera();
        } else {
            resultElement.textContent = "No video stream available.";
        }
        resetSearchResults();
    });

    // Upload Image
    barcodeImg.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            fileInput.style.display = 'none';
            const img = new Image();
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);
                detectBarcodes();
            };
            img.src = URL.createObjectURL(file);
        }
        barcodeImg.value = '';
        resetSearchResults();
    });

    // Request camera access
    async function startCamera() {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = mediaStream;
            video.style.display = 'block';
            video.play();
            video.onloadedmetadata = function () {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            };
        } catch (err) {
            console.error("Error accessing camera: ", err);
            resultElement.textContent = `Error accessing camera: ${err.message}`;
        }
    }

    // Function to capture the image and stop the camera
    function captureAndStopCamera() {
        if (video.srcObject) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            video.style.display = 'none';
            takePhotoBtn.style.display = 'none';
            stopCamera();
            detectBarcodes();
        }
    }

    // Function to stop the camera
    function stopCamera() {
        if (mediaStream) {
            const tracks = mediaStream.getTracks();
            tracks.forEach(track => track.stop());
            mediaStream = null;
        }
    }

    // Function to detect barcodes from the image
    function detectBarcodes() {
        if (barcodeDetector) {
            barcodeDetector
                .detect(canvas)
                .then((barcodes) => {
                    if (barcodes.length > 0) {
                        const barcode = barcodes[0].rawValue;
                        console.log("Detected Barcode: ", barcode);
                        resultElement.textContent = `Loading...`;
                        fetchProductInfo(barcode);
                    } else {
                        console.log("No barcodes detected.");
                        resultElement.textContent = "No barcodes detected.";
                    }
                })
                .catch((err) => {
                    console.error(err);
                    resultElement.textContent = `\nError: ${err.message}`;
                });
        } else {
            resultElement.textContent = "Barcode Detector is not supported.";
        }
    }

    // Function to fetch product information from Lambda function
    function fetchProductInfo(barcode) {
        fetch('https://rvtkdasc90.execute-api.ap-southeast-2.amazonaws.com/prod/barcode-expiration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ barcode: barcode })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const productData = JSON.parse(data.body);

                const productName = productData.product_name || "Not available";
                const brandName = productData.brand || "Not available";
                const expirationDate = productData.expiration_date || "As Soon As Possible";
                const imageUrl = productData.image_url || "Not available";

                // Update the UI with the fetched product information
                productElement.innerHTML = `Product Name: ${productName}<br>`;
                productElement.innerHTML += `Brand: ${brandName}<br>`;
                productElement.innerHTML += `Expiration Date: ${expirationDate}<br>`;

                // Generate a unique key for local storage
                const uniqueKey = generateUniqueKey();

                // Prepare the product info object for storage
                const productInfo = {
                    productName: productName,
                    brandName: brandName,
                    expirationDate: expirationDate,
                    imageUrl: imageUrl,
                };

                // Store the product info in local storage
                localStorage.setItem(uniqueKey, JSON.stringify(productInfo));
                console.log(`Stored in local storage: ${uniqueKey}`, productInfo);

                // Hide the popup and display the identified food item
                popup.style.display = "none";
                displayIdentifiedFoodItem(productInfo);

                // Update the list of all stored products
                listAllStoredProducts();
            })
            .catch(error => {
                console.error('Error fetching product information:', error);
                productElement.innerHTML = "Error fetching product information.";
            });
    }

    // Function to generate a unique key
    function generateUniqueKey() {
        const timestamp = Date.now().toString();
        const randomString = Math.random().toString(36).substring(2, 10);
        return `${timestamp}-${randomString}`;
    }

    // Function to display the identified food item
    function displayIdentifiedFoodItem(productInfo) {
        resetSearchResults();
        if (productInfo) {
            identifiedFood.innerHTML = `
            <div class="p-5 flex flex-col items-center">
                <h2 class="text text-sm text-center mb-4">
                  The following are identified based on the uploaded images
                </h2>
                <div class="identified-box flex items-center justify-center mb-4">
                  <img src="${productInfo.imageUrl}" alt="${productInfo.productName}" class="w-16 h-16 rounded-full" />
                </div>
                <p class="text-sm text-center text mb-4">
                  Keep ${productInfo.productName.toLowerCase()} in the refrigerator for 3 to 7 days.
                </p>
                <p class="shelf-label sub-text text-sm text-center">
                  Shelf life: ${productInfo.expirationDate}
                </p>
            </div>
        `;
        } else {
            identifiedFood.innerHTML = `
            <div class="p-5 flex flex-col items-center">
                <p class="text-sm text-center text">
                  No item is being identified.
                </p>
            </div>
        `;
        }
    }

    // Function to list all stored products in "My Food List"
    function listAllStoredProducts() {
        const products = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const productInfo = JSON.parse(localStorage.getItem(key));
            products.push({ key, ...productInfo });
        }

        products.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

        foodList.innerHTML = '';

        if (products.length > 0) {
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'food-list-card';

                const cardContent = `
                <div class="p-5">
                    <img src="${product.imageUrl}" alt="${product.productName}" class="my-4 w-full rounded-lg" />
                    <p class="mt-2 text">${product.productName}</p>
                    <p class="mt-2 sub-text">Shelf life: ${product.expirationDate}</p>
                    <button class="mt-2 text-xs text-white bg-red-500 px-2 py-1 rounded-full" onclick="deleteProduct('${product.key}')">Delete</button>
                </div>
            `;

                card.innerHTML = cardContent;
                foodList.appendChild(card);
            });
        } else {
            foodList.innerHTML = '<p class="text-center text-gray-500">No products stored.</p>';
        }
    }

    // Function to check expirations (expiring within 7 days)
    function checkExpirations() {
        const today = new Date();
        const alerts = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const product = JSON.parse(localStorage.getItem(key));

            if (product?.expirationDate) {
                const expirationDate = new Date(product.expirationDate);
                const daysUntilExpiry = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
                    alerts.push({
                        key: key,
                        productName: product.productName,
                        brandName: product.brandName,
                        expirationDate: product.expirationDate,
                        daysUntilExpiry: daysUntilExpiry
                    });
                }
            }
        }
        displayAlerts(alerts);
    }

    // Function to display food items that are about to expire in "Critical Food"
    function displayAlerts(alerts) {
        alerts.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

        criticalFood.innerHTML = '';

        if (alerts.length > 0) {
            alerts.forEach(alert => {
                const card = document.createElement('div');
                card.className = 'card';

                const cardContent = `
                <div class="p-5">
                    <span class="reminder text-xs font-bold">Be about to expire</span>
                    <img src="${alert.productName.toLowerCase().replace(/\s+/g, '-')}.jpg" alt="${alert.productName}" class="my-4 w-full" />
                    <p class="mt-2 text">${alert.productName}</p>
                    <p class="mt-2 sub-text">Shelf life: ${alert.expirationDate}</p>
                    <p class="mt-2 text-xs text-red-500 font-semibold">Expires in ${alert.daysUntilExpiry} day(s)</p>
                    <button class="mt-2 text-xs text-white bg-red-500 px-2 py-1 rounded-full" onclick="deleteProduct('${alert.key}')">Delete</button>
                </div>
            `;

                card.innerHTML = cardContent;
                criticalFood.appendChild(card);
            });
        } else {
            criticalFood.innerHTML = '<p class="text-center text-gray-500">No critical foods at the moment.</p>';
        }
    }

    // Function to delete a product from local storage
    window.deleteProduct = function (key) {
        localStorage.removeItem(key);
        resetSearchResults();
        resetAll();
    };

    // Ingredients Filtering
    function renderIngredientList() {
        ingredientList.innerHTML = '';

        ingredients.forEach(ingredient => {
            const ingredientCard = document.createElement('div');
            ingredientCard.className = 'ingredient-card';
            ingredientCard.dataset.category = ingredient.category;

            const cardContent = `
            <div class="p-5">
                <img src="${ingredient.icon}" alt="${ingredient.name}" class="ingredient-icon" />
                <p class="text-sm">${ingredient.name}</p>
                <button class="ingredient-btn ingredient">
                    <a href="#">
                        <img src="${ingredient.defaultSelectedIcon}" class="w-6 h-6" alt="Select" />
                    </a>
                </button>
            </div>
        `;

            ingredientCard.innerHTML = cardContent;
            ingredientList.appendChild(ingredientCard);
        });

        addIngredientSelectionListener();
        filterAndDisplayProducts(selectedIngredient);
    }

    function filterAndDisplayProducts(category) {
        const products = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const productInfo = JSON.parse(localStorage.getItem(key));
            if (productInfo.ingredientList === category || category === null) {
                products.push({ key, ...productInfo });
            }
        }

        products.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

        foodList.innerHTML = '';

        if (products.length > 0) {
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'food-list-card';

                const cardContent = `
            <div class="p-5">
                <img src="${product.imageUrl}" alt="${product.productName}" class="my-4 w-full rounded-lg" />
                <p class="mt-2 text">${product.productName}</p>
                <p class="mt-2 sub-text">Shelf life: ${product.expirationDate}</p>
                <button class="mt-2 text-xs text-white bg-red-500 px-2 py-1 rounded-full" onclick="deleteProduct('${product.key}')">Delete</button>
            </div>
        `;

                card.innerHTML = cardContent;
                foodList.appendChild(card);
            });
        } else {
            foodList.innerHTML = '<p class="text-center text-gray-500">No products found.</p>';
        }
    }

    function addIngredientSelectionListener() {
        const ingredientButtons = document.querySelectorAll('.ingredient-btn');

        ingredientButtons.forEach(button => {
            button.addEventListener('click', function (event) {
                event.preventDefault();

                const img = this.querySelector('img');
                const ingredientCard = this.closest('.ingredient-card');
                const iconSrc = img.src;
                const ingredient = ingredients.find(i => i.category === ingredientCard.dataset.category);

                document.querySelectorAll('.ingredient-card').forEach(card => {
                    card.classList.remove('selected');
                    card.querySelector('.ingredient-btn img').src = ingredient.defaultSelectedIcon;
                });

                if (iconSrc.includes('15816')) {
                    img.src = ingredient.selectedIcon;
                    ingredientCard.classList.add('selected');
                    selectedIngredient = ingredientCard.dataset.category;
                } else {
                    img.src = ingredient.defaultSelectedIcon;
                    ingredientCard.classList.remove('selected');
                    selectedIngredient = null;
                }

                filterAndDisplayProducts(selectedIngredient);
            });
        });
    }

    // Handling Search Function
    document.getElementById("search-form").addEventListener("submit", function (event) {
        event.preventDefault();
        performSearch();
    });

    function performSearch() {
        const searchQuery = document.getElementById("simple-search").value.toLowerCase().trim();
        const resultsContainer = document.getElementById("search-results");
        resultsContainer.innerHTML = "";

        if (!searchQuery) {
            const noResultsMessage = document.createElement("p");
            noResultsMessage.className = "text-center text-gray-500 mb-5";
            noResultsMessage.textContent = "Please enter a search term.";
            resultsContainer.appendChild(noResultsMessage);
            return;
        }

        let resultsFound = false;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const product = JSON.parse(localStorage.getItem(key));

            if (product && product.productName && product.productName.toLowerCase().includes(searchQuery)) {
                resultsFound = true;

                const card = document.createElement("div");
                card.className = "food-list-card";

                const cardContent = `
                <div class="p-5">
                    <img src="${product.imageUrl}" alt="${product.productName}" class="my-4 w-full rounded-lg" />
                    <p class="mt-2 text">${product.productName}</p>
                    <p class="mt-2 sub-text">Shelf life: ${product.expirationDate}</p>
                    <button class="mt-2 text-xs text-white bg-red-500 px-2 py-1 rounded-full" onclick="deleteProduct('${key}')">Delete</button>
                </div>
                `;

                card.innerHTML = cardContent;
                resultsContainer.appendChild(card);
            }
        }

        if (!resultsFound) {
            const noResultsMessage = document.createElement("p");
            noResultsMessage.className = "text-center text-gray-500 mb-5";
            noResultsMessage.textContent = "No results found";
            resultsContainer.appendChild(noResultsMessage);
        }
    }

    function resetSearchResults() {
        const resultsContainer = document.getElementById("search-results");
        resultsContainer.innerHTML = "";
    }
});