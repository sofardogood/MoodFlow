// checkAuth.js
(function () {
    function check() {
        const user = localStorage.getItem('moodflow_user');
        if (!user) {
            // Current path
            const path = window.location.pathname.split('/').pop() || 'index.html';
            // Redirect to login if on protected page
            // (Assuming this script is only included in protected pages like admin.html, dashboard.html, presenter.html)
            window.location.href = `login.html?redirect=${path}`;
        }
    }

    // Run on initial load
    check();

    // Run on back/forward navigation (BFCache)
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
            check();
        } else {
            // Some browsers (like Safari/Chrome) might not set persisted=true always on back button
            // lightly, so we can run check() anyway or double check.
            check();
        }
    });
})();
