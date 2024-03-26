async function sendMaintenanceRequest() {
    let fields = {
        firstName: document.getElementById('maintenance_req_fn').value,
        lastName: document.getElementById('maintenance_req_ln').value,
        email: document.getElementById('maintenance_req_email').value,
        phone: document.getElementById('maintenance_req_phone').value,
        maintenanceType: document.getElementById('maintenance_req_type').value,
        details: document.getElementById('maintenance_req_detail').value
    };
    
    // Check for empty fields and alert the user
    for (let fieldName in fields) {
        if (fields[fieldName].trim() === '') {
            alert(fieldName + ' cannot be empty.');
            return;
        }
    }
    
    // If all fields are filled, proceed with the fetch request
    let response = await fetch('http://localhost:5000/message/send-maintenance-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
        credentials: 'include' 
    });
    
    let data = await response.json();
    console.log(data.success);
    
    if (data.success) {
        document.cookie = "authenticated=true; path=/";
        window.location = './index.html';
    } else {
        alert(data.message);
    }
}

async function sendContactMessage() {
    let fields = {
        firstName: document.getElementById('contact-fn').value,
        lastName: document.getElementById('contact-ln').value,
        email: document.getElementById('contact-email').value,
        phone: document.getElementById('contact-phone').value,
        message: document.getElementById('contact-message').value
    };
    
    // Check for empty fields and alert the user
    for (let fieldName in fields) {
        if (fields[fieldName].trim() === '') {
            alert(fieldName + ' cannot be empty.');
            return;
        }
    }
    
    // If all fields are filled, proceed with the fetch request
    let response = await fetch('http://localhost:5000/message/send-contact-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
        credentials: 'include' 
    });
    
    let data = await response.json();
    console.log(data.success);
    
    if (data.success) {
        document.cookie = "authenticated=true; path=/";
        window.location = './index.html';
    } else {
        alert(data.message);
    }
}

async function getEvents() {
    try {
        let response = await fetch('http://localhost:5000/message/get-events', {
            method: 'GET',
            credentials: 'include'
        });
        
        let data = await response.json();
        
        if (data.success) {
            populateEvents(data.events);
        } else {
            console.error('Failed to fetch events:', data.message);
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}


function populateEvents(events) {
    const eventsContainer = document.getElementById('eventsContainer');
    eventsContainer.innerHTML = '';
  
    events.forEach(event => {
      const eventElement = document.createElement('a');
      eventElement.className = "block p-4 mb-4 bg-gray-600 rounded-xl hover:bg-gray-700 transition duration-200";
      eventElement.href = "#";
  
      eventElement.innerHTML = `
        <h4 id="eventName" class="text-white font-semibold leading-6 mb-1">${event.EventName}</h4>
        <div class="flex items-center mb-4">
          <span class="h-2 w-2 mr-1 bg-pink-400 rounded-full"></span>
          <span class="text-xs font-medium text-pink-400">${event.EventLocation}</span>
        </div>
        <p class="text-xs text-gray-300 leading-normal mb-10">${event.EventDescription}</p>
        <div class="pt-4 border-t border-gray-500">
          <div class="flex flex-wrap items-center justify-between -m-2">
            <div class="w-auto p-2">
              <div class="flex items-center p-2 bg-gray-500 rounded-md">
                <!-- Your SVG here -->
                <span class="ml-2 text-xs font-medium text-gray-200">${formatDate(event.EventDate)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
  
      eventsContainer.appendChild(eventElement);
    });
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

async function getAnnoucements() {
    try {
        let response = await fetch('http://localhost:5000/message/get-announcements', {
            method: 'GET',
            credentials: 'include' // If your endpoint requires authentication
        });
        
        let data = await response.json();
        
        if (data.success) {
            populateAnnouncement(data.announcements);
        } else {
            console.error('Failed to fetch events:', data.message);
            // Handle the error case, maybe show a message to the user
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        // Handle network errors or other issues here
    }
}

function populateAnnouncement(announcements) {
    const announcementsContainer = document.getElementById('announcementsContainer'); // Ensure this container exists in your HTML
    announcementsContainer.innerHTML = ''; // Clear existing announcements

    announcements.forEach(announcement => {
        // Create the announcement block element
        const announcementBlock = document.createElement('a');
        announcementBlock.className = "block p-4 mb-4 bg-gray-600 rounded-xl hover:bg-gray-700 transition duration-200";
        announcementBlock.href = "#"; // Set this to the link for the announcement if applicable

        // Populate the announcement details
        announcementBlock.innerHTML = `
            <h4 class="text-white font-semibold leading-6 mb-1">${announcement.AnnouncementHeader}</h4>
            <p class="text-xs text-gray-300 leading-normal mb-10">${announcement.AnnouncementDetail}</p>
            <!-- Add more announcement details here -->
        `;

        // Append the announcement block to the container
        announcementsContainer.appendChild(announcementBlock);
    });
}

async function loadMessagePreviews(type) {
    try {
      const response = await fetch(`http://localhost:5000/message/get-messages`, {
        method: 'GET',
        credentials: 'include' // If your endpoint requires authentication
      });
      const data = await response.json();
  
      if (data.success && data.messages) {
        const messagesContainer = document.querySelector('.messages-preview-container ul');
        messagesContainer.innerHTML = ''; 
  
        data.messages.forEach(message => {
          const messagePreview = document.createElement('li');
          messagePreview.className = 'group block w-full px-8 py-6 hover:bg-gray-700 border-l-4 border-transparent hover:border-blue-500';
          messagePreview.innerHTML = `
            <div class="text-left">
              <div class="font-bold text-sm text-gray-300">${message.Subject}</div>
              <div class="text-white-400 text-xs">${message.Message.substring(0, 30)}...</div> <!-- Display a snippet -->
              <div class="text-white-400 text-xs mt-2">${new Date(message.TimeStamp).toLocaleString()}</div>
            </div>
          `;
          // Add a click event listener to each message preview
          messagePreview.addEventListener('click', () => displayMessageDetails(message), type);
          messagesContainer.appendChild(messagePreview);
        });
      } else {
        console.error('Failed to fetch messages:', data.message);
        // Handle no messages or errors
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Handle network errors or other issues here
    }
  }


  function displayMessageDetails(message, type) {
    const messageDetailsContainer = document.querySelector('.message-details-container');
    // Clear out any existing message details
    messageDetailsContainer.innerHTML = '';
    
    // Create and append new details
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = `
      <h3 class="text-white font-semibold leading-6 mb-1">${message.Subject}</h3>
      <p class="text-sm text-gray-300 leading-normal">${message.Message}</p>
      <p class="text-sm text-gray-300 mt-2">From: ${message.SenderUserID} | Date: ${new Date(message.TimeStamp).toLocaleString()}</p>
    `;
    messageDetailsContainer.appendChild(messageContent);
  }

