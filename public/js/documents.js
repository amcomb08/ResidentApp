async function uploadDocument(file) {
    const config = await fetchConfig();
    const formData = new FormData();
    formData.append('filephoto', file);
  
    let response = await fetch(`${config.CONNECTION_STRING}/document/upload-document`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });
  
    let data = await response.json();
  
    if (data.success) {
      console.log('Document uploaded and reference saved', data.blobUrl);
      window.location.href = 'documents.html';
    } else {
      alert(data.message);
    }
}

async function fetchAndDisplayUserDocuments() {
    try {
        const config = await fetchConfig();
        const response = await fetch(`${config.CONNECTION_STRING}/document/user-documents`);
        const documents = await response.json();

        const documentsContainer = document.querySelector('.bg-gray-500'); // The main div where you want to display the documents

        documents.forEach(doc => {
            // Create a wrapper div for the document
            const docWrapper = document.createElement('div');
            docWrapper.className = 'flex flex-wrap py-1 px-4 items-center justify-between bg-gray-600 rounded-md';

            // Create elements for each document
            const docElement = document.createElement('div');
            docElement.className = 'p-1.5';

            const docNameElement = document.createElement('h5');
            docNameElement.className = 'text-sm leading-none font-semibold text-gray-50'; // Changed text color for better contrast on light bg
            docNameElement.textContent = doc.name;

            const docLinkElement = document.createElement('a');
            docLinkElement.href = doc.url;
            docLinkElement.textContent = 'Download Document';
            docLinkElement.className = 'text-xs leading-none text-blue-600 font-medium'; // Styling for the link on light bg

            // Append elements to the wrapper div
            docElement.appendChild(docNameElement);
            docElement.appendChild(docLinkElement);
            docWrapper.appendChild(docElement);

            // Append the wrapper div to the main container div
            documentsContainer.appendChild(docWrapper);
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
    }
}