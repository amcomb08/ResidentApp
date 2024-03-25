async function submitCreateEvent() {

    const dataToInsert = {
          EventName: document.getElementById('eventName').value.trim(),
          EventLocation: document.getElementById('eventLocation').value.trim(),
          EventDate: document.getElementById('eventDate').value.trim(),
          EventDescription: document.getElementById('eventDescription').value.trim()
      };
  
    // validate the data
    if (isValidData(dataToInsert)) {
      try {
        let response = await fetch('http://localhost:5000/adminRoutes/submitEvent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToInsert),
          credentials: 'include'
        });
        
        // Also await the response.json() call to resolve
        let data = await response.json();
        
        if (data.success) {
          // Handle the success scenario, such as redirecting to a confirmation page
          window.location = './adminindex.html';
        } else {
          // Handle the failure scenario
          alert(data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while processing your request.');
      }
    } else {
      alert('Please fill in all the fields');
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
        const eventElement = document.createElement('div'); 
        eventElement.className = "block p-4 mb-4 bg-gray-600 rounded-xl hover:bg-gray-700 transition duration-200";
  
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
                    <div class="w-auto p-2">
                        <button onclick="deleteEvent(${event.EventID})" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Delete</button>
                    </div>
                </div>
            </div>
        `;
  
        eventsContainer.appendChild(eventElement);
    });
  }
  
  async function deleteEvent(EventID) {
  
      try {
        // You need to await the fetch call to complete
        let response = await fetch('http://localhost:5000/adminRoutes/deleteEvent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ EventID: EventID }),
          credentials: 'include'
        });
        
        // Also await the response.json() call to resolve
        let data = await response.json();
        
        if (data.success) {
          // Handle the success scenario, such as redirecting to a confirmation page
          window.location = './adminindex.html';
        } else {
          // Handle the failure scenario
          alert(data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while processing your request.');
      }
  }

  async function submitCreateAnnouncement() {

    const dataToInsert = {
            AnnouncementHeader: document.getElementById('announcementHeader').value.trim(),
            AnnouncementDetail: document.getElementById('announcementDetail').value.trim()
      };
  
    // validate the data
    if (isValidData(dataToInsert)) {
      try {
        let response = await fetch('http://localhost:5000/adminRoutes/submitAnnouncement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToInsert),
          credentials: 'include'
        });
        
        // Also await the response.json() call to resolve
        let data = await response.json();
        
        if (data.success) {
          // Handle the success scenario, such as redirecting to a confirmation page
          window.location = './adminindex.html';
        } else {
          // Handle the failure scenario
          alert(data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while processing your request.');
      }
    } else {
      alert('Please fill in all the fields');
    }
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
            <div class="w-auto p-2">
            <button onclick="deleteAnnouncement(${announcement.AnnouncementID})" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Delete</button>
            </div>
            <!-- Add more announcement details here -->
        `;

        // Append the announcement block to the container
        announcementsContainer.appendChild(announcementBlock);
    });
}


async function deleteAnnouncement(AnnouncementID) {
  
    try {
      // You need to await the fetch call to complete
      let response = await fetch('http://localhost:5000/adminRoutes/deleteAnnouncement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ AnnouncementID: AnnouncementID }),
        credentials: 'include'
      });
      
      // Also await the response.json() call to resolve
      let data = await response.json();
      
      if (data.success) {
        // Handle the success scenario, such as redirecting to a confirmation page
        window.location = './adminindex.html';
      } else {
        // Handle the failure scenario
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing your request.');
    }
}

