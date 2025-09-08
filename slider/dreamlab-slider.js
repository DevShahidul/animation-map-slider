(function(){
    "use strict";

    let dragableSliderInitilize = false;
    let dragableSliderInstance = null;

    document.addEventListener("DOMContentLoaded", () => {
        const dragableSliderSection = document.querySelector(".dreamlab-dragable-slider-section");
        if (!dragableSliderSection) return;

        initializeDragableSlider();
    })


    function initializeDragableSlider(){

        if(dragableSliderInitilize) return;
        dragableSliderInitilize = true;

        dragableSliderInstance = new Swiper(".dragable-swiper-slider", {
            spaceBetween: 32,
            slidesPerView: 1,
            allowTouchMove: true,
            grabCursor: true,
            breakpoints: {
                640: {
                    slidesPerView: 2
                },
                1024: {
                    slidesPerView: 3
                },
                1280: {
                    slidesPerView: 4
                },
            },
            on: {
                init: function () {

                    setTimeout(() => {
                        const slides = this.slides;
                        const activeIndex = this.activeIndex;
                        const activeSlide = slides[activeIndex];
    
                        addExpandOnFirstItem(activeSlide);
                        initializeHoverOnslide(slides);
                    }, 1000);
                }
            }
        });
    }

    function initializeHoverOnslide(slides){
        if(!slides) return;
        if(slides){
            slides.forEach(slide => {
                const slideWidth = slide.offsetWidth;
                setWidthProperty(slide, slideWidth);

                slide.addEventListener('mouseenter', () => {
                    if(hasClass(slide, 'expanded')) return;
                    // Remove "expanded" from all slides
                    slides.forEach((s) => {
                        s.classList.remove('expanded');
                        s.style.width = `${slideWidth / 16}rem`;
                    });


                    // Add "expanded" to the hovered one
                    slide.classList.add('expanded');
                    slide.style.width = `${(slideWidth * 2) / 16}rem`;
                });
            });
        }
    }

    function addExpandOnFirstItem(activeItem){
        const slideWidth = activeItem.offsetWidth;
        activeItem.classList.add("expanded");
        activeItem.style.width = `${(slideWidth * 2) / 16}rem`;
    }

    function setWidthProperty(el, width){
        el.style.setProperty("--item-width", `${width / 16}rem`);
    }

    function hasClass(el, className) {
        return el.classList.contains(className);
    }


})();