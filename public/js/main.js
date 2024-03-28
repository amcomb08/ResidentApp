// Define the logout function
function logoutUser() {
    fetch('https://residentapplication.azurewebsites.net/logout', { credentials: 'include', method: 'POST' })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Redirect to login page on successful logout
            window.location.href = '../login.html';
        } else {
            // Handle any errors or unsuccessful logout attempts
            console.error('Logout failed:', data.message);
        }
    })
    .catch(error => {
        console.error('There was an error during logout:', error);
    });
}

function showDropdown(type) {
    console.log('showDropdown');
    var dropdownMenu = document.querySelector('#' + type + ' + .dropdown-menu');
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
}

function checkLogin(role){
    window.onload = function() {
        fetch('https://residentapplication.azurewebsites.net/login/checkLogin', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (!data.loggedin || (data.userRole !== role && data.userRole !== 'DevTest' && data.userRole !== 'AnyUser')) {
                window.location.href = 'login.html';
            }
            else{
                document.body.style.display = 'block';
            }
            // If user is logged in, no action is needed. They can continue using the page.
        })
        .catch(error => {
           console.error('There was an error checking the login status:', error);
        });
    }
}

function initalizeAdminNavBar(){
    // Create the header and append it to the body
    document.getElementById('main-header').appendChild(createAdminHeader());
    // Use the logoutUser function from navbar.js when the logout button is clicked
    document.getElementById('logoutButton').addEventListener('click', logoutUser);

    document.getElementById('community-manager-link').addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent click from immediately propagating to document
        showDropdown('community-manager-link');
    });

    document.getElementById('resident-manager-link').addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent click from immediately propagating to document
        showDropdown('resident-manager-link');
    });

    document.addEventListener('click', function(event) {
        var dropdownMenu = document.querySelector('#resident-manager-link + .dropdown-menu');
        if (dropdownMenu.style.display === 'block' && !dropdownMenu.contains(event.target) && event.target.id !== 'resident-manager-link') {
            dropdownMenu.style.display = 'none'; // Hide the dropdown
        }
        var dropdownMenu = document.querySelector('#community-manager-link + .dropdown-menu');
        if (dropdownMenu.style.display === 'block' && !dropdownMenu.contains(event.target) && event.target.id !== 'community-manager-link') {
            dropdownMenu.style.display = 'none'; // Hide the dropdown
        }
    });
}

function createAdminHeader() {
    const headerContainer = document.createElement('div');
    headerContainer.className = 'hidden xl:block w-full md:w-auto px-2 mr-auto';

    const ul = document.createElement('ul');
    ul.className = 'flex items-center';

    // Define the menu items
    const menuItems = [
        { text: 'Home', href: 'adminindex.html' },
        { text: 'Messages', href: 'adminmessages.html'},
        { text: 'Payment Manager', href: 'sendpaymentdue.html' },
        {
            text: 'Community Manager',
            dropdown: [
                { text: 'Events', href: 'events.html' },
                { text: 'Announcements', href: 'announcements.html' },
                { text: 'Amenities', href: 'amenities.html' },
                { text: 'Reservations', href: 'reservations.html' },
            ]
        },
        {
            text: 'Resident Manager',
            dropdown: [
                { text: 'Add User', href: 'adduser.html' },
                { text: 'Remove User', href: 'removeuser.html' },
            ]
        }
    ];

    menuItems.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'mr-10';

        if (item.dropdown) {
            const a = document.createElement('a');
            a.className = 'inline-block text-sm font-semibold text-gray-300 hover:text-gray-200 cursor-pointer';
            a.id = item.text.toLowerCase().replace(/ /g, '-') + '-link'; // Generate an id from text
            a.textContent = item.text;
            li.appendChild(a);

            const dropdownMenu = document.createElement('div');
            dropdownMenu.className = 'dropdown-menu absolute hidden bg-gray-700 text-white';

            item.dropdown.forEach((dropdownItem) => {
                const dropdownLink = document.createElement('a');
                dropdownLink.className = 'block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600';
                dropdownLink.href = dropdownItem.href;
                dropdownLink.textContent = dropdownItem.text;
                dropdownMenu.appendChild(dropdownLink);
            });

            // Append the dropdown menu to the list item
            li.appendChild(dropdownMenu);
        } else {
            const a = document.createElement('a');
            a.className = 'inline-block text-sm font-semibold text-gray-300 hover:text-gray-200';
            a.href = item.href;
            a.textContent = item.text;

            // Add badge if needed
            if (item.badge) {
                const badgeDiv = document.createElement('div');
                badgeDiv.className = 'flex w-5 h-5 ml-2 items-center justify-center text-xs text-white bg-blue-500 rounded-full';
                badgeDiv.textContent = item.badge;
                const span = document.createElement('span');
                span.appendChild(badgeDiv);
                a.appendChild(span);
            }

            li.appendChild(a);
        }

        // Append the list item to the unordered list
        ul.appendChild(li);
    });

    // Create a container for the logout button
    const logoutButtonContainer = document.createElement('div');
    logoutButtonContainer.className = 'w-full sm:w-auto px-3 mb-4';

    // Create the anchor tag for the logout button
    const logoutButtonAnchor = document.createElement('a');
    // Set the href if you're using a link to log out
    logoutButtonAnchor.href = '#'; // Set this to your logout script or leave it to be handled by JS

    // Create the logout button
    const logoutButton = document.createElement('button');
    logoutButton.id = 'logoutButton';
    logoutButton.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded';
    logoutButton.textContent = 'Sign Out';

    // Append the button to the anchor tag, and then the anchor tag to the button container
    logoutButtonAnchor.appendChild(logoutButton);
    logoutButtonContainer.appendChild(logoutButtonAnchor);

    // Append the logout button container to the header
    ul.appendChild(logoutButtonContainer);

    // Append the unordered list to the header container
    headerContainer.appendChild(ul);

    // Return the header container
    return headerContainer;
}


