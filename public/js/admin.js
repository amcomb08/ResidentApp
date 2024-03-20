function isValidData(data) {

    for (const key in data) {
      if (data[key] === '') {
        return false;
      }
    }
  
    return true; 
  }

async function saveUserClicked() { //Executes once save is clicked on the addpayment page

    const dataToInsert = {
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
  
    // validate the data
    if (isValidData(dataToInsert)) {
      try {
        // You need to await the fetch call to complete
        let response = await fetch('http://localhost:5000/adminRoutes/addUser', {
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
        alert('An error occurred while processing your payment.');
      }
    } else {
      alert('Please fill in all the fields');
    }
  }