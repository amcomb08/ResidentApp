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
        window.location = 'index.html';
    } else {
        alert(data.message);
    }
}