function fillAmenityDropdown() {
    // Get the dropdown element by its ID
    const dropdown = document.getElementById('paymentDropdown');
    
    // Fetch the payment method nicknames from the server
    fetch('http://localhost:5000/adminRoutes/getAmenities', {
      credentials: 'include' 
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.paymentMethods) {
        // Clear the existing options
        const dropdown = document.getElementById('paymentDropdown');
        dropdown.length = 0;
    
        // Iterate over each payment method and create a new option element
        data.paymentMethods.forEach(paymentMethod => {
          const option = document.createElement('option');
          option.textContent = paymentMethod.CardNickname; 
          option.value = paymentMethod.CardID; 
          option.className = 'bg-gray-500'; 
          option.setAttribute('data-name-on-card', paymentMethod.NameOnCard);
          option.setAttribute('data-card-number', paymentMethod.CardNum);
          console.log(paymentMethod.NameOnCard);
          dropdown.appendChild(option);
        });
      } else {
        console.error(data.message);
      }
    })
    .catch(error => console.error('Error:', error));
  }

  function fillAmenityDropdown() {
    
    // Fetch the payment method nicknames from the server
    fetch('http://localhost:5000/adminRoutes/getAmenities', {
      credentials: 'include' 
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.amenities) {
        // Clear the existing options
        const dropdown = document.getElementById('amenityDropdown');
        dropdown.length = 0;
    
        // Iterate over each payment method and create a new option element
        data.amenities.forEach(amenity => {
          const option = document.createElement('option');
          option.textContent = amenity.AmenityName; 
          option.value = amenity.AmenityID; 
          option.className = 'bg-gray-500'; 
          dropdown.appendChild(option);
        });
      } else {
        console.error(data.message);
      }
    })
    .catch(error => console.error('Error:', error));
  }

  function getCheckedDays() {
    var checkboxes = document.querySelectorAll('input[name="closedDays"]:checked');
    
    var checkedValues = Array.from(checkboxes).map(function(checkbox) {
        return checkbox.value;
    });

    return checkedValues;
   }

  async function createAmenityHours() {

    const dataToInsert = {
            AmenityID: document.getElementById('amenityDropdown').value.trim(),
            StartHour: document.getElementById('amenityStartHour').value.trim(),
            EndHour: document.getElementById('amenityEndHour').value.trim(),
            Interval: document.getElementById('amenityInterval').value.trim(),
            StartDate: document.getElementById('amenityStartDate').value.trim(),
            EndDate: document.getElementById('amenityEndDate').value.trim(),
            ClosedDays: getCheckedDays()
      };
      console.log(dataToInsert);
  
    // validate the data
    if (isValidData(dataToInsert)) {
      try {
        let response = await fetch('http://localhost:5000/adminRoutes/submitAmenityHours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToInsert),
          credentials: 'include'
        });
        
        // Also await the response.json() call to resolve
        let data = await response.json();
        
        if (data.success) {
          // Handle the success scenario, such as redirecting to a confirmation page
          window.location = './adminindex.html';
        } else {
          // Handle the failure scenario
          alert(data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while processing your request.');
      }
    } else {
      alert('Please fill in all the fields');
    }
  }

  async function submitCreateAmenity() {

    const dataToInsert = {
            AmenityName: document.getElementById('newAmenityName').value.trim(),
            AmenityDescription: document.getElementById('newAmenityDescription').value.trim()
      };
  
    // validate the data
    if (isValidData(dataToInsert)) {
      try {
        let response = await fetch('http://localhost:5000/adminRoutes/submitAmenity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToInsert),
          credentials: 'include'
        });
        
        // Also await the response.json() call to resolve
        let data = await response.json();
        
        if (data.success) {
          // Handle the success scenario, such as redirecting to a confirmation page
          window.location = './adminindex.html';
        } else {
          // Handle the failure scenario
          alert(data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while processing your request.');
      }
    } else {
      alert('Please fill in all the fields');
    }
  }

  async function getReservations() {
    try {
        let response = await fetch('http://localhost:5000/adminRoutes/get-reservations', {
            method: 'GET',
            credentials: 'include'
        });
        
        let data = await response.json();
        
        if (data.success) {
            populateReservations(data.reservations);
        } else {
            console.error('Failed to fetch events:', data.message);
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }
  }

  function populateReservations(reservations) {
    const eventsContainer = document.getElementById('reservationsContainer');
    eventsContainer.innerHTML = '';
  
    reservations.forEach(reservation => {
        const eventElement = document.createElement('div'); 
        eventElement.className = "block p-4 mb-4 bg-gray-600 rounded-xl hover:bg-gray-700 transition duration-200";
  
        eventElement.innerHTML = `
            <h4 id="eventName" class="text-white font-semibold leading-6 mb-1">${reservation.AmenityName}</h4>
            <div class="flex items-center mb-4">
                <span class="h-2 w-2 mr-1 bg-pink-400 rounded-full"></span>
                <span class="text-xs font-medium text-pink-400">${reservation.FirstName}, ${reservation.LastName}</span>
            </div>
            <p class="text-xs text-gray-300 leading-normal mb-10">Contact: ${reservation.PhoneNumber} OR ${reservation.Email}</p>
            <div class="pt-4 border-t border-gray-500">
                <div class="flex flex-wrap items-center justify-between -m-2">
                    <div class="w-auto p-2">
                        <div class="flex items-center p-2 bg-gray-500 rounded-md">
                            <!-- Your SVG here -->
                            <span class="ml-2 text-xs font-medium text-gray-200">${formatDate(reservation.Date)}</span>
                            <span class="ml-2 text-xs font-medium text-gray-200">${reservation.StartTime} - ${reservation.EndTime}</span>
                        </div>
                    </div>
                    <div class="w-auto p-2">
                        <button onclick="cancelReservation(${reservation.ScheduleID}, ${reservation.ReservationID})" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
                    </div>
                </div>
            </div>
        `;
  
        eventsContainer.appendChild(eventElement);
    });
  }

  async function cancelReservation(ScheduleID, ReservationID) {
  
    try {
      // You need to await the fetch call to complete
      let response = await fetch('http://localhost:5000/adminRoutes/cancelReservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ScheduleID: ScheduleID, ReservationID: ReservationID }),
        credentials: 'include'
      });
      
      // Also await the response.json() call to resolve
      let data = await response.json();
      
      if (data.success) {
        // Handle the success scenario, such as redirecting to a confirmation page
        window.location = './adminindex.html';
      } else {
        // Handle the failure scenario
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while processing your request.');
    }
}