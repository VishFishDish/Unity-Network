//Function to navigate to the selected page
function navigateToPage(page) {
    //Hides all the sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    //Shows the selected page
    document.getElementById(page).style.display = 'block';

    // Shows or hides the manual backup button based on the selected page
    if (page === 'add-partner') {
        document.getElementById('manualBackupButton').style.display = 'block';
    } else {
        document.getElementById('manualBackupButton').style.display = 'none';
    }

    if (page === 'qa') {
        document.getElementById('answer').innerHTML = '';
    }
}

//Function to delete partners
function deletePartner(partnerId) {
    if (confirm('Are you sure you want to delete this partner?')) {
        fetch(`/delete-partner/${partnerId}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            displayAllPartners();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the partner.');
        });
    }
}


//Event listener for page navigation dropdown
document.getElementById('pageSelect').addEventListener('change', function() {
    const selectedPage = this.value;
    navigateToPage(selectedPage);
});

//Function to display all partners
function displayAllPartners() {
    fetch('/search')
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch partners.');
        }
        return response.json();
    })
    .then(data => {
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = ''; //Clear previous results
        if (data.error) {
            //Display error message
            displayError(data.error);
        } else if (data.length === 0) {
            //If no results found
            displayError('No partners found.');
        } else {
            //Create table to display all partners
            const table = createTable(data);
            searchResults.appendChild(table);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while fetching partners.');
    });
}

//Function to create a table from partner data
function createTable(data) {
    const table = document.createElement('table');
    table.innerHTML = `
        <tr>
            <th>Number</th>
            <th>Name</th>
            <th>Type</th>
            <th>Resources</th>
            <th>Contact Info</th>
            <th>Actions</th>
        </tr>
    `;
    data.forEach((partner, index) => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${partner.name}</td>
            <td>${partner.type}</td>
            <td>${partner.resources}</td>
            <td>${partner.contact_info}</td>
            <td>
                <button onclick="deletePartner(${partner.id})">Delete</button>
            </td>
        `;
    });
    return table;
}

//Call displayAllPartners function when the page loads
document.addEventListener('DOMContentLoaded', displayAllPartners);

//Function to search for partners
function searchPartners() {
    const query = document.getElementById('searchInput').value;
    fetch(`/search?query=${encodeURIComponent(query)}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to search for partners.');
        }
        return response.json();
    })
    .then(data => {
        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = ''; //Clear previous results
        if (data.error) {
            //Display error message
            displayError(data.error);
        } else if (data.length === 0) {
            //If no results found
            displayError('No results found. Please try again.');
        } else {
            //Creates a table to display search results
            const table = document.createElement('table');
            table.innerHTML = `
                <tr>
                    <th>Number</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Resources</th>
                    <th>Contact Info</th>
                    <th>Actions</th>
                </tr>
            `;
            data.forEach((partner, index) => {
                const row = table.insertRow();
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${partner.name}</td>
                    <td>${partner.type}</td>
                    <td>${partner.resources}</td>
                    <td>${partner.contact_info}</td>
                    <td>
\                        <button onclick="deletePartner(${partner.id})">Delete</button>
                    </td>
                `;
            });
            searchResults.appendChild(table);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while searching for partners.');
    });
}

//Call searchPartners function when the search button is clicked
document.getElementById('searchButton').addEventListener('click', searchPartners);

//Function to ask a question
function askQuestion() {
    const question = document.getElementById('questionInput').value;
    fetch(`/qa?question=${encodeURIComponent(question)}`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('answer').innerHTML = data.answer;
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('answer').innerHTML = 'Failed to get an answer. Please try again.';
    });
}

//Event listener for ask button
document.getElementById('askButton').addEventListener('click', askQuestion);

//Function for manual backup
function manualBackup() {
    fetch('/manual_backup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        alert('Backup performed successfully and saved to backups folder.');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Backup failed. Please try again.');
    });
}

//Event listener for manual backup button
document.getElementById('manualBackupButton').addEventListener('click', manualBackup);

//Event listener for adding a new partner form
document.getElementById('addPartnerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const type = document.getElementById('type').value.trim();
    const resources = document.getElementById('resources').value.trim();
    const contactInfo = document.getElementById('contactInfo').value.trim();

    //Syntactic validation for inputs
    if (!name || !type || !resources || !contactInfo) {
        alert('Please fill out all fields.');
        return;
    }

    //Semantic validation for email or phone number format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
    if (!emailRegex.test(contactInfo) && !phoneRegex.test(contactInfo)) {
        alert('Invalid contact information format. Please enter a valid email address or a 10-digit phone number.');
        return;
    }

    const data = {
        name,
        type,
        resources,
        contact_info: contactInfo
    };
    fetch('/add_partner', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.success);
        document.getElementById('addPartnerForm').reset(); 
        //Resets form after submission
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while adding the partner.');
    });
});

//Initial page load
navigateToPage('add-partner'); // Set the default page to "Add a New Partner"

//Center and adjust position of the page navigation dropdown menu
const pageSelect = document.getElementById('pageSelect');
pageSelect.style.position = 'absolute';
pageSelect.style.left = '50%';
pageSelect.style.transform = 'translateX(-50%)';
pageSelect.style.marginTop = '20px'; 