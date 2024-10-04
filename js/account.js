const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

const poolData = {
    UserPoolId: 'ap-southeast-2_4ThAs9D9U',
    ClientId: '4th0mhua9kfs5emq5r87q5716p',
};

// Function to register the user
window.register = function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    signUp(username, password, username);
}

// Function to sign up the user using the provided credentials in AWS Cognito
function signUp(username, password, email) {
    const params = {
        ClientId: poolData.ClientId,
        Username: username,
        Password: password,
        UserAttributes: [
            {
                Name: 'email',
                Value: email,
            },
            {
                Name: 'preferred_username',
                Value: username,
            },
        ],
    };

    cognitoIdentityServiceProvider.signUp(params, function (err, data) {
        if (err) {
            console.log('Error signing up:', err);

            let errorMessage = '';

            if (err.message.includes("password failed to satisfy constraint")) {
                errorMessage = "Password must include at least one uppercase letter, one lowercase letter and one number.";
            } else if (err.message.includes("username failed to satisfy constraint")) {
                errorMessage = "Email must contain at least one character and no special spaces.";
            } else if (err.message.includes("Member must have length greater than or equal to 1")) {
                errorMessage = "Email cannot be empty.";
            } else {
                errorMessage = "Invalid email or password. Please try again.";
            }

            document.getElementById("message").textContent = errorMessage;
        } else {
            console.log('Sign-up success:', data);
            document.getElementById("auth-section").style.display = "none";
            document.getElementById("message").textContent =
                "Sign-up successful. Please check your email for a confirmation code.";
            document.getElementById("confirmation").style.display = "block";
        }
    });
}

// Function to confirm the user's sign-up
window.confirmUser = function confirmUser() {
    const username = document.getElementById("confirmationUsername").value;
    const confirmationCode = document.getElementById("confirmationCode").value;

    confirmSignUp(username, confirmationCode);
}

// Function to confirm the sign-up of the user using the provided confirmation code in AWS Cognito
function confirmSignUp(username, confirmationCode) {
    const params = {
        ClientId: poolData.ClientId,
        Username: username,
        ConfirmationCode: confirmationCode,
    };

    cognitoIdentityServiceProvider.confirmSignUp(params, function (err, data) {
        if (err) {
            console.log('Error confirming sign-up:', err);
        } else {
            console.log('Confirmation successful:', data);
            document.getElementById("auth-section").style.display = "block";
            document.getElementById("confirmation").style.display = "none";
            document.getElementById("message").textContent =
                "Confirmation successful. Please sign in.";
        }
    });
}

// Function to call the sign-in API
window.login = function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    signIn(username, password);
}

// Function to sign in the user using the provided credentials in AWS Cognito
function signIn(username, password) {
    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: poolData.ClientId,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
        },
    };

    cognitoIdentityServiceProvider.initiateAuth(params, function (err, data) {
        if (err) {
            console.log('Error signing in:', err);
            document.getElementById("message").textContent = "Invalid email or password. Please try again.";
        } else {
            localStorage.setItem('currentUser', username);
            console.log('Sign-in success:', data);
            const accessToken = data.AuthenticationResult.AccessToken;
            fetchUserData(accessToken);
            // Redirect to the previous page after successful sign-in
            window.history.back();
        }
    });
}

// Function to fetch the user data using the provided access token from AWS Cognito
function fetchUserData(accessToken) {
    const params = {
        AccessToken: accessToken,
    };

    cognitoIdentityServiceProvider.getUser(params, function (err, data) {
        if (err) {
            console.log('Error fetching user data:', err);
        } else {
            const username = data.Username;
            localStorage.setItem('userID', username);
            console.log('UserID:', username);
            updateAuthSection();
        }
    });
}

// Function to initiate the password recovery process
window.recoverPassword = function recoverPassword() {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("forgotPassword").style.display = "none";

    const username = document.getElementById("forgot-username").value;
    const params = {
        ClientId: poolData.ClientId,
        Username: username,
    };

    cognitoIdentityServiceProvider.forgotPassword(params, function (err, data) {
        if (err) {
            console.log('Error initiating password recovery:', err);
            document.getElementById("message").textContent = `${err.message}`;
        } else {
            console.log('Password recovery initiated:', data);
            document.getElementById("message").textContent = "Recovery code sent to your email.";
            document.getElementById("confirmPassword").style.display = "block";
        }
    });
};

// Function to confirm the new password
window.confirmNewPassword = function confirmNewPassword() {
    const username = document.getElementById("forgot-username").value;
    const confirmationCode = document.getElementById("forgetPasswordConfirmationCode").value;
    const newPassword = document.getElementById("newPassword").value;

    const params = {
        ClientId: poolData.ClientId,
        Username: username,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
    };

    cognitoIdentityServiceProvider.confirmForgotPassword(params, function (err, data) {
        if (err) {
            console.log('Error confirming new password:', err);
            document.getElementById("message").textContent = `${err.message}`;
        } else {
            console.log('Password confirmed successfully:', data);
            document.getElementById("message").textContent = "Your password has been successfully reset.";
            document.getElementById("auth-section").style.display = "block";
            document.getElementById("forgotPassword").style.display = "none";
            document.getElementById("confirmPassword").style.display = "none";
            updateAuthSection();
        }
    });
}

// Function to update authentication UI
function updateAuthSection() {
    const authSection = document.getElementById("auth-section");
    const message = document.getElementById("message");
    const currentUser = localStorage.getItem("currentUser");

    message.textContent = "";

    if (currentUser) {
        authSection.innerHTML = `
              <div class="text-center flex flex-col justify-center space-y-4 mt-4">
                <p>Hello, ${currentUser}!</p>
                <button onclick="logout()" class="w-full lg:w-auto px-4 py-2 rounded-full border border-gray-300 text-sm font-medium button">Sign Out</button>
              </div>
            `;
    } else {
        authSection.innerHTML = `
            <div class="text-center">
              <p class="my-4">Sign In / Sign Up<p>
              <input type="text" id="username" class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 inline-flex w-1/2 p-2.5 mt-4" placeholder="Email" />
              <input type="password" id="password" class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 inline-flex w-1/2 p-2.5 mt-4" placeholder="Password" />
              <div class="flex flex-col space-y-4 mt-6 justify-center">
                <button onclick="login()" class="w-full lg:w-auto px-4 py-2 rounded-full border border-gray-300 text-sm font-medium button">Sign In</button>
                <button onclick="register()"  class="w-full lg:w-auto px-4 py-2 rounded-full border border-gray-300 text-sm font-medium button">Sign Up</button>
                <button onclick="showForgotPassword()" class="w-full lg:w-auto px-4 py-2 rounded-full border border-gray-300 text-sm font-medium button">Forgot Password</button>
              </div>
            </div>
            `;
    }
}

updateAuthSection();
