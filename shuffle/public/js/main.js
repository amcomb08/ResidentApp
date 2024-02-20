// Burger menus
document.addEventListener('DOMContentLoaded', function() {
    // open
    const burger = document.querySelectorAll('.navbar-burger');
    const menu = document.querySelectorAll('.navbar-menu');

    if (burger.length && menu.length) {
        for (var i = 0; i < burger.length; i++) {
            burger[i].addEventListener('click', function() {
                for (var j = 0; j < menu.length; j++) {
                    menu[j].classList.toggle('hidden');
                }
            });
        }
    }

    // close
    const close = document.querySelectorAll('.navbar-close');
    const backdrop = document.querySelectorAll('.navbar-backdrop');

    if (close.length) {
        for (var i = 0; i < close.length; i++) {
            close[i].addEventListener('click', function() {
                for (var j = 0; j < menu.length; j++) {
                    menu[j].classList.toggle('hidden');
                }
            });
        }
    }

    if (backdrop.length) {
        for (var i = 0; i < backdrop.length; i++) {
            backdrop[i].addEventListener('click', function() {
                for (var j = 0; j < menu.length; j++) {
                    menu[j].classList.toggle('hidden');
                }
            });
        }
    }
});

// Define the logout function
function logoutUser() {
    fetch('http://localhost:5000/logout', { credentials: 'include', method: 'POST' })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Redirect to login page on successful logout
            window.location.href = './login.html';
        } else {
            // Handle any errors or unsuccessful logout attempts
            console.error('Logout failed:', data.message);
        }
    })
    .catch(error => {
        console.error('There was an error during logout:', error);
    });
}

function showDropdown() {
    console.log('showDropdown');
    var dropdownMenu = document.querySelector('#all-options-link + .dropdown-menu');
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
}

