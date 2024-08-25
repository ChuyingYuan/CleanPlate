let modal = document.getElementById("popup");
let btn = document.getElementById("showPopup");
let span = document.getElementsByClassName("close")[0];

btn.onclick = function () {
    modal.style.display = "block";
}

span.onclick = function () {
    modal.style.display = "none";
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function uploadBarcode() {
    console.log("Upload Barcode");
}

function scanBarcode() {
    console.log("Scan Barcode");
}

function uploadReceipt() {
    console.log("Upload Receipt");
}

function scanReceipt() {
    console.log("Scan Receipt");
}
