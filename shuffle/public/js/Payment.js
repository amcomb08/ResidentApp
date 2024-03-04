const statesList = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
  "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

function isValidData(data) {

  for (const key in data) {
    if (data[key] === '') {
      return false;
    }
  }

  return true; 
}


function fillStateDropdown() { //Populate the state dropdown

const dropdown = document.getElementById('stateDropdown');

statesList.forEach(state => {
  const option = document.createElement('option');
  option.value = state;
  option.textContent = state;
  option.className = 'bg-gray-500';
  dropdown.appendChild(option);
});

}

function fillPaymentDropdown() {
  // Get the dropdown element by its ID
  const dropdown = document.getElementById('paymentDropdown');
  
  // Fetch the payment method nicknames from the server
  fetch('http://localhost:5000/payments/getPaymentMethods', {
    credentials: 'include' // Important for including session cookies with the request
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
        option.textContent = paymentMethod.CardNickname; // Adjusted to 'CardNickname'
        option.value = paymentMethod.CardID; // Adjusted to 'CardID'
        option.className = 'bg-gray-500'; // Add any classes for styling if needed
        dropdown.appendChild(option);
      });
    } else {
      console.error(data.message);
    }
  })
  .catch(error => console.error('Error:', error));
  
  
}

function getPaymentDue() {
  fetch('http://localhost:5000/payments/getPaymentDue', {
      credentials: 'include' // Important for sessions
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          document.getElementById('paymentsDueValue').textContent = `$${data.paymentAmount}`;
      } else {
          console.error(data.message);
      }
  })
  .catch(error => console.error('Error:', error));
}

async function submitPayment() {
  let paymentMethod = document.getElementById('paymentDropdown').value.trim();
  let paymentAmount = document.getElementById('paymentAmount').value.trim(); 

  if(paymentMethod === ''){
    alert('Please select a payment method');
    return;
  }

  if(paymentAmount === '' || paymentAmount === '0'){
    alert('Please enter a payment amount');
    return;
  }

  try {
    let response = await fetch('http://localhost:5000/payments/makePayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod, paymentAmount }),
        credentials: 'include' 
    });
    let data = await response.json();
    console.log(data.success);

    if (data.success) {
        let paymentNote = document.getElementById('paymentNote').value.trim();
        let paymentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

        let paymentHistoryResponse = await fetch('http://localhost:5000/payments/updatePaymentHistory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                paymentMethod,
                paymentAmount,
                paymentNote,
                paymentDate
            }),
            credentials: 'include' 
        });
        let paymentHistoryData = await paymentHistoryResponse.json();

        if (paymentHistoryData.success) {
            // If the payment history was successfully updated
            console.log('Payment history updated successfully');
            document.cookie = "authenticated=true; path=/";  // Set the authenticated cookie
            window.location = 'index.html';
        } else {
            // Handle failure to update payment history
            console.error('Failed to update payment history:', paymentHistoryData.message);
            alert(paymentHistoryData.message);
        }
    } else {
        alert(data.message);
    }
  } catch (error) {
    console.error('Error during payment submission:', error);
    alert('An error occurred while processing your payment.');
  }
}


async function savePaymentClicked() { //Executes once save is clicked on the addpayment page

  const dataToInsert = {
    cardName: document.getElementById('cardName').value.trim(),
    cardNumber: document.getElementById('cardNumber').value.trim(),
    cardExpiry: document.getElementById('cardExpiry').value.trim(),
    cardCVV: document.getElementById('cardCVV').value.trim(),
    cardNickname: document.getElementById('cardNickname').value.trim(),
    addressCountry: document.getElementById('addressCountry').value.trim(),
    addressState: document.getElementById('stateDropdown').value.trim(),
    addressCity: document.getElementById('addressCity').value.trim(),
    addressZip: document.getElementById('addressZip').value.trim(),
    addressStreet: document.getElementById('addressStreet').value.trim(),
  };

  // validate the data
  if (isValidData(dataToInsert)) {
    try {
      // You need to await the fetch call to complete
      let response = await fetch('http://localhost:5000/payments/addpayment', {
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
      alert('An error occurred while processing your payment.');
    }
  } else {
    alert('Please fill in all the fields');
  }
  

}
