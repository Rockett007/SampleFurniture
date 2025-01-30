document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.flex_img');
   

    containers.forEach(container => {
        const tooltip = container.querySelector('.overspan');

        if (container && tooltip) {
            container.addEventListener('mousemove', (e) => {
                tooltip.style.display = 'block';
                tooltip.style.left = e.clientX + 10 + 'px';
                tooltip.style.top = e.clientY + 10 + 'px';
            });
    
            container.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }
    });
});
