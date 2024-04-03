function submitForgotPassword(){
    document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const config = fetchConfig();
        let email = document.getElementById('userEmail').value;
        let response = await fetch(`${config.CONNECTION_STRING}/login/send-reset-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        let data = await response.json();
        console.log(data);
        if (data.success) {
            // Remove existing alert if present
            const existingAlert = document.querySelector('.verification-code-alert');
            if (existingAlert) {
                existingAlert.remove();
            }

            // Create a new input field for the verification code
            const verificationInput = document.createElement('input');
            verificationInput.setAttribute('type', 'text');
            verificationInput.setAttribute('id', 'verificationCode');
            verificationInput.setAttribute('placeholder', 'Enter Verification Code');
            verificationInput.classList.add('block', 'w-full', 'outline-none', 'bg-transparent', 'text-sm', 'text-gray-100', 'font-medium', 'py-4', 'px-3', 'mb-8', 'border', 'border-gray-400', 'hover:border-white', 'focus-within:border-green-500', 'rounded-lg');
            
            // Optionally, create a submit button for the code
            const submitCodeButton = document.createElement('button');
            submitCodeButton.textContent = 'Submit Code';
            submitCodeButton.classList.add('block', 'w-full', 'py-4', 'mb-4', 'leading-6', 'text-white', 'font-semibold', 'bg-blue-500', 'hover:bg-blue-600', 'rounded-lg', 'transition', 'duration-200');
            submitCodeButton.addEventListener('click', async function(e) {
                e.preventDefault();
                // Get the entered verification code
                let verificationCode = document.getElementById('verificationCode').value;
                
                // Send the verification code to the server
                let verifyResponse = await fetch(`${config.CONNECTION_STRING}/login/verify-reset-code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, verificationCode }),
                    credentials: 'include'
                });
                let verifyData = await verifyResponse.json();
                
                // Check if the verification was successful
                if (verifyData.success) {
                  document.cookie = "authenticated=true; path=/";  // Set the authenticated cookie
                  window.location = 'changepassword.html?type=link';
                } else {
                    // Inform the user if there was an error
                    alert(verifyData.message);
                }
            });
            // Append the new input field and button to the form or a specific element
            const form = document.getElementById('forgotPasswordForm');
            form.appendChild(verificationInput);
            form.appendChild(submitCodeButton);
            document.getElementById('sendLinkButton').style.display = 'none';

            alert('Check your email for the reset link.');
        } else {
            alert(data.message);
        }
    });
}

function loginButton(){
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const config = fetchConfig();

        let username = document.getElementById('email').value;
        let password = document.getElementById('password').value;
        let response = await fetch(`${config.CONNECTION_STRING}/login/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include' 
            });
        let data = await response.json();
        console.log(data.success);
        if (data.success) {
            document.cookie = "authenticated=true; path=/";  // Set the authenticated cookie
            if (data.userRole === "Admin") {
              window.location = '/adminpages/adminindex.html';
            } else {
              window.location = 'index.html';
            }
        } else {
            alert(data.message);
        }
    });
}

function submitChangePassword(){
    document.getElementById('changePassword').addEventListener('submit', async (e) => {
        e.preventDefault();
        const config = fetchConfig();
        const params = new URLSearchParams(window.location.search);
        const changeType = params.get('type');
        let newPassword = document.getElementById('newPassword').value;
        let confirmNewPassword = document.getElementById('confirmNewPassword').value;
        let response = await fetch(`${config.CONNECTION_STRING}/login/changepassword`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword,confirmNewPassword, changeType }),
            credentials: 'include' 
            });
        let data = await response.json();
        console.log(data.success);
        if (data.success) {
            document.cookie = "authenticated=true; path=/";  // Set the authenticated cookie
            window.location = 'index.html';
        } else {
            alert(data.message);
        }
    });
}