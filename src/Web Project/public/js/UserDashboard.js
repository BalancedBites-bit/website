
function toggleEditMode() {
    const details = document.querySelector('.details');
    const editForm = document.querySelector('.edit-form');
    const btnContainer = document.querySelector('.btn-container');
    const header = document.querySelector('h1');
    details.style.display = 'none';
    editForm.style.display = 'block';
    btnContainer.style.display = 'none';
    header.textContent = 'Edit Details';
}

function toggleViewMode() {
    const details = document.querySelector('.details');
    const editForm = document.querySelector('.edit-form');
    const btnContainer = document.querySelector('.btn-container');
    const header = document.querySelector('h1');
    
    // Retrieve the updated values from the form fields
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    
    // Update the header with the updated values
    header.textContent = `${firstName} ${lastName}`;
    
    // Toggle visibility
    details.style.display = 'block';
    editForm.style.display = 'none';
    btnContainer.style.display = 'flex';
}
