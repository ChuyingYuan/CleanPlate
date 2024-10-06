document.addEventListener("DOMContentLoaded", function () {
    // Date and Time Constants
    const currentHour = new Date().getHours();
    const currentDate = new Date();

    // DOM Elements Constants (HTML Elements)
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const uploadBarcodeBtn = document.getElementById('uploadBarcodeBtn');
    const scanBarcodeBtn = document.getElementById('scanBarcodeBtn');
    const uploadReceiptBtn = document.getElementById('uploadReceiptBtn');
    const foodRecognitionBtn = document.getElementById('foodRecognitionBtn');
    const foodImgInput = document.getElementById('foodImgInput');
    const fileInput = document.getElementById('fileInput');
    const resultElement = document.getElementById('result');
    const criticalFood = document.getElementById('criticalFood');
    const ingredientList = document.getElementById('ingredientList');
    const foodList = document.getElementById('foodList');
    const identifiedFood = document.getElementById('identifiedFood');
    const searchResults = document.getElementById('searchResults');
    const searchHeading = document.getElementById("searchHeading");
    const greetingElement = document.getElementById("greeting");
    const hideFromSearch = document.getElementById("hideFromSearch");
    const cardViewBtn = document.getElementById('cardViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const selectAllCheckbox = document.getElementById('selectAll');

    // Ingredient Data List
    const ingredients = [
        {
            name: 'Vegetable',
            category: 'vegetables',
            icon: "https://img.icons8.com/?size=100&id=64432&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        },
        {
            name: 'Fruit',
            category: 'fruit',
            icon: "https://img.icons8.com/?size=100&id=hrmFKOhdqbOq&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        },
        {
            name: 'Meat',
            category: 'meat',
            icon: "https://img.icons8.com/?size=100&id=13306&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        },
        {
            name: 'Seafood',
            category: 'seafood',
            icon: "https://img.icons8.com/?size=100&id=dcNXeTC0SjGX&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        },
        {
            name: 'Dairy',
            category: 'dairy',
            icon: "https://img.icons8.com/?size=100&id=12874&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        },
        {
            name: 'Others',
            category: 'others',
            icon: "https://img.icons8.com/?size=100&id=32236&format=png&color=000000",
            defaultSelectedIcon: 'https://img.icons8.com/?size=100&id=15816&format=png&color=000000',
            selectedIcon: 'https://img.icons8.com/?size=100&id=15814&format=png&color=000000'
        }
    ];

    // Barcode and Image Processing Variables
    let barcodeDetector;
    let mediaStream = null;
    let tesseractWorker = null;

    // User Data Variables
    let score = 0;
    let totalWaste = 0;
    let co2Reduction = 0;
    let count = 0;
    let isAuthenticated = false;
    let selectedIngredient = null;
    let existingProducts = [];

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

    if (localStorage.getItem('userID')) {
        isAuthenticated = true;
    }

    // Retrieve all products from local storage
    function getAllProductsFromLocalStorage() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count', 'userID', 'currentUser'].includes(key)) {
                continue;
            }
            const productInfo = JSON.parse(localStorage.getItem(key));
            existingProducts.push({ 'productKey': key, ...productInfo });
        }
    }

    getAllProductsFromLocalStorage();
    console.log('Number of Existing Products: ', existingProducts.length);

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

    // Function to handle upload barcode (display file input)
    window.handleUploadBarcode = function handleUploadBarcode() {
        console.log("Upload Barcode");
        reset();
        uploadBarcodeBtn.classList.add('selected');
        fileInput.style.display = 'block';
        fileInput.focus();
        resetSearchResults();
    }

    // Function to handle scan barcode (display camera + take photo button)
    window.handleScanBarcode = function handleScanBarcode() {
        console.log("Scan Barcode");
        reset();
        scanBarcodeBtn.classList.add('selected');
        takePhotoBtn.style.display = 'block';
        startCamera();
        resetSearchResults();
        checkExpirations();
    }

    // Function to handle upload receipt
    window.handleUploadReceipt = function handleUploadReceipt() {
        console.log("Upload Receipt");
        reset();
        uploadReceiptBtn.classList.add('selected');
        receiptInput.style.display = 'block';
        receiptInput.focus();
        resetSearchResults();
    }

    // Function to handle taking photo 
    window.handleTakePhoto = function handleTakePhoto() {
        console.log("Take Photo");
        if (video.srcObject) {
            captureAndStopCamera();
        } else {
            resultElement.textContent = "No video stream available.";
        }
        resetSearchResults();
        reset();
        checkExpirations();
    }

    // Function to handle file upload for barcode image
    window.handleUploadBarcodeImg = function handleUploadBarcodeImg(event) {
        const file = event.target.files[0];
        if (file) {
            const fileInput = document.getElementById('fileInput');
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
        event.target.value = '';
        resetSearchResults();
        reset();
        checkExpirations();
    }

    // Function to handle file upload for receipt image
    window.handleUploadReceiptImg = async function handleUploadReceiptImg(event) {
        const file = event.target.files[0];
        if (file) {
            const fileInput = document.getElementById('fileInput');
            fileInput.style.display = 'none';

            const img = new Image();
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);
            };
            img.src = URL.createObjectURL(file);
            convertImgToText(img.src);
        }

        event.target.value = '';
        resetSearchResults();
        reset();
        checkExpirations();
    }

    // Function to handle food recognition (Produce Image Recognition Model)
    window.handleFoodRecognition = function handleFoodRecognition() {
        console.log("Food Recognition");
        reset();
        foodRecognitionBtn.classList.add('selected');
        foodImgInput.style.display = 'block';
        foodImgInput.focus();
        resetSearchResults();
    }

    // Function to handle file upload for food image
    window.handleUploadFoodImg = async function handleUploadFoodImg(event) {
        const file = event.target.files[0];
        if (file) {
            foodImgInput.style.display = 'none';

            // Display loading spinner
            resultElement.innerHTML = `
            <div class="text-center mt-4">
                <output>
                    <svg
                        aria-hidden="true"
                        class="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-green-500"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                            fill="currentColor"
                        />
                        <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                            fill="currentFill"
                        />
                    </svg>
                    <span class="sr-only">Loading...</span>
                </output>
            </div>`;

            // Upload image to the food recognition model API and fetch the recognized food item
            try {
                const base64Image = await getBase64(file);
                const response = await fetch('https://rvtkdasc90.execute-api.ap-southeast-2.amazonaws.com/prod/food-recognition', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ image_base64: base64Image }),
                });

                if (!response.ok) {
                    resultElement.textContent = 'No food is recognized from the image.';
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();
                // console.log('Response:', result);

                // If the response is successful, fetch the products
                if (result.body) {
                    const label = result.body.label;
                    console.log('Label:', label);
                    fetchProducts(label);
                } else {
                    console.error('Invalid response body');
                }
            } catch (error) {
                console.error('Error during upload or parsing response:', error);
            }
            event.target.value = '';
            resetSearchResults();
            reset();
            checkExpirations();
        }
    }

    // Reset all UI elements
    window.resetAll = function resetAll() {
        hideFromSearch.classList.remove('hidden');
        displayIdentifiedFoodItem();
        selectedIngredient = null;
        renderIngredientList();
        checkExpirations();
        reset();
        updateGreeting();
    }

    // Reset elements 
    function reset() {
        stopCamera();
        canvas.style.display = 'none';
        video.style.display = 'none';
        takePhotoBtn.style.display = 'none';
        fileInput.style.display = 'none';
        receiptInput.style.display = 'none';
        foodImgInput.style.display = 'none';
        resultElement.innerHTML = '';
        foodRecognitionBtn.classList.remove('selected');
        uploadBarcodeBtn.classList.remove('selected');
        scanBarcodeBtn.classList.remove('selected');
        uploadReceiptBtn.classList.remove('selected');
    }

    // Function to check the device type
    function isMobileDevice() {
        return /Mobi|Android|iPad|iPhone|Tablet/i.test(navigator.userAgent);
    }

    // Function to check if the device is an Android device
    function isAndroidDevice() {
        return /Android/i.test(navigator.userAgent);
    }

    // Function to check if the device is not an Apple device
    function isNotAppleDevice() {
        return !/iPhone|iPad|iPod|Mac/i.test(navigator.userAgent);
    }

    window.onload = function () {
        // Functions to create upload icon, scan icon and input field
        function createUploadIcon() {
            const uploadIcon = document.createElement("img");
            uploadIcon.src = "https://img.icons8.com/?size=100&id=84056&format=png&color=000000";
            uploadIcon.alt = "Upload";
            uploadIcon.className = "w-4 h-4 me-1 inline-block";
            return uploadIcon;
        }

        function createScanIcon() {
            const scanIcon = document.createElement("img");
            scanIcon.src = "https://img.icons8.com/?size=100&id=nFrSaSmj6cIG&format=png&color=000000";
            scanIcon.alt = "Scan";
            scanIcon.className = "w-4 h-4 me-1 inline-block";
            return scanIcon;
        }

        function createInputField() {
            const inputField = document.createElement("input");
            inputField.type = "file";
            inputField.accept = "image/*";
            inputField.capture = "environment";
            inputField.style.display = "none";
            return inputField;
        }

        // Render the buttons based on the device type
        if (isMobileDevice() && !isNotAppleDevice()) {
            // Apple Mobile Devices
            scanBarcodeBtn.style.display = 'none';

            uploadBarcodeBtn.innerHTML = '';
            uploadBarcodeBtn.appendChild(createUploadIcon());
            uploadBarcodeBtn.appendChild(document.createTextNode(" Upload/ Scan Barcode "));
            uploadBarcodeBtn.appendChild(createScanIcon());

            uploadReceiptBtn.innerHTML = '';
            uploadReceiptBtn.appendChild(createUploadIcon());
            uploadReceiptBtn.appendChild(document.createTextNode(" Upload/ Scan Receipt "));
            uploadReceiptBtn.appendChild(createScanIcon());

            foodRecognitionBtn.innerHTML = '';
            foodRecognitionBtn.appendChild(createUploadIcon());
            foodRecognitionBtn.appendChild(document.createTextNode(" Upload/ Take Produce Image "));
            foodRecognitionBtn.appendChild(createScanIcon());

            document.getElementById("uploadText").innerHTML = '<span class="font-semibold">Click to Upload/ Capture</span>';
            document.getElementById("uploadText1").innerHTML = '<span class="font-semibold">Click to Upload/ Capture</span>';
            document.getElementById("uploadText2").innerHTML = '<span class="font-semibold">Click to Upload/ Capture</span>';
        } else if (isMobileDevice() && isAndroidDevice()) {
            // Android Mobile Devices
            scanBarcodeBtn.style.display = 'none';

            uploadBarcodeBtn.innerHTML = '';
            uploadBarcodeBtn.appendChild(createUploadIcon());
            uploadBarcodeBtn.appendChild(document.createTextNode(" Upload/ Scan Barcode "));
            uploadBarcodeBtn.appendChild(createScanIcon());
            uploadBarcodeBtn.appendChild(createInputField());

            uploadReceiptBtn.innerHTML = '';
            uploadReceiptBtn.appendChild(createUploadIcon());
            uploadReceiptBtn.appendChild(document.createTextNode(" Upload/ Scan Receipt "));
            uploadReceiptBtn.appendChild(createScanIcon());
            uploadReceiptBtn.appendChild(createInputField());

            foodRecognitionBtn.innerHTML = '';
            foodRecognitionBtn.appendChild(createUploadIcon());
            foodRecognitionBtn.appendChild(document.createTextNode(" Upload/ Capture Produce "));
            foodRecognitionBtn.appendChild(createScanIcon());
            foodRecognitionBtn.appendChild(createInputField());

            document.getElementById("uploadText").innerHTML = '<span class="font-semibold">Click to Upload/ Capture</span>';
            document.getElementById("uploadText1").innerHTML = '<span class="font-semibold">Click to Upload/ Capture</span>';
            document.getElementById("uploadText2").innerHTML = '<span class="font-semibold">Click to Upload/ Capture</span>';
        } else {
            // Desktop Devices
            scanBarcodeBtn.style.display = 'inline-flex';
        }
        listAllStoredProducts();
        resetAll();
    };

    /* Functions for Receipt Expiration Date */
    // Convert image file to base64 string
    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    // Function to initialize the Tesseract worker
    async function initTesseract() {
        tesseractWorker = await Tesseract.createWorker('eng', 1, { workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.0.0/dist/worker.min.js' });
    }

    // Function to load an image
    async function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener('load', () => resolve(img));
            img.addEventListener('error', (err) => reject(err));
            img.src = url;
        });
    }

    // Function to convert image to text
    async function convertImgToText(imageLink) {
        let finalText = '';
        await initTesseract();
        let image = await loadImage(imageLink);
        const { data: { text } } = await tesseractWorker.recognize(image);
        // Split the text into lines
        const lines = text.split('\n');

        // Append each line to the finalText variable
        for (const line of lines) {
            finalText += line + '/'
        }
        let cleanedString = finalText.replace(/"/g, '');
        detectText(cleanedString)
        await tesseractWorker.terminate();
    }

    // Function to detect text from the image
    function detectText(finalText) {
        if (finalText.length > 0) {
            console.log("Detected finalText: ", finalText);
            // Display loading spinner
            resultElement.innerHTML = `
                        <div class="text-center mt-4">
                            <output>
                                <svg
                                    aria-hidden="true"
                                    class="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-green-500"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                        fill="currentFill"
                                    />
                                </svg>
                                <span class="sr-only">Loading...</span>
                            </output>
                        </div>`;
            fetchProducts(finalText);
        } else {
            console.log("No food item is recognized from the receipt.");
            resultElement.textContent = "No food item is recognized from the receipt.";
        }
    }

    // Function to fetch products from Receipt Expiration API
    function fetchProducts(finalText) {
        const API = 'https://rvtkdasc90.execute-api.ap-southeast-2.amazonaws.com/prod/receipt-expiration';
        const data = { "finalText": finalText };
        fetch(API, {
            method: 'POST',
            body: JSON.stringify(data),
        })
            .then((res) => res.json())
            .then((json) => {
                // console.log(json.body);
                const productData = JSON.parse(json.body);
                for (const product of productData) {
                    try {
                        // console.log(product);

                        // Extract product information
                        const productNameRaw = product.extractedName || "Not available";
                        const productName = productNameRaw.charAt(0).toUpperCase() + productNameRaw.slice(1);
                        const minShelfLife = product.DOP_Refrigerate_Min || "Not available";
                        const maxShelfLife = product.DOP_Refrigerate_Max || "Not available";
                        const metrics = product.DOP_Refrigerate_Metric || "Not available";
                        const method = product.type || "Not available";
                        const expirationDate = product.Expiration_Date || "As Soon As Possible";
                        const category = product.category || "others";
                        const recordDate = product.receipt_date || currentDate.toISOString().split('T')[0];

                        // Set image URL based on the category
                        const imgUrl = updateCategoryImage(category);

                        const uniqueKey = generateUniqueKey();

                        // Store the product information in local storage
                        const productInfo = {
                            productName: productName,
                            category: category,
                            minShelfLife: minShelfLife,
                            maxShelfLife: maxShelfLife,
                            metrics: metrics,
                            method: method,
                            expirationDate: expirationDate,
                            imageUrl: imgUrl,
                            recordDate: recordDate,
                        };

                        const foodExpirationDate = new Date(productInfo.expirationDate);
                        if (foodExpirationDate > currentDate) {
                            localStorage.setItem(uniqueKey, JSON.stringify(productInfo));
                            existingProducts.push({ 'productKey': uniqueKey, ...productInfo });
                            // console.log(`Stored in local storage: ${uniqueKey}`, productInfo);
                        }

                        displayIdentifiedFoodItem(productInfo);
                        listAllStoredProducts();
                    } catch (error) {
                        console.log('Error parsing product data:', error);
                        resultElement.innerHTML = "No food item is recognized from the receipt.";
                    }
                }
                if (isAuthenticated) {
                    storeData(localStorage.getItem('userID'), existingProducts, score, totalWaste.toFixed(2), co2Reduction.toFixed(2), count);
                }
            })
    }

    /* Functions for Barcode Expiration Date */
    // Check BarcodeDetector support
    if (!("BarcodeDetector" in globalThis)) {
        resultElement.textContent = "Barcode Detector is not supported by this browser.";
    }

    // Initialize the BarcodeDetector
    barcodeDetector = new BarcodeDetector({
        formats: ["code_39", "codabar", "ean_13"],
    });

    // Function to start the camera
    async function startCamera() {
        // Request camera permission
        try {
            // Check if the browser supports media devices
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Media devices are not supported by this browser.');
            }

            mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });

            if (!mediaStream) {
                throw new Error('Failed to get video stream.');
            }

            video.srcObject = mediaStream;
            video.style.display = 'block';
            video.play();

            video.onloadedmetadata = function () {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            };

            console.log("Camera permission requested and granted.");
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
                .then(barcodes => {
                    if (barcodes.length > 0) {
                        const barcode = barcodes[0].rawValue;
                        console.log("Detected Barcode: ", barcode);

                        // Display loading spinner
                        resultElement.innerHTML = `
                        <div class="text-center mt-4">
                            <output>
                                <svg
                                    aria-hidden="true"
                                    class="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-green-500"
                                    viewBox="0 0 100 101"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                        fill="currentFill"
                                    />
                                </svg>
                                <span class="sr-only">Loading...</span>
                            </output>
                        </div>`;

                        fetchProductInfo(barcode);
                    } else {
                        console.log("No food item is recognized from the barcode.");
                        resultElement.textContent = "No food item is recognized from the barcode.";
                    }
                })
                .catch(err => {
                    console.error(err);
                    resultElement.textContent = `Error: ${err.message}`;
                });
        } else {
            resultElement.textContent = "Barcode Detector is not supported.";
        }
    }

    // Function to fetch product information from Barcode Expiration API
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
                    return response.text().then(text => {
                        throw new Error(`Error: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                try {
                    const productData = JSON.parse(data.body);

                    // Extract product information
                    const productNameRaw = productData.product_name || "Not available";
                    const productName = productNameRaw.charAt(0).toUpperCase() + productNameRaw.slice(1);
                    const category = productData.category || "Not available";
                    const minShelfLife = productData.min_shelf_life || "Not available";
                    const maxShelfLife = productData.max_shelf_life || "Not available";
                    const metrics = productData.metrics || "Not available";
                    const method = productData.method || "Not available";
                    const expirationDate = productData.expiration_date || "As Soon As Possible";
                    const recordDate = currentDate.toISOString().split('T')[0];

                    // Set image URL based on the category
                    const imgUrl = updateCategoryImage(category);

                    const uniqueKey = generateUniqueKey();

                    // Store the product information in local storage
                    const productInfo = {
                        productName: productName,
                        category: category,
                        minShelfLife: minShelfLife,
                        maxShelfLife: maxShelfLife,
                        metrics: metrics,
                        method: method,
                        expirationDate: expirationDate,
                        imageUrl: imgUrl,
                        recordDate: recordDate,
                    };

                    const foodExpirationDate = new Date(productInfo.expirationDate);
                    if (foodExpirationDate > currentDate) {
                        localStorage.setItem(uniqueKey, JSON.stringify(productInfo));
                        existingProducts.push({ 'productKey': uniqueKey, ...productInfo });
                        if (isAuthenticated) {
                            storeData(localStorage.getItem('userID'), existingProducts, score, totalWaste.toFixed(2), co2Reduction.toFixed(2), count);
                        }
                        console.log(`Stored in local storage: ${uniqueKey}`, productInfo);
                    }
                    displayIdentifiedFoodItem(productInfo);
                    listAllStoredProducts();
                } catch (error) {
                    console.log('Error parsing product data:', error);
                    resultElement.innerHTML = "No food item is recognized from the barcode.";
                }
            })
            .catch(error => {
                console.log('Error fetching product information:', error);
                resultElement.innerHTML = "No food item is recognized from the barcode.";
            });
    }

    /* Functions helping operations */
    // Function to generate a unique key
    function generateUniqueKey() {
        const timestamp = Date.now().toString();
        const randomString = Math.random().toString(36).substring(2, 10);
        return `${timestamp}-${randomString}`;
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

    // Function to get the storage information
    function getStorageInfo(productInfo) {
        if (productInfo.expirationDate === "As Soon As Possible") {
            return handleAsSoonAsPossible(productInfo);
        } else if (productInfo.method === "Not available" &&
            productInfo.minShelfLife === "Not available" &&
            productInfo.maxShelfLife === "Not available" &&
            productInfo.metrics === "Not available") {
            return handleNotAvailable(productInfo);
        } else {
            return handleDefault(productInfo);
        }
    }

    // Function to handle "Consume As Soon As Possible" storage method
    function handleAsSoonAsPossible(productInfo) {
        let storageInfo = "Consume As Soon As Possible";
        const newExpirationDate = new Date(currentDate);
        newExpirationDate.setDate(currentDate.getDate() + 7);
        productInfo.expirationDate = newExpirationDate.toISOString().split('T')[0];
        const uniqueKey = generateUniqueKey();
        localStorage.setItem(uniqueKey, JSON.stringify(productInfo));
        existingProducts.push({ 'productKey': uniqueKey, ...productInfo });
        if (isAuthenticated) {
            storeData(localStorage.getItem('userID'), existingProducts, score, totalWaste.toFixed(2), co2Reduction.toFixed(2), count);
        }
        // console.log(`Stored in local storage: ${uniqueKey}`, productInfo);
        return storageInfo;
    }

    // Function to handle "Not available" storage method
    function handleNotAvailable(productInfo) {
        const expirationDate = new Date(productInfo.expirationDate);
        if (expirationDate < currentDate) {
            return "This item has expired.";
        } else {
            return "";
        }
    }

    // Function to handle storage method (Default)
    function handleDefault(productInfo) {
        let storageMethod = productInfo.method.toLowerCase();

        if (storageMethod === "refrigerate") {
            storageMethod = "refrigerator";
        } else if (storageMethod === "freeze") {
            storageMethod = "freezer";
        }

        let minShelfLife = Math.round(productInfo.minShelfLife);
        let maxShelfLife = Math.round(productInfo.maxShelfLife);
        const expirationDate = new Date(productInfo.expirationDate);
        if (expirationDate < currentDate) {
            return "This item has expired.";
        } else {
            if (minShelfLife === maxShelfLife) {
                return `Keep ${productInfo.productName.toLowerCase()} in the ${storageMethod} for ${minShelfLife} ${productInfo.metrics}.`;
            } else {
                return `Keep ${productInfo.productName.toLowerCase()} in the ${storageMethod} for ${minShelfLife} to ${maxShelfLife} ${productInfo.metrics}.`;
            }
        }
    }

    // Function to update category image
    function updateCategoryImage(category) {
        let imgUrl;
        switch (category) {
            case "vegetables":
                imgUrl = "https://img.icons8.com/?size=100&id=64432&format=png&color=000000";
                break;
            case "fruit":
                imgUrl = "https://img.icons8.com/?size=100&id=hrmFKOhdqbOq&format=png&color=000000";
                break;
            case "meat":
                imgUrl = "https://img.icons8.com/?size=100&id=13306&format=png&color=000000";
                break;
            case "seafood":
                imgUrl = "https://img.icons8.com/?size=100&id=dcNXeTC0SjGX&format=png&color=000000";
                break;
            case "dairy":
                imgUrl = "https://img.icons8.com/?size=100&id=12874&format=png&color=000000";
                break;
            default:
                imgUrl = "https://img.icons8.com/?size=100&id=32236&format=png&color=000000";
        }
        return imgUrl;
    }

    /* Functions to render items in the page */
    // Function to display the identified food item
    function displayIdentifiedFoodItem(productInfo) {
        checkExpirations();
        resetSearchResults();

        if (productInfo) {
            resultElement.innerHTML = ``;

            let storageInfo = getStorageInfo(productInfo);

            identifiedFood.innerHTML = `
            <div class="p-5 flex flex-col items-center">
                <h2 class="text text-sm text-center mb-4">
                  The following is identified based on the uploaded image.
                </h2>
                <div class="identified-box flex items-center justify-center mb-4">
                  <img src="${productInfo.imageUrl}" alt="${productInfo.productName}" class="w-16 h-16 rounded-full max-h-40" />
                </div>
                <p class="text-sm text-center text mb-4">
                  ${storageInfo}
                </p>
                <p class="shelf-label text-sm text-center">
                  Expires On: ${formatDateToAustralian(productInfo.expirationDate)}
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

    // Function to list all stored products in "My Food List" (card view)
    function listAllStoredProducts() {
        checkExpirations();
        const products = [];

        cardViewBtn.classList.add('selected');
        tableViewBtn.classList.remove('selected');
        bulkDeleteBtn.style.display = 'none';

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count', 'userID', 'currentUser'].includes(key)) {
                continue;
            }
            const productInfo = JSON.parse(localStorage.getItem(key));
            products.push({ key, ...productInfo });
        }

        products.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

        foodList.innerHTML = '';

        if (products.length > 0) {
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'food-list-card';
                const category = product.category.charAt(0).toUpperCase() + product.category.slice(1);

                const cardContent = `
                <div class="p-3">
                    <span class="category-label text-xs font-bold">${category}</span>
                    <div class="image-container">
                        <img src="${product.imageUrl}" alt="${product.productName}" class="my-4 rounded-lg" />
                    </div>       
                    <p class="mt-2 text">${product.productName}</p>
                    <p class="mt-2 sub-text">Expires On: ${formatDateToAustralian(product.expirationDate)}</p>
                    <button class="mt-2 text-xs text-white bg-green-500 px-2 py-1 rounded-full" onclick="modify('${product.key}')">Modify</button>
                    <button class="mt-2 text-xs text-white bg-red-500 px-2 py-1 rounded-full" onclick="deleteProduct('${product.key}')">Delete</button>
                </div>
            `;
                card.innerHTML = cardContent;
                foodList.appendChild(card);
            });
        } else {
            foodList.innerHTML = '<p class="text-center text-gray-500">No products stored.</p>';
        }
        foodList.style.display = 'flex';
        ingredientList.style.display = 'flex';
        dataTableView.style.display = 'none';
    }

    // Function to list all stored products in "My Food List" (card/table view)
    window.listAllStoredProductsByType = function listAllStoredProductsByType(viewType) {
        checkExpirations();
        const products = [];
        const productsPerPage = 10;
        let currentPage = 1;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count', 'userID', 'currentUser'].includes(key)) {
                continue;
            }
            const productInfo = JSON.parse(localStorage.getItem(key));
            products.push({ key, ...productInfo });
        }

        products.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

        const dataTableView = document.getElementById('dataTableView');
        const productTableBody = document.querySelector('#productTable tbody');

        foodList.innerHTML = '';
        dataTableView.style.display = viewType === 'table' ? 'block' : 'none';
        bulkDeleteBtn.style.display = viewType === 'table' ? 'inline' : 'none';
        ingredientList.style.display = viewType === 'card' ? 'flex' : 'none';;

        if (viewType === 'card') {
            foodList.style.display = 'flex';
            ingredientList.style.display = 'flex';
            dataTableView.style.display = 'none';
            cardViewBtn.classList.add('selected');
            tableViewBtn.classList.remove('selected');

            if (products.length > 0) {
                products.forEach(product => {
                    const card = document.createElement('div');
                    card.className = 'food-list-card';
                    const category = product.category.charAt(0).toUpperCase() + product.category.slice(1);

                    const cardContent = `
          <div class="p-3">
            <span class="category-label text-xs font-bold">${category}</span>
            <div class="image-container">
              <img src="${product.imageUrl}" alt="${product.productName}" class="my-4 rounded-lg" />
            </div>       
            <p class="mt-2 text">${product.productName}</p>
            <p class="mt-2 sub-text">Expires On: ${formatDateToAustralian(product.expirationDate)}</p>
            <button class="mt-2 text-xs text-white bg-green-500 px-2 py-1 rounded-full" onclick="modify('${product.key}')">Modify</button>
            <button class="mt-2 text-xs text-white bg-red-500 px-2 py-1 rounded-full" onclick="deleteProduct('${product.key}')">Delete</button>
          </div>
        `;
                    card.innerHTML = cardContent;
                    foodList.appendChild(card);
                });
            } else {
                foodList.innerHTML = '<p class="text-center text-gray-500">No products stored.</p>';
            }
        } else if (viewType === 'table') {
            foodList.style.display = 'none';
            productTableBody.innerHTML = '';
            cardViewBtn.classList.remove('selected');
            tableViewBtn.classList.add('selected');

            displayTable(products, productsPerPage, currentPage);
        }
    };

    // Function to display the table view of stored products
    function displayTable(products, productsPerPage, currentPage) {
        const productTableBody = document.querySelector('#productTable tbody');
        const pagination = document.getElementById('pagination');
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedProducts = products.slice(startIndex, endIndex);

        productTableBody.innerHTML = '';

        if (paginatedProducts.length > 0) {
            paginatedProducts.forEach(product => {
                const category = product.category.charAt(0).toUpperCase() + product.category.slice(1);
                const row = document.createElement('tr');
                const rowContent = `
        <td class="py-2"><input type="checkbox" class="product-checkbox w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2" data-key="${product.key}" /></td>
        <td><img src="${product.imageUrl}" alt="${product.productName}" class="w-8 h-8 object-cover rounded" /></td>
        <td>${category}</td>
        <td>${product.productName}</td>
        <td>${formatDateToAustralian(product.expirationDate)}</td>
        <td>${formatDateToAustralian(product.recordDate)}</td>
        <td><button class="text-xs text-white bg-green-500 px-2 py-1 rounded-full" onclick="modify('${product.key}')">Modify</button>
        <button class="text-xs text-white bg-red-500 px-2 py-1 rounded-full" onclick="deleteProduct('${product.key}')">Delete</button></td>
      `;
                row.innerHTML = rowContent;
                productTableBody.appendChild(row);
            });
        } else {
            productTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500">No products stored.</td></tr>';
        }

        const totalPages = Math.ceil(products.length / productsPerPage);
        pagination.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'pageBtn px-2 py-1 border rounded-full my-2 mx-1';
            pageButton.innerText = i;

            if (i === currentPage) {
                pageButton.classList.add('selected');
            }

            pageButton.onclick = () => {
                currentPage = i;
                displayTable(products, productsPerPage, currentPage);
            };
            pagination.appendChild(pageButton);
        }
    }

    // Function to sort the table by column
    window.sortTable = function sortTable(column) {
        const products = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count', 'userID', 'currentUser'].includes(key)) {
                continue;
            }
            const productInfo = JSON.parse(localStorage.getItem(key));
            products.push({ key, ...productInfo });
        }

        if (column === 'name') {
            products.sort((a, b) => a.productName.localeCompare(b.productName));
        } else if (column === 'date') {
            products.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
        }
        else if (column === 'record') {
            products.sort((a, b) => new Date(a.recordDate) - new Date(b.recordDate));
        }
        else {
            products.sort((a, b) => a.category.localeCompare(b.category));
        }

        displayTable(products, 10, 1);
    }

    // Ingredients Filtering (Category)
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
                <button class="ingredient-btn ingredient" onclick="handleIngredientClick('${ingredient.category}', this)">
                    <img src="${ingredient.defaultSelectedIcon}" class="w-6 h-6" alt="Select" />
                </button>
            </div>
        `;

            ingredientCard.innerHTML = cardContent;
            ingredientList.appendChild(ingredientCard);
        });

        filterAndDisplayProducts(selectedIngredient);
    }

    // Function to handle ingredient click
    window.handleIngredientClick = function handleIngredientClick(category, buttonElement) {
        const img = buttonElement.querySelector('img');
        const ingredientCard = buttonElement.closest('.ingredient-card');
        const iconSrc = img.src;
        const ingredient = ingredients.find(i => i.category === category);

        document.querySelectorAll('.ingredient-card').forEach(card => {
            card.classList.remove('selected');
            card.querySelector('.ingredient-btn img').src = ingredients.find(i => i.category === card.dataset.category).defaultSelectedIcon;
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

        console.log("Selected Ingredient after click:", selectedIngredient);

        filterAndDisplayProducts(selectedIngredient);
    }

    function filterAndDisplayProducts(category) {
        const products = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count', 'userID', 'currentUser'].includes(key)) {
                continue;
            }
            const productInfo = JSON.parse(localStorage.getItem(key));
            if (productInfo.category === category || category === null) {
                products.push({ key, ...productInfo });
            }
        }

        // Sorting and displaying products
        products.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

        foodList.innerHTML = '';

        if (products.length > 0) {
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'food-list-card';
                const category = product.category.charAt(0).toUpperCase() + product.category.slice(1);

                const cardContent = `
                <div class="p-3">
                    <span class="category-label text-xs font-bold">${category}</span>
                    <div class="image-container">
                        <img src="${product.imageUrl}" alt="${product.productName}" class="my-4 rounded-lg" />
                    </div>                    
                    <p class="mt-2 text">${product.productName}</p>
                    <p class="mt-2 sub-text">Expires On: ${formatDateToAustralian(product.expirationDate)}</p>
                    <button class="mt-2 text-xs text-white bg-green-500 px-2 py-1 rounded-full" onclick="modify('${product.key}')">Modify</button>
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

    /* Functions to delete items */
    // Function to delete a product from local storage
    window.deleteProduct = function deleteProduct(key) {
        const modal = document.getElementById('popup-modal');
        modal.classList.remove('hidden');
        modal.setAttribute('data-product-key', key);
    }

    // Function to confirm delete
    window.confirmDelete = function confirmDelete() {
        const modal = document.getElementById('popup-modal');
        const key = modal.getAttribute('data-product-key');
        console.log("Delete Product:", key);

        localStorage.removeItem(key);

        existingProducts = existingProducts.filter(product => product.productKey !== key);
        if (isAuthenticated) {
            storeData(localStorage.getItem('userID'), existingProducts, score, totalWaste.toFixed(2), co2Reduction.toFixed(2), count);
        }

        modal.classList.add('hidden');

        listAllStoredProducts();
        resetSearchResults();
        resetAll();
    }

    // Function to delete multiple products
    window.bulkDelete = function bulkDelete() {
        const selectedCheckboxes = document.querySelectorAll('.product-checkbox:checked');

        if (selectedCheckboxes.length === 0) {
            alert('Please select at least one product to delete.');
            return;
        }

        const modal = document.getElementById('popup-modal-bulk');
        modal.classList.remove('hidden');
        modal.setAttribute('data-product-keys', JSON.stringify(Array.from(selectedCheckboxes).map(checkbox => checkbox.getAttribute('data-key'))));
    }

    // Function to toggle select all checkboxes
    window.toggleSelectAll = function toggleSelectAll() {
        const productCheckboxes = document.querySelectorAll('.product-checkbox');
        productCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }

    // Function to confirm bulk delete
    window.confirmBulkDelete = function confirmBulkDelete() {
        const modal = document.getElementById('popup-modal-bulk');
        const keys = JSON.parse(modal.getAttribute('data-product-keys'));

        keys.forEach(key => {
            console.log("Delete Product:", key);
            localStorage.removeItem(key);

            existingProducts = existingProducts.filter(product => product.productKey !== key);
        });

        if (isAuthenticated) {
            storeData(localStorage.getItem('userID'), existingProducts, score, totalWaste.toFixed(2), co2Reduction.toFixed(2), count);
        }
        modal.classList.add('hidden');

        listAllStoredProductsByType('table');

        const currentPage = 1;
        const productsPerPage = 10;
        const products = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count', 'userID', 'currentUser'].includes(key)) {
                continue;
            }
            const productInfo = JSON.parse(localStorage.getItem(key));
            products.push({ key, ...productInfo });
        }

        displayTable(products, productsPerPage, currentPage);
        resetSearchResults();
        resetAll();
        selectAllCheckbox.checked = false;
    };

    // Function to cancel delete
    window.cancelDelete = function cancelDelete() {
        const modal = document.getElementById('popup-modal');
        const modalBulk = document.getElementById('popup-modal-bulk');
        modal.classList.add('hidden');
        modalBulk.classList.add('hidden');
    }

    /* Functions for expiring items */
    // Function to check expirations (expiring within 7 days)
    function checkExpirations() {
        const today = new Date();
        const alerts = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count', 'userID', 'currentUser'].includes(key)) {
                continue;
            }
            const product = JSON.parse(localStorage.getItem(key));

            if (product?.expirationDate) {
                const expirationDate = new Date(product.expirationDate);
                const daysUntilExpiry = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
                    alerts.push({
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
        displayAlerts(alerts);
        showNotification(alerts.length);
    }

    // Function to display food items that are about to expire in "Critical Food"
    function displayAlerts(alerts) {
        alerts.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

        criticalFood.innerHTML = '';

        if (alerts.length > 0) {
            const limitedAlerts = alerts.slice(0, 3);

            limitedAlerts.forEach(alert => {
                const card = document.createElement('div');
                card.className = 'card';

                const cardContent = `
            <div class="p-3">
                <span class="reminder text-xs font-bold">Expiring Soon !</span>
                <div class="image-container">
                    <img src="${alert.imageUrl}" alt="${alert.productName}" class="my-4 rounded-lg" />
                </div>
                <p class="mt-2 text">${alert.productName}</p>
                <p class="mt-2 sub-text">Expires On: ${formatDateToAustralian(alert.expirationDate)}</p>
                <p class="mt-2 text-xs text-red-500 font-semibold">Expires in ${alert.daysUntilExpiry} day(s)</p>
                <button class="mt-2 text-xs text-white bg-red-500 px-2 py-1 rounded-full" onclick="deleteProduct('${alert.key}')">Delete</button>
            </div>
            `;

                card.innerHTML = cardContent;
                criticalFood.appendChild(card);
            });
        } else {
            criticalFood.innerHTML = '<p class="text-center text-gray-500">No expiring foods at the moment.</p>';
        }
    }

    // Function to show notification
    function showNotification(expiringCount) {
        const toast = document.getElementById('notification');

        if (expiringCount > 0) {
            const message = `You have ${expiringCount} item(s) about to expire within 7 days!`;
            toast.querySelector('.text-sm.font-normal').textContent = message;
            toast.classList.remove('hidden');
        } else {
            toast.classList.add('hidden');
        }
    }

    /* Functions for Searching for item(s) */
    // Function to perform search
    window.performSearch = function performSearch(event) {
        event.preventDefault();
        const hideFromSearch = document.getElementById("hideFromSearch");
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

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (['co2Reduction', 'score', 'totalWaste', 'count', 'userID', 'currentUser'].includes(key)) {
                continue;
            }
            const product = JSON.parse(localStorage.getItem(key));

            // Check if the product name includes the search query
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

        hideFromSearch.classList.add("hidden");

        if (!resultsFound) {
            searchHeading.style.display = "none";
            const noResultsMessage = document.createElement("p");
            noResultsMessage.className = "text-center text-gray-500 mb-5";
            noResultsMessage.textContent = "No results found";
            searchResults.appendChild(noResultsMessage);
        }
    };

    // Function to reset search results
    function resetSearchResults() {
        searchHeading.style.display = "none";
        searchResults.innerHTML = "";
    }

    /* Functions to modify an item */
    // Functions to modify a product from local storage
    window.modify = function modify(key) {
        const modal = document.getElementById('modify-popup-modal');
        modal.classList.remove('hidden');
        modal.setAttribute('data-product-key', key);

        loadProductInfo(key);
    }

    // Function to confirm modify
    window.confirmModify = function confirmModify() {
        console.log("Confirm Modify");
        const modal = document.getElementById('modify-popup-modal');
        const key = modal.getAttribute('data-product-key');

        const existingInfo = JSON.parse(localStorage.getItem(key)) || {};
        const category = document.getElementById('productCategory').value;
        const imgUrl = updateCategoryImage(category);

        const updatedInfo = {
            ...existingInfo,
            productName: document.getElementById('productName').value,
            category: category,
            expirationDate: document.getElementById('productExpirationDate').value,
            imageUrl: imgUrl,
        };

        localStorage.setItem(key, JSON.stringify(updatedInfo));

        existingProducts = existingProducts.map(product => {
            if (product.productKey === key) {
                return { 'productKey': key, ...updatedInfo };
            }
            return product;
        });

        if (isAuthenticated) {
            storeData(localStorage.getItem('userID'), existingProducts, score, totalWaste.toFixed(2), co2Reduction.toFixed(2), count);
        }

        closeModal();
        listAllStoredProducts();
        resetSearchResults();
        resetAll();
    }

    // Function to cancel modify
    window.closeModal = function closeModal() {
        const modal = document.getElementById('modify-popup-modal');
        modal.classList.add('hidden');
    }

    // Function to load product information based on the key 
    function loadProductInfo(key) {
        const productInfo = JSON.parse(localStorage.getItem(key)) || {};
        document.getElementById('productName').value = productInfo.productName || '';
        document.getElementById('productCategory').value = productInfo.category || '';
        document.getElementById('productExpirationDate').value = productInfo.expirationDate || '';
    }
});