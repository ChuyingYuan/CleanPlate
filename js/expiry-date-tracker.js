document.addEventListener("DOMContentLoaded", function () {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const barcodeImg = document.getElementById('barcodeImg');
    const fileInput = document.getElementById('fileInput');
    const alertElement = document.getElementById('alerts');
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
        options.style.display = 'block';
        canvas.style.display = 'none';
        video.style.display = 'none';
        takePhotoBtn.style.display = 'none';
        fileInput.style.display = 'none';
        resultElement.innerHTML = '';
        productElement.innerHTML = '';
    }

    close.onclick = function () {
        popup.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == popup) {
            popup.style.display = "none";
        }
    }

    // Barcode
    uploadBarcodeBtn.addEventListener('click', function () {
        console.log("Upload Barcode");
        options.style.display = 'none';
        fileInput.style.display = 'block';
    })

    scanBarcodeBtn.addEventListener('click', function () {
        console.log("Scan Barcode");
        takePhotoBtn.style.display = 'block';
        startCamera();
        options.style.display = 'none';
    })

    // Receipt
    uploadReceiptBtn.addEventListener('click', function () {
        console.log("Upload Receipt");
        options.style.display = 'none';
    })

    scanReceiptBtn.addEventListener('click', function () {
        console.log("Scan Receipt");
        takePhotoBtn.style.display = 'block';
        startCamera();
        options.style.display = 'none';
    })

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
                        resultElement.textContent = `\nDetected Barcode: ${barcode}`;
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

                    // Store the product information in local storage
                    const productInfo = {
                        productName: productName,
                        brandName: brandName,
                        expirationDate: expirationDate,
                    };

                    localStorage.setItem(barcode, JSON.stringify(productInfo));
                    console.log(`Stored in local storage: ${barcode}`, productInfo);
                    displayIdentifiedFoodItem(productInfo);
                    // listAllStoredProducts();
                } else {
                    productElement.innerHTML = "No product information found.";
                }
            })
            .catch(error => {
                console.error('Error fetching product information:', error);
                productElement.innerHTML = "Error fetching product information.";
            });
    }

    // Function to display the identified food item
    function displayIdentifiedFoodItem(productInfo) {
        if (productInfo) {
            document.querySelector(".identified-box img").src = `${productInfo.productName.toLowerCase()}.jpg`;
            document.querySelector(".identified-box img").alt = productInfo.productName;

            document.querySelector(".food-item h2").textContent = `The following are identified based on the uploaded images`;
            document.querySelector(".food-item p.text").textContent = `Keep ${productInfo.productName.toLowerCase()} in the refrigerator for 3 to 7 days.`;
            document.querySelector(".shelf-label").textContent = `Shelf life: ${productInfo.expirationDate}`;
        } else {
            console.log("No food item is being identified.");
        }
    }

    // TODO: Change to listing products in List of Food Items
    function listAllStoredProducts() {
        const products = [];
        for (let i = 0; i < localStorage.length; i++) {
            const barcode = localStorage.key(i);
            const productInfo = JSON.parse(localStorage.getItem(barcode));
            products.push({ barcode, ...productInfo });
        }

        const productElement = document.getElementById('product');
        if (products.length > 0) {
            let productsListHTML = '<h3>Stored Products:</h3>';
            products.forEach(product => {
                productsListHTML += `Barcode: ${product.barcode}<br>`;
                productsListHTML += `Product Name: ${product.productName}<br>`;
                productsListHTML += `Brand: ${product.brandName}<br>`;
                productsListHTML += `Expiration Date: ${product.expirationDate}<br>`;
                productsListHTML += `<button onclick="deleteProduct('${product.barcode}')">Delete</button><br><br>`;
            });
            productElement.innerHTML = productsListHTML;
        } else {
            productElement.innerHTML = "No products stored in local storage.";
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

                if (daysUntilExpiry <= 5 && daysUntilExpiry >= 0) { // Alert for items expiring within 5 days
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

    // TODO: change to displaying Critical Foods 
    function displayAlerts(alerts) {
        if (alerts.length > 0) {
            let alertsHTML = '<h3>Expiration Alerts:</h3>';
            alerts.forEach(alert => {
                alertsHTML += `Barcode: ${alert.barcode}<br>`;
                alertsHTML += `Product Name: ${alert.productName}<br>`;
                alertsHTML += `Brand: ${alert.brandName}<br>`;
                alertsHTML += `Expiration Date: ${alert.expirationDate}<br>`;
                alertsHTML += `Days Until Expiry: ${alert.daysUntilExpiry}<br>`;
                alertsHTML += `<button onclick="deleteProduct('${alert.barcode}')">Delete</button><br><br>`;
            });
            alertElement.innerHTML = alertsHTML;
        } else {
            alertElement.innerHTML = "No items are approaching their expiry date.";
        }
    }

    window.deleteProduct = function deleteProduct(barcode) {
        localStorage.removeItem(barcode);
        // checkExpirations();
        // listAllStoredProducts();
    }

    // listAllStoredProducts();
    // checkExpirations();
});
