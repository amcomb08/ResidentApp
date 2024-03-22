function isValidData(data) {

  for (const key in data) {
    if (data[key] === '') {
      return false;
    }
  }

  return true; 
}


function loadAmenities() {
    // Fetch the amenities from the server
    fetch('http://localhost:5000/reservation/getAmenities', {
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.amenities) {
        const amenitiesContainer = document.getElementById('amenitiesList'); // Make sure you have a container with this ID
  
        // Clear previous amenities if needed
        amenitiesContainer.innerHTML = '';
  
        // Iterate over the amenities array
        data.amenities.forEach(amenity => {
          const amenityElement = document.createElement('li');
          amenityElement.className = 'amenity-tab mb-2 mr-8';
          amenityElement.innerHTML = `
            <a class="inline-block py-1.5 px-4 text-sm text-white font-bold leading-6 bg-gray-500 hover:bg-gray-700 rounded-lg" data-amenity-id="${amenity.AmenityID}" href="#">${amenity.AmenityName}</a>
          `;          
  
          // Append the amenity element to the container
          amenitiesContainer.appendChild(amenityElement);
        });
      } else {
        console.error(data.message);
      }
    })
    .catch(error => console.error('Error:', error));
  }

  function fetchAmenitySchedule(amenityId) {
    fetch(`http://localhost:5000/reservation/getAmenitySchedule/${amenityId}`, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.schedules) {
            displayAmenitySchedule(data.schedules);
        } else {
            console.error(data.message);
        }
    })
    .catch(error => console.error('Error fetching amenity schedules:', error));
}

function displayAmenitySchedule(schedules) {
    // Get or create the date selection dropdown
    let dateDropdown = document.getElementById('dateOfReservation');
    if (!dateDropdown) {
        dateDropdown = document.createElement('select');
        dateDropdown.id = 'dateDropdown';
        dateDropdown.className = 'block w-full outline-none bg-white text-black font-semibold'; // Adjusted for better visibility
        document.getElementById('scheduleContainer').appendChild(dateDropdown);

        // Placeholder option
        const placeholderOption = document.createElement('option');
        placeholderOption.textContent = "Select a date";
        placeholderOption.value = "";
        dateDropdown.appendChild(placeholderOption);
    }
    
    // Clear previous options
    dateDropdown.length = 1;

    // Extract unique dates and format them
    const uniqueDates = [...new Set(schedules.map(schedule => {
        // Format the date to 'YYYY-MM-DD'
        return schedule.Date.substring(0, 10);
    }))].sort();

    // Populate the dropdown with unique, formatted dates
    uniqueDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date; // The date is already formatted
        dateDropdown.appendChild(option);
    });

    // Add change event listener to date dropdown
    dateDropdown.onchange = function() {
        // Filter schedules to get those matching the selected date
        const selectedDateSchedules = schedules.filter(schedule => schedule.Date.substring(0, 10) === this.value);
        populateTimeSlots(selectedDateSchedules);
    };
}

function populateTimeSlots(schedulesForDate) {
    const timeSlotDropdown = document.getElementById('timeSlot');
    // Clear previous options except for the first placeholder option
    timeSlotDropdown.length = 1;

    // Populate the dropdown with time slots for the selected date
    schedulesForDate.forEach(schedule => {
        const option = document.createElement('option');
        option.value = schedule.ScheduleID;
        option.textContent = `${schedule.StartTime} - ${schedule.EndTime}`;
        console.log(option.value);
        timeSlotDropdown.appendChild(option);
    });
}

async function reserveSlot() { //Executes once save is clicked on the addpayment page

  const dataToInsert = {
    FirstName: document.getElementById('userFN').value.trim(),
    LastName: document.getElementById('userLN').value.trim(),
    Email: document.getElementById('userEmail').value.trim(),
    Phone: document.getElementById('userPhone').value.trim(),
    Date: document.getElementById('dateOfReservation').value.trim(),
    ScheduleID: document.getElementById('timeSlot').value.trim(),
  };

  // validate the data
  if (isValidData(dataToInsert)) {
    try {
      // You need to await the fetch call to complete
      let response = await fetch('http://localhost:5000/reservation/makeReservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToInsert),
        credentials: 'include'
      });
      
      // Also await the response.json() call to resolve
      let data = await response.json();
      
      if (data.success) {
        // Handle the success scenario, such as redirecting to a confirmation page
        window.location = './index.html';
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



  