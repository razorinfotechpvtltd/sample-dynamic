document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Send a POST request to the login API
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json(); // Parse JSON response

        if (data.success) {
            // Store workspaceToken in localStorage
            localStorage.setItem('workspaceToken', data.workspaceToken);

            // Redirect to the dashboard
            alert('Login successful!');
            window.location.href = `dashboard.html`;
        } else {
            // Handle failure scenarios
            console.error('Error response:', data.message);
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An unexpected error occurred. Please try again.');
    }
});
