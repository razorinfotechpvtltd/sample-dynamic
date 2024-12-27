(async () => {
    const token = localStorage.getItem('workspaceToken'); // Fetch token from localStorage
    if (!token) {
        alert('Unauthorized. Please log in.');
        window.location.href = '/'; // Redirect to login page
        return;
    }

    try {
        // Validate token and fetch user-specific data
        const response = await fetch('/api/dashboard', {
            method: 'GET', // Use GET for fetching dashboard details
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Pass token in the Authorization header
            },
        });

        const data = await response.json();

        if (data.success) {
            // Populate the dashboard with user data
          
            document.getElementById('userName').textContent = data.data.name;
            document.getElementById('userEmail').textContent = data.data.email;
            document.getElementById('domainName').textContent = data.data.domainName;
        } else {
            // Handle token expiration or invalid token
            alert(data.message || 'Session expired. Please log in again.');
            localStorage.removeItem('workspaceToken'); // Clear invalid token
            window.location.href = '/'; // Redirect to login page
        }
    } catch (error) {
        console.error('Error validating token:', error);
        alert('An unexpected error occurred. Please log in again.');
        localStorage.removeItem('workspaceToken'); // Clear token on error
        window.location.href = '/'; // Redirect to login page
    }
})();

// Logout functionality
document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('workspaceToken'); // Clear token
    window.location.href = '/'; // Redirect to login page
});
