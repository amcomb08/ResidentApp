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
        let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/submitEvent', {
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
        let response = await fetch('https://residentapplication.azurewebsites.net/message/get-events', {
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
            <h4 id="eventNameType" class="text-white font-semibold leading-6 mb-1">${event.EventName}</h4>
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
        let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/deleteEvent', {
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
        let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/submitAnnouncement', {
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
        let response = await fetch('https://residentapplication.azurewebsites.net/message/get-announcements', {
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
      let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/deleteAnnouncement', {
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
    
    // Fetch the payment method nicknames from the server
    fetch('https://residentapplication.azurewebsites.net/communityAdmin/getAmenities', {
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
        let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/submitAmenityHours', {
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
        let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/submitAmenity', {
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
        let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/getReservations', {
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
      let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/cancelReservation', {
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

async function getApartments() {
  try {
      let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/getApartments', {
          method: 'GET',
          credentials: 'include'
      });
      
      let data = await response.json();
      
      if (data.success) {
          populateApartments(data.apartments);
      } else {
          console.error('Failed to fetch events:', data.message);
      }
  } catch (error) {
      console.error('Error fetching events:', error);
  }
}

function populateApartments(apartments) {
  const apartmentsContainer = document.getElementById('apartmentsContainer');
  apartmentsContainer.innerHTML = '';

  apartments.forEach(apartment => {
    const apartmentElement = document.createElement('div');
    apartmentElement.className = "block p-4 mb-4 bg-gray-600 rounded-xl hover:bg-gray-700 transition duration-200";

    // Format the LeaseEndDate using formatDate function
    const formattedLeaseEndDate = apartment.LeaseEndDate ? formatDate(apartment.LeaseEndDate) : 'Not Available';

    apartmentElement.innerHTML = `
      <h4 class="text-white font-semibold leading-6 mb-1">Apartment: ${apartment.ApartmentNumber}</h4>
      <div class="flex items-center mb-4">
          <span class="h-2 w-2 mr-1 bg-green-400 rounded-full"></span>
          <span class="text-xs font-medium text-green-400">Residents: ${apartment.Names}</span>
      </div>
      <div class="flex items-center mb-4">
          <span class="h-2 w-2 mr-1 bg-blue-400 rounded-full"></span>
          <span class="text-xs font-medium text-blue-400">Emails: ${apartment.Emails}</span>
      </div>
      <div class="flex items-center mb-4">
          <span class="h-2 w-2 mr-1 bg-yellow-400 rounded-full"></span>
          <span class="text-xs font-medium text-yellow-400">Lease End Date: ${formattedLeaseEndDate}</span>
      </div>
      <p class="text-xs text-gray-300 leading-normal mb-10">Total Amount Due: $${apartment.TotalAmountDue}</p>
    `;

    // Create the "Renew Lease" button
    const renewLeaseButton = document.createElement('button');
    renewLeaseButton.textContent = 'Update Lease';
    renewLeaseButton.className = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded";
    renewLeaseButton.onclick = () => createLeaseRenewalFields(apartmentElement, apartment.ApartmentNumber);
    
    // Append the "Renew Lease" button to the apartmentElement
    apartmentElement.appendChild(renewLeaseButton);

    // Create the "End Lease" button
    const endLeaseButton = document.createElement('button');
    endLeaseButton.textContent = 'End Lease';
    endLeaseButton.className = "bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-4";
    endLeaseButton.addEventListener('click', () => {
      endLease(apartment.ApartmentNumber);
    });

    // Append the buttons to the apartmentElement
    apartmentElement.appendChild(renewLeaseButton);
    apartmentElement.appendChild(endLeaseButton);

    apartmentsContainer.appendChild(apartmentElement);
  });
}

function createLeaseRenewalFields(apartmentElement, apartmentNumber) {
  // Remove existing renewal fields if any to prevent duplicates
  const existingFields = apartmentElement.querySelector('.renewal-fields');
  if (existingFields) apartmentElement.removeChild(existingFields);

  // Create container for new fields
  const fieldContainer = document.createElement('div');
  fieldContainer.className = 'renewal-fields';
  fieldContainer.style.display = 'flex';
  fieldContainer.style.flexDirection = 'column';
  fieldContainer.style.gap = '10px';

  // New Lease Date input
  const newLeaseDateInput = document.createElement('input');
  newLeaseDateInput.type = 'date';
  newLeaseDateInput.placeholder = 'New Lease Date';
  newLeaseDateInput.className = 'new-lease-date-input';
  newLeaseDateInput.style.marginTop = '20px';
  newLeaseDateInput.style.padding = '10px'; 

  // Rent Amount input
  const rentAmountInput = document.createElement('input');
  rentAmountInput.type = 'number';
  rentAmountInput.placeholder = 'Rent Amount';
  rentAmountInput.className = 'rent-amount-input';
  rentAmountInput.style.padding = '10px';

  // Confirm Button
  const confirmButton = document.createElement('button');
  confirmButton.textContent = 'Confirm';
  confirmButton.className = 'confirm-button';
  confirmButton.style.marginTop = '10px';
  confirmButton.style.padding = '10px';
  confirmButton.onclick = () => updateLease(apartmentNumber, newLeaseDateInput.value, rentAmountInput.value);

  // Append fields and button to container, then container to the apartment element
  fieldContainer.appendChild(newLeaseDateInput);
  fieldContainer.appendChild(rentAmountInput);
  fieldContainer.appendChild(confirmButton);
  apartmentElement.appendChild(fieldContainer);
}


async function updateLease(apartmentNumber, newLeaseDate, rentAmount) {
  try {
    // You need to await the fetch call to complete
    let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/updateLease', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ApartmentNumber: apartmentNumber, NewLeaseDate: newLeaseDate, RentAmount: rentAmount }),
      credentials: 'include'
    });
    
    // Also await the response.json() call to resolve
    let data = await response.json();
    
    if (data.success) {
      // Handle the success scenario, such as redirecting to a confirmation page
      window.location = './apartments.html';
    } else {
      // Handle the failure scenario
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while processing your request.');
  }
}

async function endLease(apartmentNumber) {
  try {
    // You need to await the fetch call to complete
    let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/endLease', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ApartmentNumber: apartmentNumber}),
      credentials: 'include'
    });
    
    // Also await the response.json() call to resolve
    let data = await response.json();
    
    if (data.success) {
      // Handle the success scenario, such as redirecting to a confirmation page
      window.location = './apartments.html';
    } else {
      // Handle the failure scenario
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while processing your request.');
  }
}

async function getLatePayments() {
  try {
      let response = await fetch('https://residentapplication.azurewebsites.net/communityAdmin/getLatePayments', {
          method: 'GET',
          credentials: 'include'
      });

      let data = await response.json();

      if (data.success) {
          populateLatePayments(data.latePayments);
      } else {
          console.error('Failed to fetch events:', data.message);
      }
  } catch (error) {
      console.error('Error fetching events:', error);
  }
}


function populateLatePayments(latePayments) {
  const latePaymentsContainer = document.getElementById('latePaymentsContainer');
  latePaymentsContainer.innerHTML = '';

  latePayments.forEach(latePayment => {
    const latePaymentsElement = document.createElement('div');
    latePaymentsElement.className = "block p-4 mb-4 bg-gray-600 rounded-xl hover:bg-gray-700 transition duration-200";

    // Format the LeaseEndDate using formatDate function
    const formattedLatePaymentsDate = latePayment.OldestDueDate ? formatDate(latePayment.OldestDueDate) : 'Not Available';

    latePaymentsElement.innerHTML = `
      <h4 class="text-white font-semibold leading-6 mb-1">Apartment: ${latePayment.ApartmentNumber}</h4>
      <div class="flex items-center mb-4">
          <span class="h-2 w-2 mr-1 bg-green-400 rounded-full"></span>
          <span class="text-xs font-medium text-green-400">Residents: </span>
      </div>
      <div class="flex items-center mb-4">
          <span class="h-2 w-2 mr-1 bg-blue-400 rounded-full"></span>
          <span class="text-xs font-medium text-blue-400">Emails: </span>
      </div>
      <div class="flex items-center mb-4">
          <span class="h-2 w-2 mr-1 bg-yellow-400 rounded-full"></span>
          <span class="text-xs font-medium text-yellow-400">Due Date: ${formattedLatePaymentsDate}</span>
      </div>
      <p class="text-xs text-gray-300 leading-normal mb-10">Total Amount Due: $${latePayment.TotalAmountDue}</p>
    `;

    // Create the "End Lease" button
    const endLeaseButton = document.createElement('button');
    endLeaseButton.textContent = 'Send Notice';
    endLeaseButton.className = "bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-4";
    endLeaseButton.addEventListener('click', () => {
      console.log('Lease ended for apartment:', apartment.ApartmentNumber);
    });

    latePaymentsElement.appendChild(endLeaseButton);

    latePaymentsContainer.appendChild(latePaymentsElement);
  });
}


