let parkingLots = [];

document.addEventListener('DOMContentLoaded', async function () {
    parkingLots = await fetchParkingData();

    const searchInput = document.getElementById('searchInput');
    const tableContainer = document.getElementById('tableContainer');
    const adminTableContainer = document.getElementById('adminTableContainer');
    const availabilityTable = document.getElementById('availabilityTable');
    const filterCheckboxes = Array.from(document.querySelectorAll('.filter-checkbox'));
    const formCheckboxes = Array.from(document.querySelectorAll('.form-checkbox'));
    const searchInputAdmin = document.getElementById('searchInputAdmin');
    const adminTable = document.getElementById('adminTable');
    const addForm = document.getElementById('addForm');
    const lotNameInput = document.getElementById('lotName');
    const lotNumberInput = document.getElementById('lotNumber');
    const totalSpacesInput = document.getElementById('totalSpaces');
    const sevenAmInput = document.getElementById('7am');
    const elevenAmInput = document.getElementById('11am');
    const twoPmInput = document.getElementById('2pm');
    const fourPmInput = document.getElementById('4pm');

    // Initialize tables on load based on page
    if (document.getElementById('availabilityTable')) {
        renderTable(parkingLots);
    }
    if (document.getElementById('adminTable')) {
        renderAdminTable(parkingLots);
    }

    // Event listeners for search inputs
    if (searchInput) {
        searchInput.addEventListener('input', () => renderTable(parkingLots))  // Call renderTable on search input change
    }
    if (searchInputAdmin) {
        searchInputAdmin.addEventListener('input', () => renderAdminTable(parkingLots));  // Call renderAdminTable on search input change
    }

    // Restrict to one day checkbox at a time
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                // Uncheck all other checkboxes
                filterCheckboxes.forEach(otherCheckbox => {
                    if (otherCheckbox !== this) {
                        otherCheckbox.checked = false;
                    }
                });
            }
            // Render the appropriate table after checkbox change
            if (document.getElementById('availabilityTable')) {
                renderTable(parkingLots);
            }
            if (document.getElementById('adminTable')) {
                renderAdminTable(parkingLots);
            }
        });
    });

    // Prevent interaction between add and filter checkboxes (for adding new lots)
    formCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                // Uncheck all other checkboxes
                formCheckboxes.forEach(otherCheckbox => {
                    if (otherCheckbox !== this) {
                        otherCheckbox.checked = false;
                    }
                });
            }
        });
    });

    // Fetch parking lot data
    async function fetchParkingData() {
        try {
            const response = await fetch('/api/parking-data');
            if (!response.ok) {
                throw new Error('Failed to fetch parking data');
            }
            const data = await response.json();
            console.log('Fetched parking data:', data);
            return data;
        } catch (error) {
            console.error('Error fetching parking data:', error);
            return [];
        }
    }

    // Render Availability Table
    async function renderTable(data) {
        const searchTerm = searchInput.value.toLowerCase();

        // Get the selected day from the checkboxes
        const selectedDay = filterCheckboxes.find(checkbox => checkbox.checked)?.value;

        // Clear the table
        availabilityTable.innerHTML = '';

        // If no day is selected, hide the table
        if (!selectedDay) {
            tableContainer.style.display = 'none';
            return;
        }

        // Filter the parking lots based on the search term
        const filteredLots = data.filter(lot =>
            lot.lotName.toLowerCase().includes(searchTerm) && lot.day === selectedDay
        );

        // If no parking lots match, hide the table
        if (filteredLots.length === 0) {
            tableContainer.style.display = 'none';
            return;
        }

        // Show the table if data is found
        tableContainer.style.display = 'block';

        // Loop through each filtered parking lot and render its data
        filteredLots.forEach(lot => {
            const row = document.createElement('tr');

            // Access the availability for the selected day
            const availabilityForSelectedDay = lot.availability || {};

            // Map through the time slots and display their availability
            const availabilityCells = ['7:00 am', '11:00 am', '2:00 pm', '4:00 pm']
                .map(timeSlot => {
                    // Get the availability for the time slot, default to 0% if not available
                    const available = availabilityForSelectedDay[timeSlot] || 0;
                    return `<td>${available}%</td>`;
                })
                .join('');

            // Add the row with the parking lot data and availability
            row.innerHTML = `
            <td>${lot.lotName}</td>
            <td>${lot.lotNumber}</td>
            <td>${lot.totalSpaces}</td>
            ${availabilityCells}
        `;
            availabilityTable.appendChild(row);
        });
    }


    // Render Admin Table
    async function renderAdminTable(data) {
        const searchTerm = searchInputAdmin.value.toLowerCase();

        // Get the selected day from the checkboxes
        const selectedDay = filterCheckboxes.find(checkbox => checkbox.checked)?.value;

        // Clear the table
        adminTable.innerHTML = '';

        // If no day is selected, hide the table
        if (!selectedDay) {
            adminTableContainer.style.display = 'none';
            return;
        }

        // Filter the parking lots based on the search term
        const filteredAdminLots = data.filter(lot =>
            lot.lotName.toLowerCase().includes(searchTerm) && lot.day === selectedDay
        );

        // If no parking lots match, hide the table
        if (filteredAdminLots.length === 0) {
            adminTableContainer.style.display = 'none';
            return;
        }

        // Show the table if data is found
        adminTableContainer.style.display = 'block';

        filteredAdminLots.forEach(lot => {
            const row = document.createElement('tr');

            // Access the availability for the selected day
            const availabilityForSelectedDay = lot.availability || {};

            // Map through the time slots and display their availability
            const availabilityCells = ['7:00 am', '11:00 am', '2:00 pm', '4:00 pm']
                .map(timeSlot => {
                    // Get the availability for the time slot, default to 0% if not available
                    const available = availabilityForSelectedDay[timeSlot] || 0;
                    return `<td>${available}%</td>`;
                })
                .join('');

            // Add the row with the parking lot data and availability
            row.innerHTML = `
            <td>${lot.lotName}</td>
            <td>${lot.lotNumber}</td>
            <td>${lot.totalSpaces}</td>
            ${availabilityCells}
            <td><button class="btn btn-danger delete-btn" data-id="${lot._id}">Delete</button></td>
        `;
            adminTable.appendChild(row);
        });

    }

    // Add event delegation to handle delete buttons outside renderAdminTable
    if (adminTable) {
        adminTable.addEventListener('click', async (event) => {
            if (event.target.classList.contains('delete-btn')) {
                const parkingLotId = event.target.getAttribute('data-id');

                try {
                    const response = await fetch(`/api/parking-data/${parkingLotId}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        alert('Parking lot deleted successfully!');
                        event.target.closest('tr').remove();
                        parkingLots = await fetchParkingData();
                        renderAdminTable(parkingLots);
                    } else {
                        const error = await response.json();
                        alert(`Error: ${error.message}`);
                    }
                } catch (err) {
                    console.error('Error deleting parking lot:', err);
                    alert('Failed to delete parking lot.');
                }
            }
        });
    }


    // Add new parking lot
    if (adminTable) {
        addForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const selectedDay = formCheckboxes.find(checkbox => checkbox.checked)?.value;
            const newLot = {
                lotName: lotNameInput.value,
                lotNumber: parseInt(lotNumberInput.value, 10),
                totalSpaces: parseInt(totalSpacesInput.value, 10),
                day: selectedDay,
                availability: {
                    '7:00 am': parseInt(sevenAmInput.value || 0, 10),
                    '11:00 am': parseInt(elevenAmInput.value || 0, 10),
                    '2:00 pm': parseInt(twoPmInput.value || 0, 10),
                    '4:00 pm': parseInt(fourPmInput.value || 0, 10),
                },
            }

            // Check if at least one checkbox is selected
            if (!selectedDay) {
                alert('Please select at least one day of availability.');
                return;
            }

            try {
                const response = await fetch('/api/parking-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newLot),
                });

                if (!response.ok) throw new Error('Failed to save the parking lot.');

                parkingLots = await fetchParkingData();
                alert('New lot added successfully!');
                addForm.reset();
                // Re-render the admin table with updated data
                renderAdminTable(parkingLots);
                adminTableContainer.style.display = 'block';
            } catch (error) {
                console.error('Error adding parking lot:', error);
                alert('Failed to add new parking lot. Please try again.');
            }

        });
    }


    document.getElementById('scrapeBtn').addEventListener('click', function () {
        // Send request to server to scrape parking data
        fetch('http://0.0.0.0:3000/scrape-parking-data')
            .then(response => response.text())
            .then(data => alert(data))
            .catch(error => alert('Error: ' + error));
    });

});