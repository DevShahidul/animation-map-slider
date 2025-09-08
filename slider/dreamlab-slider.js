(function () {
  "use strict";

  let draggableSliderInitilize = false;
  let draggableSliderInstance = null;
  let baseSlideWidth = null;
  let pointerInitialized = false;

  document.addEventListener("DOMContentLoaded", () => {
    const draggableSliderSection = document.querySelector(
      ".dreamlab-draggable-slider-section"
    );
    if (!draggableSliderSection) return;

    initializedraggableSlider();
  });

  function initializedraggableSlider() {
    if (draggableSliderInitilize) return;
    draggableSliderInitilize = true;

    draggableSliderInstance = new Swiper(".draggable-swiper-slider", {
      spaceBetween: 32,
      slidesPerView: 1,
      allowTouchMove: true,
      grabCursor: false,
      breakpoints: {
        640: {
          slidesPerView: 2,
        },
        1024: {
          slidesPerView: 3,
        },
        1280: {
          slidesPerView: 4,
        },
      },
      on: {
        init: function () {
          const slides = this.slides;
          const activeIndex = this.activeIndex;
          const activeSlide = slides[activeIndex];
          baseSlideWidth = activeSlide.offsetWidth;

          setTimeout(() => {
            addExpandOnFirstItem(activeSlide);
            initializeHoverOnslide(slides);
            if (!pointerInitialized) {
                initializePointerEffect(this);
                pointerInitialized = true;
            }
          }, 100);
        },
        touchStart: function() {
            handleDragStart();
        },
        touchEnd: function() {
            handleDragEnd();
        },
        sliderFirstMove: function() {
            handleDragMove();
        }
      },
    });
  }

  function initializeHoverOnslide(slides) {
    if (!slides) return;

    slides.forEach((slide) => {
      const slideWidth = slide.offsetWidth;
      setWidthProperty(slide, slideWidth);

      slide.addEventListener("mouseenter", () => {
        if (hasClass(slide)) return;
        // Remove "expanded" from all slides
        slides.forEach((s) => {
          s.classList.remove("expanded");
          s.style.width = `${slideWidth / 16}rem`;
        });

        // Add "expanded" to the hovered one
        slide.classList.add("expanded");
        slide.style.width = `${(slideWidth * 2) / 16}rem`;
      });
    });
  }

  function addExpandOnFirstItem(activeItem) {
    const slideWidth = activeItem.offsetWidth;
    activeItem.classList.add("expanded");
    activeItem.style.width = `${(slideWidth * 2) / 16}rem`;
  }

  function setWidthProperty(el, width) {
    el.style.setProperty("--item-width", `${width / 16}rem`);
  }

  function hasClass(el, className = "expanded") {
    return el.classList.contains(className);
  }

  function initializePointerEffect() {
    const pointer = document.getElementById("pointer");
    const slider = document.querySelector(".draggable-swiper-slider");

    if(!pointer || !slider) {
        console.warn("Pointer or slider element not found")
        return;
    }

    // Create spans for letters "a" and "g"
    const pointerText = pointer.querySelector(".pointer-text");

    if(!pointerText) {
        console.warn("Pointer text element not found");
        return;
    }

    // Initialize with "ag" letters
    initializePointerText(pointerText);
    

    // State tracking
    let isDragging = false;
    let isHovering = false;

    // Scale in pointer on hover
    slider.addEventListener("mouseenter", (e) => {
        isHovering = true;
      gsap.to(pointer, {
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)",
      });
    });

    // Scale out on leave
    slider.addEventListener("mouseleave", (e) => {
        isHovering = false;
        isDragging = false;

      gsap.to(pointer, {
        scale: 0,
        duration: 0.3,
        ease: "back.in(1.7)",
      });

      // Reset text on leave
      setTimeout(() => {
          setPointerTextToDrag(pointerText);
      }, 100);

    });

    // Move pointer with mouse
    slider.addEventListener("mousemove", (e) => {
        if(!isHovering) return;

      const rect = slider.getBoundingClientRect();
      const x = e.clientX - rect.left - pointer.offsetWidth / 2;
      const y = e.clientY - rect.top - pointer.offsetHeight / 2;

      gsap.to(pointer, {
        x: x,
        y: y,
        duration: 0.2,
        ease: "power2.out",
      });
    });

    // Golbal drag handles that work with swiper events
    window.handleDragStart = function() {
        if(!isHovering) return;
        isDragging = true;
        animateToDropDrag(pointerText);
    };

    window.handleDragMove = function() {
        if(!isHovering) return;
        if(!isDragging) {
            isDragging = true;
            animateToDropDrag(pointerText);
        }
    };

    window.handleDragEnd = function() {
        if(!isHovering) return;
        isDragging = false;
        setTimeout(() => {
            setPointerTextToDrag(pointerText);
        }, 100)
    };

    // Fallback mose events for non-touch devices
    
    slider.addEventListener("mousedown", (e) => {
        if(!isHovering) return;
      isDragging = true;
      animateToDropDrag(pointerText);
    });

    
    document.addEventListener("mouseup", (e) => {
        if(isDragging && isHovering) {
            isDragging = false;
            setTimeout(() => {
                setPointerTextToDrag(pointerText);
            }, 100);
        } 
    })
    
  }

    // Initialize pointer text with "ag" letters
  function initializePointerText(pointerText) {

    const existingAG = pointerText.querySelector(".animated-ag");
    const existingOP = pointerText.querySelector(".animated-op");

    if(existingAG) existingAG.remove();
    if(existingOP) existingOP.remove();

    // Create and add "ag" element
    const animatedAG = document.createElement("span");
    animatedAG.classList.add("animated-ag", "d-inline-flex");
    animatedAG.innerHTML = "<span>a</span><span>g</span>";
    pointerText.appendChild(animatedAG);

    // Set initial state
    gsap.set(animatedAG.children, {
        y: 0,
        opacity: 1
    })
  }

  // Animate text to "Drop Drag"
  function animateToDropDrag(pointerText) {
    const existingOP = pointerText.querySelector(".animated-op");
    if(existingOP) existingOP.remove();

    const ag = pointerText.querySelector(".animated-ag")

    // Animate out "ag" letters (reverse animation)
    if(ag && ag.children.length > 0) {
        gsap.to([...ag.children], {
            y: 25,
            opacity: 0,
            duration: 0.3,
            stagger: 0.05,
            ease: "power2.in",
            onComplete: () => {
                ag.remove();
            }
        })
    }

    // Create and add "op" letters
    const animatedOP = document.createElement("span");
    animatedOP.classList.add("animated-op", "d-inline-flex");
    animatedOP.innerHTML = "<span>o</span><span>p</span>";

    // Insert after static "dr" element
    const staticDr = pointerText.querySelector(".static-dr");
    if(staticDr){
        staticDr.parentNode.insertBefore(animatedOP, staticDr.nextSibling);
    } else {
        pointerText.appendChild(animatedOP);
    }

    // Animate in "op" letters with stagger
    gsap.fromTo(animatedOP.children, {
        y: -25,
        opacity: 0,
    },
    {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.in",
    });
  }

  // Reset to original "Drag"
    function setPointerTextToDrag(pointerText) {
      const op = pointerText.querySelector(".animated-op");
      const existingAG = pointerText.querySelector(".animated-ag");
      
      // Animate out "op" letters if they exist
      if (op && op.children.length > 0) {
        gsap.to(op.children, {
          y: -25,
          opacity: 0,
          duration: 0.3,
          stagger: 0.05,
          ease: "power2.in",
          onComplete: () => {
            op.remove();
          },
        });
      }

      // Restore "ag" if missing
      if (!existingAG) {
        setTimeout(() => {
            const animatedAG = document.createElement("span");
            animatedAG.classList.add("animated-ag");
            animatedAG.innerHTML = "<span>a</span><span>g</span>";
            pointerText.appendChild(animatedAG);
    
            gsap.fromTo([...animatedAG.children],{
                y: 20,
                opacity: 0,
              },
              {
                y: 0,
                opacity: 1,
                duration: 0.3,
                stagger: 0.05,
                ease: "power2.out",
              }
            );

        }, 150);
      }
    }
})();
