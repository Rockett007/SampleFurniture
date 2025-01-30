console.log('We live');
document.addEventListener('DOMContentLoaded', () => {
 const imgContainers = document.querySelectorAll('.img-container');

 const checkVisibility = () => {
    imgContainers.forEach(container => {
        const rect = container.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >=0;

        if (isVisible) {
            container.style.opacity = 1;
        }else{ 
            container.style.opacity = 0;
        }

        
    });
 };
 
 window.addEventListener('scroll', checkVisibility);
 checkVisibility();
});