function createHeader() {
    const headerContainer = document.createElement('div');
    headerContainer.className = 'hidden xl:block w-full md:w-auto px-2 mr-auto';

    const ul = document.createElement('ul');
    ul.className = 'flex items-center';

    // Define the menu items
    const menuItems = [
        { text: 'Home', href: 'index.html' },
        { text: 'Messages', href: 'messages.html'},
        { text: 'Payment History', href: 'ledger.html' },
        { text: 'Community', href: 'community.html' },
        {
            text: 'All Options',
            dropdown: [
                { text: 'Change Password', href: 'changepassword.html?type=loggedIn' },
            ]
        }
    ];

    menuItems.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'mr-10';

        if (item.dropdown) {
            const a = document.createElement('a');
            a.className = 'inline-block text-sm font-semibold text-gray-300 hover:text-gray-200 cursor-pointer';
            a.id = item.text.toLowerCase().replace(/ /g, '-') + '-link'; // Generate an id from text
            a.textContent = item.text;
            li.appendChild(a);

            const dropdownMenu = document.createElement('div');
            dropdownMenu.className = 'dropdown-menu absolute hidden bg-gray-700 text-white';

            item.dropdown.forEach((dropdownItem) => {
                const dropdownLink = document.createElement('a');
                dropdownLink.className = 'block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600';
                dropdownLink.href = dropdownItem.href;
                dropdownLink.textContent = dropdownItem.text;
                dropdownMenu.appendChild(dropdownLink);
            });

            // Append the dropdown menu to the list item
            li.appendChild(dropdownMenu);
        } else {
            const a = document.createElement('a');
            a.className = 'inline-block text-sm font-semibold text-gray-300 hover:text-gray-200';
            a.href = item.href;
            a.textContent = item.text;

            // Add badge if needed
            if (item.badge) {
                const badgeDiv = document.createElement('div');
                badgeDiv.className = 'flex w-5 h-5 ml-2 items-center justify-center text-xs text-white bg-blue-500 rounded-full';
                badgeDiv.textContent = item.badge;
                const span = document.createElement('span');
                span.appendChild(badgeDiv);
                a.appendChild(span);
            }

            li.appendChild(a);
        }

        // Append the list item to the unordered list
        ul.appendChild(li);
    });

    // Create a container for the logout button
    const logoutButtonContainer = document.createElement('div');
    logoutButtonContainer.className = 'w-full sm:w-auto px-3 mb-4';

    // Create the anchor tag for the logout button
    const logoutButtonAnchor = document.createElement('a');
    // Set the href if you're using a link to log out
    logoutButtonAnchor.href = '#'; // Set this to your logout script or leave it to be handled by JS

    // Create the logout button
    const logoutButton = document.createElement('button');
    logoutButton.id = 'logoutButton';
    logoutButton.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded';
    logoutButton.textContent = 'Sign Out';

    // Append the button to the anchor tag, and then the anchor tag to the button container
    logoutButtonAnchor.appendChild(logoutButton);
    logoutButtonContainer.appendChild(logoutButtonAnchor);

    // Append the logout button container to the header
    ul.appendChild(logoutButtonContainer);

    // Append the unordered list to the header container
    headerContainer.appendChild(ul);

    // Return the header container
    return headerContainer;
}

function initalizeNavBar(){
    // Create the header and append it to the body
    document.getElementById('main-header').appendChild(createHeader());
    // Use the logoutUser function from navbar.js when the logout button is clicked
    document.getElementById('logoutButton').addEventListener('click', logoutUser);

    document.getElementById('all-options-link').addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent click from immediately propagating to document
        showDropdown('all-options-link');
    });

    document.addEventListener('click', function(event) {
        var dropdownMenu = document.querySelector('#all-options-link + .dropdown-menu');
        if (dropdownMenu.style.display === 'block' && !dropdownMenu.contains(event.target) && event.target.id !== 'all-options-link') {
            dropdownMenu.style.display = 'none'; // Hide the dropdown
        }
    });
}


