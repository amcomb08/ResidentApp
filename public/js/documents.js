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
        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }
        const documents = await response.json();

        const documentsContainer = document.querySelector('.bg-gray-500');

        documents.forEach(doc => {
            const docWrapper = document.createElement('div');
            docWrapper.className = 'flex flex-wrap py-1 px-4 items-center justify-between bg-gray-600 rounded-md';
        
            const docElement = document.createElement('div');
            docElement.className = 'p-1.5';
        
            const docNameElement = document.createElement('h5');
            docNameElement.className = 'text-sm leading-none font-semibold text-gray-50';
            docNameElement.textContent = doc.name;
        
            // Create download button
            const downloadButton = document.createElement('a');
            downloadButton.className = 'text-xs leading-none text-blue-600 font-medium cursor-pointer';
            downloadButton.textContent = 'Download Document';
            const downloadUrl = `${config.CONNECTION_STRING}/document/download/${encodeURIComponent(doc.name)}`;
            downloadButton.setAttribute('href', downloadUrl);
            downloadButton.setAttribute('download', doc.name);
        
            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'text-xs leading-none text-red-600 font-medium cursor-pointer';
            deleteButton.style.marginTop = '10px';
            deleteButton.style.padding = '10px';
            deleteButton.textContent = 'Delete Document';
            deleteButton.onclick = () => deleteDocument(doc.name, config); 
        
            docElement.appendChild(docNameElement);
            docElement.appendChild(downloadButton);
            docElement.appendChild(deleteButton);
            docWrapper.appendChild(docElement);
        
            documentsContainer.appendChild(docWrapper);
        });
        
    } catch (error) {
        console.error('Error fetching documents:', error);
    }
}

async function deleteDocument(documentName, config) {
    try {
        const response = await fetch(`${config.CONNECTION_STRING}/document/delete/${encodeURIComponent(documentName)}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            window.location.href = 'documents.html';
        } else {
            alert('Failed to delete the document.');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
    }
}