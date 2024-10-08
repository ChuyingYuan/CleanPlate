AWS.config.region = 'ap-southeast-2';

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

const poolData = {
    UserPoolId: 'ap-southeast-2_4ThAs9D9U',
    ClientId: '4th0mhua9kfs5emq5r87q5716p',
};

let isAuthenticated = false;

// Function to update the Sign In / Sign Out button
function updateAuthButton() {
    const authButton = document.getElementById("auth-button");

    if (authButton) {
        if (isAuthenticated) {
            authButton.innerText = "Sign Out";
            authButton.removeEventListener("click", function () {
                window.location.href = "../html/account.html";
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

// Function to sign out the user
window.logout = function logout() {
    localStorage.clear();
    console.log("Logged out successfully");

    isAuthenticated = false;
    updateAuthButton();
    window.location.href = "../html/index.html";
}

// Check if the user is signed in and update the Sign In / Sign Out button
document.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("currentUser")) {
        isAuthenticated = true;
    }

    updateAuthButton();
    console.log("Signed In: " + isAuthenticated);
});
