let currentSlide = 1;
const totalSlides = 8;
const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const pageIndicator = document.getElementById('page-indicator');

function showSlide(slideNumber) {
    slides.forEach(slide => slide.classList.remove('active'));
    document.getElementById(`slide${slideNumber}`).classList.add('active');
    pageIndicator.textContent = `${slideNumber} / ${totalSlides}`;
}

function nextSlide() {
    if (currentSlide < totalSlides) {
        currentSlide++;
        showSlide(currentSlide);
    }
}

function prevSlide() {
    if (currentSlide > 1) {
        currentSlide--;
        showSlide(currentSlide);
    }
}

prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);

// 键盘导航
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
    } else if (e.key === 'ArrowLeft') {
        prevSlide();
    }
});

// 初始化
showSlide(currentSlide);