document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    const courseDetailsUrl = `https://hstu-six.vercel.app/api/courses/${courseId}`;
    const coursesListUrl = 'https://hstu-six.vercel.app/api/courses/';
    const enrollUrl = 'https://hstu-six.vercel.app/api/enrollments/';
    const paymentUrl = `https://hstu-six.vercel.app/api/initiate-payment/${courseId}/`;
    const enrollButton = document.getElementById('enroll-button');

    initializePage();

    function initializePage() {
        setStaticCourseMeta();
        fetchCourseDetails(courseId);
        fetchAndRenderCourseList();

        enrollButton.addEventListener('click', function () {
            initiatePayment(courseId);
        });

        document.getElementById('department-filter').addEventListener('change', function () {
            fetchAndRenderCourseList(this.value);
        });
    }

    // Set static metadata (similar to your existing function)
    function setStaticCourseMeta() {
        // ... Your existing static meta code ...
    }

    // Fetch course details
    function fetchCourseDetails(courseId) {
        fetch(courseDetailsUrl)
            .then(response => response.json())
            .then(data => {
                // Populate course data on the page
                document.getElementById('course-title').textContent = data.title;
                document.getElementById('course-description').textContent = data.description;
                const imageUrl = data.image_url ? data.image_url : 'default-image-url';
                document.getElementById('course-img').src = imageUrl;
            })
            .catch(error => console.error('Error fetching course details:', error));
    }

    function fetchAndRenderCourseList(filterDepartment = '') {
        let url = coursesListUrl;
        if (filterDepartment) {
            url += `?department=${encodeURIComponent(filterDepartment)}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const courseListContainer = document.getElementById('course-list');
                courseListContainer.innerHTML = '';
                data.forEach(course => {
                    const courseCard = `
                        <div class="course-card">
                            <img src="${course.image_url || 'default-course-image.jpg'}" alt="${course.title}">
                            <h3>${course.title}</h3>
                            <p>${course.description}</p>
                            <a href="course_details.html?id=${course.id}" class="enroll-now">Enroll Now</a>
                        </div>
                    `;
                    courseListContainer.insertAdjacentHTML('beforeend', courseCard);
                });
            })
            .catch(error => console.error('Error fetching course list:', error));
    }

    function initiatePayment(courseId) {
        const authToken = localStorage.getItem('auth_token');
    
        if (!authToken) {
            showModal('Please log in to proceed with payment and enrollment.', 'login.html');
            return;
        }

        fetch(paymentUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ course: courseId })
        })
        .then(response => response.json())
        .then(paymentData => {
            if (paymentData.payment_url) {
                window.location.href = paymentData.payment_url; // Redirect to payment page
            } else {
                showModal('Payment failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error initiating payment:', error);
            showModal('An error occurred while initiating payment.');
        });
    }

    function enrollInCourse(courseId) {
        const authToken = localStorage.getItem('auth_token');
        const csrfToken = getCookie('csrftoken');

        fetch(enrollUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
                'Authorization': `Token ${authToken}`
            },
            body: JSON.stringify({ course: courseId })
        })
        .then(response => response.json())
        .then(data => {
            showModal('You have successfully enrolled in the course!');
        })
        .catch(error => {
            console.error('Error enrolling in course:', error);
            showModal('Failed to enroll. You may have already enrolled in this course.');
        });
    }

    // Modal and helper functions
    const modal = document.getElementById('enrollment-modal');
    const closeBtn = document.querySelector('.modal .close');

    function showModal(message, redirectUrl = null) {
        const modalMessage = document.getElementById('modal-message');
        modalMessage.textContent = message;
        modal.style.display = 'block';

        if (redirectUrl) {
            setTimeout(() => window.location.href = redirectUrl, 2000);
        }
    }

    closeBtn.onclick = function () {
        modal.style.display = 'none';
    };

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie) {
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
                const [key, value] = cookie.trim().split('=');
                if (key === name) cookieValue = decodeURIComponent(value);
            });
        }
        return cookieValue;
    }
});
