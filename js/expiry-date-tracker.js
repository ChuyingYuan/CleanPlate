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
    const foodList = document.getElementById('foodList');
    const identifiedFood = document.getElementById('identifiedFood');

    let barcodeDetector;
    let mediaStream = null;

    // Check BarcodeDetector support
    if (!("BarcodeDetector" in globalThis)) {
        resultElement.textContent = "Barcode Detector is not supported by this browser.";
        return;
    }

    barcodeDetector = new BarcodeDetector({
        formats: ["code_39", "codabar", "ean_13"],
    });

    popupBtn.onclick = function () {
        popup.style.display = "flex";
        reset()
    }

    close.onclick = function () {
        popup.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == popup) {
            popup.style.display = "none";
        }
    }

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
    });

    scanBarcodeBtn.addEventListener('click', function () {
        console.log("Scan Barcode");
        takePhotoBtn.style.display = 'block';
        startCamera();
        options.style.display = 'none';
    });

    // Receipt
    uploadReceiptBtn.addEventListener('click', function () {
        console.log("Upload Receipt");
        options.style.display = 'none';
    });

    scanReceiptBtn.addEventListener('click', function () {
        console.log("Scan Receipt");
        takePhotoBtn.style.display = 'block';
        startCamera();
        options.style.display = 'none';
    });

    // Take Photo
    takePhotoBtn.addEventListener('click', function () {
        if (video.srcObject) {
            captureAndStopCamera();
        } else {
            resultElement.textContent = "No video stream available.";
        }
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

    function captureAndStopCamera() {
        if (video.srcObject) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            video.style.display = 'none';
            takePhotoBtn.style.display = 'none';
            stopCamera();
            detectBarcodes();
        }
    }

    function stopCamera() {
        if (mediaStream) {
            const tracks = mediaStream.getTracks();
            tracks.forEach(track => track.stop());
            mediaStream = null;
        }
    }

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

    function fetchProductInfo(barcode) {
        // TODO: Replace this with the lambda function api endpoint
        const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.product) {
                    const productName = data.product.product_name || "Not available";
                    const brandName = data.product.brands || "Not available";
                    const expirationDate = data.product.expiration_date || "Not available";

                    productElement.innerHTML = `Product Name: ${productName}<br>`;
                    productElement.innerHTML += `Brand: ${brandName}<br>`;
                    productElement.innerHTML += `Expiration Date: ${expirationDate}<br>`;

                    const uniqueKey = generateUniqueKey();

                    const productInfo = {
                        productName: productName,
                        brandName: brandName,
                        expirationDate: expirationDate,
                    };

                    localStorage.setItem(uniqueKey, JSON.stringify(productInfo));
                    console.log(`Stored in local storage: ${uniqueKey}`, productInfo);
                    popup.style.display = "none";
                    displayIdentifiedFoodItem(productInfo);
                    listAllStoredProducts();
                } else {
                    productElement.innerHTML = "No product information found.";
                }
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

    function displayIdentifiedFoodItem(productInfo) {
        if (productInfo) {
            identifiedFood.innerHTML = `
            <div class="p-5 flex flex-col items-center">
                <h2 class="text text-sm text-center mb-4">
                  The following are identified based on the uploaded images
                </h2>
                <div class="identified-box flex items-center justify-center mb-4">
                  <img src="${productInfo.productName.toLowerCase()}.jpg" alt="${productInfo.productName}" class="w-16 h-16" />
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

    function listAllStoredProducts() {
        const products = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const productInfo = JSON.parse(localStorage.getItem(key));
            products.push({ key, ...productInfo });
        }

        foodList.innerHTML = '';

        if (products.length > 0) {
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'card flex-shrink-0 w-52';

                const cardContent = `
                <div class="p-5">
                    <img src="${product.productName.toLowerCase().replace(/\s+/g, '-')}.jpg" alt="${product.productName}" class="my-4 w-full" />
                    <p class="text">${product.productName}</p>
                    <p class="sub-text">Shelf life: ${product.expirationDate}</p>
                    <button class="mt-2 text-xs text-white bg-red-500 px-2 py-1 rounded" onclick="deleteProduct('${product.key}')">Delete</button>
                </div>
                `;

                card.innerHTML = cardContent;
                foodList.appendChild(card);
            });
        } else {
            foodList.innerHTML = '<p class="text-center text-gray-500">No products stored.</p>';
        }
    }

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
                        barcode: product.barcode,
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

    function displayAlerts(alerts) {
        criticalFood.innerHTML = '';

        if (alerts.length > 0) {
            alerts.forEach(alert => {
                const card = document.createElement('div');
                card.className = 'card flex-shrink-0 w-48';

                const cardContent = `
                <div class="min-w-[200px] max-w-sm p-6">
                    <span class="reminder text-xs font-bold">Be about to expire</span>
                    <img src="${alert.productName.toLowerCase().replace(/\s+/g, '-')}.jpg" alt="${alert.productName}" class="my-4 w-full" />
                    <p class="text">${alert.productName}</p>
                    <p class="sub-text">Shelf life: ${alert.expirationDate}</p>
                    <p class="text-xs text-red-500 font-semibold">Expires in ${alert.daysUntilExpiry} day(s)</p>
                    <button class="mt-2 text-xs text-white bg-red-500 px-2 py-1 rounded" onclick="deleteProduct('${alert.barcode}')">Delete</button>
                </div>
            `;

                card.innerHTML = cardContent;
                criticalFood.appendChild(card);
            });
        } else {
            criticalFood.innerHTML = '<p class="text-center text-gray-500">No critical foods at the moment.</p>';
        }
    }

    window.deleteProduct = function (key) {
        localStorage.removeItem(key);
        listAllStoredProducts();
        checkExpirations();
        displayIdentifiedFoodItem();
    };

    listAllStoredProducts();
    checkExpirations();
    displayIdentifiedFoodItem();
});
