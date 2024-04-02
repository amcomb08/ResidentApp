function isValidData(data) {

    for (const key in data) {
      if (data[key] === '') {
        return false;
      }
    }
  
    return true; 
}

async function modifyUserClicked(action) {
  let dataToInsert = {};
  let endpoint = '';
    if(action === 'add'){
        dataToInsert = {
          FirstName: document.getElementById('userFN').value.trim(),
          LastName: document.getElementById('userLN').value.trim(),
          Email: document.getElementById('userEmail').value.trim(),
          Role: document.getElementById('userRole').value.trim(),
          ApartmentNumber: document.getElementById('userApartment').value.trim(),
          Phone: document.getElementById('userPhone').value.trim(),
          DefaultPass: document.getElementById('userPass').value.trim()
      };
      if(dataToInsert.Role === 'Admin'){
        dataToInsert.ApartmentNumber = null;
      }
      endpoint = 'addUser'
    }
    if(action === 'delete'){
      dataToInsert = {
          FirstName: document.getElementById('userFN').value.trim(),
          LastName: document.getElementById('userLN').value.trim(),
          Email: document.getElementById('userEmail').value.trim()
      };
      endpoint = 'deleteUser'
    }

    // validate the data
    if (isValidData(dataToInsert)) {
      try {
        // You need to await the fetch call to complete
        let response = await fetch('http://localhost:5000/adminRoutes/' + endpoint, {
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

function togglePaymentType(action) {
  const isMonthly = action === 'monthly';
  
  // Toggle form and message visibility
  document.getElementById('submitPaymentForm').style.display = isMonthly ? 'none' : 'block';
  document.getElementById('monthlyMessage').style.display = isMonthly ? 'block' : 'none';
  
  // Toggle highlight
  document.getElementById('monthlyPayment').classList.toggle('highlighted', isMonthly);
  document.getElementById('customPayment').classList.toggle('highlighted', !isMonthly);
}

async function submitMonthly(){
  try {
    // You need to await the fetch call to complete
    let response = await fetch('http://localhost:5000/adminRoutes/submitMonthly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

async function submitCustom() { 

    const dataToInsert = {
          DueDate: document.getElementById('paymentDueDate').value.trim(),
          AptNum: document.getElementById('paymentAptNum').value.trim(),
          Amount: document.getElementById('paymentAmount').value.trim(),
          Comment: document.getElementById('paymentComment').value.trim()
      };

    // validate the data
    if (isValidData(dataToInsert)) {
      try {
        let response = await fetch('http://localhost:5000/adminRoutes/submitCustom', {
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



