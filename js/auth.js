AWS.config.region = 'ap-southeast-2';

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

const poolData = {
    UserPoolId: 'ap-southeast-2_4ThAs9D9U',
    ClientId: '4th0mhua9kfs5emq5r87q5716p',
};

let isAuthenticated = false;

function updateAuthButton() {
    const authButton = document.getElementById("auth-button");

    if (authButton) {
        if (isAuthenticated) {
            authButton.innerText = "Sign Out";
            authButton.removeEventListener("click", function () {
                window.location.href = "../html/account.html"; // This will be handled in the account.js
            });
            authButton.addEventListener("click", logout);
        } else {
            authButton.innerText = "Sign In";
            authButton.removeEventListener("click", logout);
            authButton.addEventListener("click", function () {
                window.location.href = "../html/account.html";
            });
        }
    }
}

window.logout = function logout() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userID");
    console.log("Logged out successfully");

    isAuthenticated = false;
    updateAuthButton();
}

document.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("currentUser")) {
        isAuthenticated = true;
    }

    updateAuthButton();
    console.log(isAuthenticated);
});
