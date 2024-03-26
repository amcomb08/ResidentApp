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

function getPaymentsMadeThisMonth() {
  fetch('http://localhost:5000/payments/getPaymentsMadeThisMonth', {
      credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
      const paymentText = document.getElementById('averagePaymentValue');
      
      if (data.success && data.paymentsMadeThisMonth && data.paymentsMadeThisMonth.length > 0) {
        console.log(data.paymentsMadeThisMonth);
          // Calculate the average of all payment amounts
          const total = data.paymentsMadeThisMonth.reduce((acc, curr) => {
            // Parse the Amount as a float to ensure it's a number
            const amount = parseFloat(curr.Amount);
            // Check if the amount is a number, if not, just return the accumulator
            return isNaN(amount) ? acc : acc + amount;
          }, 0);
          paymentText.textContent = `$${total.toFixed(2)}`;
      } else {
          paymentText.textContent = '$0';
      }
  })
  .catch(error => {
      console.error('Error:', error);
      document.getElementById('averagePaymentValue').textContent = '$0';
  });
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
  let dropdown = document.getElementById('paymentDropdown');
  let selectedOption = dropdown.options[dropdown.selectedIndex];
  
  let paymentMethod = dropdown.value.trim();
  let paymentNameOnCard = selectedOption.getAttribute('data-name-on-card');
  let paymentCardNumber = selectedOption.getAttribute('data-card-number'); 
  
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
                paymentNameOnCard,
                paymentCardNumber,
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
            document.cookie = "authenticated=true; path=/";
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

function loadPaymentMethods() {
  
  // Fetch the payment method nicknames from the server
  fetch('http://localhost:5000/payments/getPaymentMethods', {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.paymentMethods) {
      const paymentMethods = [];
      
      data.paymentMethods.forEach(paymentMethodData => {
        // Extract the last four digits of the CardNum
        const lastFour = paymentMethodData.CardNum.slice(-4);
        // Construct a payment method object
        const paymentMethod = {
          type: 'Card', 
          cardID: paymentMethodData.CardID,
          lastFour: lastFour,
          expiry: paymentMethodData.Expiry 
        };
        // Push the payment method object into the array
        paymentMethods.push(paymentMethod);
      });
      
      const container = document.getElementById('paymentMethodsContainer');
      paymentMethods.forEach(method => {
        const methodHTML = `
          <div class="pb-6 mb-6 border-b border-gray-400">
            <div class="flex flex-wrap items-center justify-between -mx-4 -mb-5">
              <div class="w-full sm:w-auto px-4 mb-5">
                <div class="flex items-center">
                  <img class="h-24 w-34 mr-4 self-start" src="./images/CardImage.png" alt="${method.type} Logo">
                  <div>
                    <h5 class="text-sm text-gray-100 leading-5 font-semibold">${method.type} ending in ${method.lastFour}</h5>
                    <span class="text-xs text-gray-300 font-medium">Expires ${method.expiry}</span>
                  </div>
                </div>
              </div>
              <div class="w-full sm:w-auto px-4 mb-5">
              <button class="inline-block ml-auto px-2 py-1 text-xs leading-6 text-gray-200 font-bold bg-gray-600 hover:bg-gray-700 rounded-lg transition duration-100" onclick="deletePaymentMethod(${method.cardID})">Delete</button>
              </div>
            </div>
          </div>
        `;
        container.innerHTML += methodHTML; // Append the new card HTML
      });
    } else {
      console.error(data.message);
    }
  })
  .catch(error => console.error('Error:', error));

}

function loadPaymentHistory() { 
  // Fetch the payment method nicknames from the server
  fetch('http://localhost:5000/payments/getPaymentHistory', {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.paymentHistory) {
      const paymentHistoryData = [];
      
      data.paymentHistory.forEach(paymentHistoryEntry => {
        const lastFour = paymentHistoryEntry.CardNum.slice(-4);
        const paymentHistory = {
          amount: paymentHistoryEntry.Amount,
          nameOnCard: paymentHistoryEntry.NameOnCard, 
          date: paymentHistoryEntry.Date,
          status: paymentHistoryEntry.Status,
          cardNum: lastFour 
        };
        paymentHistoryData.push(paymentHistory);
      });
      
        const ledgerDiv = document.getElementById('paymentLedgerContainer');; 

        // Create a container for the payment history entries
        const historyContainer = document.createElement('div');
        historyContainer.className = 'payment-history';

        // Iterate over the payment history array
        paymentHistoryData.forEach(payment => {
          const paymentEntry = document.createElement('div');
          paymentEntry.className = 'payment-entry';

          // Assuming each payment object has `amount`, `date`, and `description` properties
          paymentEntry.innerHTML = `
          <div class="flex flex-col sm:flex-row justify-between text-gray-100 mb-2">
            <span class="mb-1 sm:mb-0">${payment.date.substring(0, 10)}</span>
            <span class="mb-1 sm:mb-0">${payment.nameOnCard}</span>
            <span class="mb-1 sm:mb-0">${payment.cardNum}</span>
            <span class="mb-1 sm:mb-0">${payment.status}</span>
            <span>$${parseFloat(payment.amount).toFixed(2)}</span>
          </div>
        `;
          // Append the payment entry to the history container
          historyContainer.appendChild(paymentEntry);
        });

        // Append the history container to the ledger div
        ledgerDiv.appendChild(historyContainer);
    } else {
      console.error(data.message);
    }
  })
  .catch(error => console.error('Error:', error));
}

function deletePaymentMethod(cardID) {
  console.log('Deleting payment method with CardID:', cardID);

  // Fetch the payment method nicknames from the server
  fetch('http://localhost:5000/payments/deletePaymentMethod', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({cardID}),
    credentials: 'include' 
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.paymentMethods) {
      window.location.href = 'ledger.html';
    } else {
      console.error(data.message);
    }
  })
  .catch(error => console.error('Error:', error));
}

function validCardInfo(data) {
  let isValid = true;
  
  // Validate card number (assuming 16 digits)
  const cardNumberRegex = /^\d{16}$/;
  if (!cardNumberRegex.test(data.cardNumber)) {
    alert("Please enter a valid 16-digit card number.");
    isValid = false;
  }
  
  // Validate expiry date (MM/YY)
  const expiryRegex = /^\d{2}\/\d{2}$/;
  if (!expiryRegex.test(data.cardExpiry)) {
    alert("Please enter a valid expiry date in MM/YY format.");
    isValid = false;
  }
  
  // Validate CVV (3 or 4 digits)
  const cvvRegex = /^\d{3,4}$/;
  if (!cvvRegex.test(data.cardCVV)) {
    alert("Please enter a valid CVV (3 or 4 digits).");
    isValid = false;
  }

  return isValid;
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

  let validCard = validCardInfo(dataToInsert);

  // validate the data
  if (isValidData(dataToInsert)) {
    if(validCard){
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
      console.log("Card information is invalid. Halting operations.");
    }
  }
  else{
    alert('Please fill out all fields');
  }
}
