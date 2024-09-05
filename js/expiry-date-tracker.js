document.addEventListener("DOMContentLoaded", function () {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const uploadBarcodeBtn = document.getElementById('uploadBarcodeBtn');
    const scanBarcodeBtn = document.getElementById('scanBarcodeBtn');
    const uploadReceiptBtn = document.getElementById('uploadReceiptBtn');
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
    const currentHour = new Date().getHours();
    const currentDate = new Date();

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
            icon: "https://img.icons8.com/?size=100&id=18957&format=png&color=000000",
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

    let barcodeDetector;
    let mediaStream = null;
    let selectedIngredient = null;
    let tesseractWorker = null;

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


    async function initTesseract() {
        tesseractWorker = await Tesseract.createWorker('eng', 1, { workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.0.0/dist/worker.min.js' });
    }


    async function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener('load', () => resolve(img));
            img.addEventListener('error', (err) => reject(err));
            img.src = url;
        });
    }

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

    function detectText(finalText) {
        if (finalText.length > 0) {
            console.log("Detected finalText: ", finalText);
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
            console.log("No Food Item is recognized from the barcode.");
            resultElement.textContent = "No Food Item is recognized from the barcode.";
        }
    }

    function fetchProducts(finalText) {
        const API = 'https://rvtkdasc90.execute-api.ap-southeast-2.amazonaws.com/prod/receipt-expiration';
        const data = { "finalText": finalText };
        fetch(API, {
            method: 'POST',
            body: JSON.stringify(data),
        })
            .then((res) => res.json())
            .then((json) => {
                console.log(json.body);
                const productData = JSON.parse(json.body);
                for (const product of productData) {
                    try {
                        console.log(product);
                        const productName = product.Name || "Not available";
                        const minShelfLife = product.DOP_Refrigerate_Min || "Not available";
                        const maxShelfLife = product.DOP_Refrigerate_Max || "Not available";
                        const metrics = product.DOP_Refrigerate_Metric || "Not available";
                        const method = product.type || "Not available";
                        const expirationDate = product.Expiration_Date || "As Soon As Possible";
                        const category = product.category || "others";

                        let imgUrl;
                        switch (category) {
                            case "vegetables":
                                imgUrl = "https://img.icons8.com/?size=100&id=64432&format=png&color=000000";
                                break;
                            case "fruit":
                                imgUrl = "https://img.icons8.com/?size=100&id=18957&format=png&color=000000";
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

                        const uniqueKey = generateUniqueKey();

                        const productInfo = {
                            productName: productName,
                            category: category,
                            minShelfLife: minShelfLife,
                            maxShelfLife: maxShelfLife,
                            metrics: metrics,
                            method: method,
                            expirationDate: expirationDate,
                            imageUrl: imgUrl,
                        };

                        const foodExpirationDate = new Date(productInfo.expirationDate);
                        if (foodExpirationDate > currentDate) {
                            localStorage.setItem(uniqueKey, JSON.stringify(productInfo));
                            console.log(`Stored in local storage: ${uniqueKey}`, productInfo);
                        }

                        displayIdentifiedFoodItem(productInfo);
                        listAllStoredProducts();
                    } catch (error) {
                        console.log('Error parsing product data:', error);
                        resultElement.innerHTML = "Unable to identify food item.";
                    }
                }
            })
    }

    // Check BarcodeDetector support
    if (!("BarcodeDetector" in globalThis)) {
        resultElement.textContent = "Barcode Detector is not supported by this browser.";
    }

    barcodeDetector = new BarcodeDetector({
        formats: ["code_39", "codabar", "ean_13"],
    });

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
        resultElement.innerHTML = '';
        uploadBarcodeBtn.classList.remove('selected');
        scanBarcodeBtn.classList.remove('selected');
        uploadReceiptBtn.classList.remove('selected');
    }

    function isMobileDevice() {
        return /Mobi|Android|iPad|iPhone|Tablet/i.test(navigator.userAgent);
    }

    window.onload = function () {
        const uploadIcon = document.createElement("img");
        uploadIcon.src = "https://img.icons8.com/?size=100&id=84056&format=png&color=000000";
        uploadIcon.alt = "Upload";
        uploadIcon.className = "w-4 h-4 me-1 inline-block";
        const scanIcon = document.createElement("img");
        scanIcon.src = "https://img.icons8.com/?size=100&id=nFrSaSmj6cIG&format=png&color=000000";
        scanIcon.alt = "Scan";
        scanIcon.className = "w-4 h-4 me-1 inline-block";

        if (isMobileDevice()) {
            uploadBarcodeBtn.innerHTML = '';
            uploadBarcodeBtn.appendChild(uploadIcon);
            uploadBarcodeBtn.appendChild(document.createTextNode(" Upload/ Scan Barcode "));
            uploadBarcodeBtn.appendChild(scanIcon)
            document.getElementById("uploadText").innerHTML =
                '<span class="font-semibold">Click to Scan / Upload</span>';
            scanBarcodeBtn.style.display = 'none';
        } else {
            scanBarcodeBtn.style.display = 'inline-flex';
            uploadBarcodeBtn.innerHTML = '';
            uploadBarcodeBtn.appendChild(uploadIcon);
            uploadBarcodeBtn.appendChild(document.createTextNode(" Upload Barcode "));
            scanBarcodeBtn.innerHTML = '';
            scanBarcodeBtn.appendChild(scanIcon)
            scanBarcodeBtn.appendChild(document.createTextNode(" Scan Barcode "));
        }
        listAllStoredProducts();
        resetAll();
    };

    // Request camera access
    async function startCamera() {
        try {
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
                        console.log("No Food Item is recognized from the barcode.");
                        resultElement.textContent = "No Food Item is recognized from the barcode.";
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
                    return response.text().then(text => {
                        throw new Error(`Error: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                try {
                    const productData = JSON.parse(data.body);

                    const productName = productData.product_name || "Not available";
                    const category = productData.category || "Not available";
                    const minShelfLife = productData.min_shelf_life || "Not available";
                    const maxShelfLife = productData.max_shelf_life || "Not available";
                    const metrics = productData.metrics || "Not available";
                    const method = productData.method || "Not available";
                    const expirationDate = productData.expiration_date || "As Soon As Possible";

                    let imgUrl;
                    switch (category) {
                        case "vegetables":
                            imgUrl = "https://img.icons8.com/?size=100&id=64432&format=png&color=000000";
                            break;
                        case "fruit":
                            imgUrl = "https://img.icons8.com/?size=100&id=18957&format=png&color=000000";
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


                    const uniqueKey = generateUniqueKey();

                    const productInfo = {
                        productName: productName,
                        category: category,
                        minShelfLife: minShelfLife,
                        maxShelfLife: maxShelfLife,
                        metrics: metrics,
                        method: method,
                        expirationDate: expirationDate,
                        imageUrl: imgUrl,
                    };

                    const foodExpirationDate = new Date(productInfo.expirationDate);
                    if (foodExpirationDate > currentDate) {
                        localStorage.setItem(uniqueKey, JSON.stringify(productInfo));
                        console.log(`Stored in local storage: ${uniqueKey}`, productInfo);
                    }

                    displayIdentifiedFoodItem(productInfo);
                    listAllStoredProducts();
                } catch (error) {
                    console.log('Error parsing product data:', error);
                    resultElement.innerHTML = "Unable to identify food item.";
                }
            })
            .catch(error => {
                console.log('Error fetching product information:', error);
                resultElement.innerHTML = "Unable to identify food item.";
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
                  Expires On: ${productInfo.expirationDate}
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

    function handleAsSoonAsPossible(productInfo) {
        let storageInfo = "Consume As Soon As Possible";
        const newExpirationDate = new Date(currentDate);
        newExpirationDate.setDate(currentDate.getDate() + 7);
        productInfo.expirationDate = newExpirationDate.toISOString().split('T')[0];
        const uniqueKey = generateUniqueKey();
        localStorage.setItem(uniqueKey, JSON.stringify(productInfo));
        console.log(`Stored in local storage: ${uniqueKey}`, productInfo);
        return storageInfo;
    }

    function handleNotAvailable(productInfo) {
        const expirationDate = new Date(productInfo.expirationDate);
        if (expirationDate < currentDate) {
            return "This item has expired.";
        } else {
            return "";
        }
    }

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
            return `Keep ${productInfo.productName.toLowerCase()} in the ${storageMethod} for ${minShelfLife} to ${maxShelfLife} ${productInfo.metrics}.`;
        }
    }

    // Function to list all stored products in "My Food List"
    function listAllStoredProducts() {
        checkExpirations();
        const products = [];

        cardViewBtn.classList.add('selected');
        tableViewBtn.classList.remove('selected');
        bulkDeleteBtn.style.display = 'none';

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
                const category = product.category.charAt(0).toUpperCase() + product.category.slice(1);

                const cardContent = `
                <div class="p-3">
                    <span class="category-label text-xs font-bold">${category}</span>
                    <div class="image-container">
                        <img src="${product.imageUrl}" alt="${product.productName}" class="my-4 rounded-lg" />
                    </div>       
                    <p class="mt-2 text">${product.productName}</p>
                    <p class="mt-2 sub-text">Expires On: ${product.expirationDate}</p>
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

    window.listAllStoredProductsByType = function listAllStoredProductsByType(viewType) {
        checkExpirations();
        const products = [];
        const productsPerPage = 10;
        let currentPage = 1;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
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
            <p class="mt-2 sub-text">Expires On: ${product.expirationDate}</p>
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

    function displayTable(products, productsPerPage, currentPage) {
        const productTableBody = document.querySelector('#productTable tbody');
        const pagination = document.getElementById('pagination');
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedProducts = products.slice(startIndex, endIndex);

        productTableBody.innerHTML = '';

        if (paginatedProducts.length > 0) {
            paginatedProducts.forEach(product => {
                const row = document.createElement('tr');
                const rowContent = `
        <td><input type="checkbox" class="product-checkbox w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2" data-key="${product.key}" /></td>
        <td><img src="${product.imageUrl}" alt="${product.productName}" class="w-12 h-12 object-cover rounded" /></td>
        <td>${product.category}</td>
        <td>${product.productName}</td>
        <td>${product.expirationDate}</td>
        <td><button class="text-xs text-white bg-red-500 px-2 py-1 rounded-full" onclick="deleteProduct('${product.key}')">Delete</button></td>
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

    window.sortTable = function sortTable(column) {
        const products = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const productInfo = JSON.parse(localStorage.getItem(key));
            products.push({ key, ...productInfo });
        }

        if (column === 'name') {
            products.sort((a, b) => a.productName.localeCompare(b.productName));
        } else if (column === 'date') {
            products.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
        } else {
            products.sort((a, b) => a.category.localeCompare(b.category));
        }

        displayTable(products, 10, 1);
    }

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

    window.toggleSelectAll = function toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('selectAll');
        const productCheckboxes = document.querySelectorAll('.product-checkbox');

        productCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    }

    window.confirmBulkDelete = function confirmBulkDelete() {
        const modal = document.getElementById('popup-modal-bulk');
        const keys = JSON.parse(modal.getAttribute('data-product-keys'));

        keys.forEach(key => {
            console.log("Delete Product:", key);
            localStorage.removeItem(key);
        });
        modal.classList.add('hidden');

        listAllStoredProductsByType('table');

        const currentPage = 1;
        const productsPerPage = 10;
        const products = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const productInfo = JSON.parse(localStorage.getItem(key));
            products.push({ key, ...productInfo });
        }

        displayTable(products, productsPerPage, currentPage);
        resetSearchResults();
        resetAll();
    };

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
            alerts.forEach(alert => {
                const card = document.createElement('div');
                card.className = 'card';

                const cardContent = `
                <div class="p-3">
                    <span class="reminder text-xs font-bold">Expiring Soon !</span>
                    <div class="image-container">
                        <img src="${alert.imageUrl}" alt="${alert.productName}" class="my-4 rounded-lg" />
                    </div>
                    <p class="mt-2 text">${alert.productName}</p>
                    <p class="mt-2 sub-text">Expires On: ${alert.expirationDate}</p>
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

    // Function to delete a product from local storage
    window.deleteProduct = function deleteProduct(key) {
        const modal = document.getElementById('popup-modal');
        modal.classList.remove('hidden');
        modal.setAttribute('data-product-key', key);
    }

    window.confirmDelete = function confirmDelete() {
        const modal = document.getElementById('popup-modal');
        const key = modal.getAttribute('data-product-key');
        console.log("Delete Product:", key);

        localStorage.removeItem(key);
        modal.classList.add('hidden');

        listAllStoredProducts();
        resetSearchResults();
        resetAll();
    }

    window.cancelDelete = function cancelDelete() {
        const modal = document.getElementById('popup-modal');
        const modalBulk = document.getElementById('popup-modal-bulk');
        modal.classList.add('hidden');
        modalBulk.classList.add('hidden');
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
            const productInfo = JSON.parse(localStorage.getItem(key));
            console.log("Product Info:", productInfo);  // Debug statement
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
                    <p class="mt-2 sub-text">Expires On: ${product.expirationDate}</p>
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

    function resetSearchResults() {
        searchHeading.style.display = "none";
        searchResults.innerHTML = "";
    }
});