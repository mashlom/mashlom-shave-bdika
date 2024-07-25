document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    const initialContent = document.querySelector('.welcome-content');
    const afterClickContent = document.querySelector('.content-after-click');
    const calculateButton = document.querySelector('.welcome-left .custom-btn');

    console.log('Calculate button:', calculateButton);

    if (calculateButton) {
        calculateButton.addEventListener('click', function() {
            console.log('Button clicked');
            initialContent.style.display = 'none';
            afterClickContent.style.display = 'block';
        });
    } else {
        console.error('Calculate button not found');
    }
});

// Fallback in case DOMContentLoaded doesn't fire
window.onload = function() {
    console.log('Window loaded');
    const calculateButton = document.querySelector('.welcome-left .custom-btn');
    if (calculateButton && !calculateButton.hasAttribute('data-listener-attached')) {
        calculateButton.addEventListener('click', function() {
            console.log('Button clicked (from window.onload)');
            document.querySelector('.welcome-content').style.display = 'none';
            document.querySelector('.content-after-click').style.display = 'block';
        });
        calculateButton.setAttribute('data-listener-attached', 'true');
    }
};