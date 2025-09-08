(function () {
  "use strict";

  // State management
  const state = {
    draggableSliderInitialized: false,
    draggableSliderInstance: null,
    baseSlideWidth: null,
    pointerInitialized: false,
    isDragging: false,
    isHovering: false,
  };

  // Configuration
  const config = {
    spaceBetween: 32,
    slideExpandMultiplier: 2,
    animationDurations: {
      hover: 0.3,
      pointer: 0.2,
      textTransition: 0.3,
      textStagger: 0.05,
    },
    selectors: {
      sliderSection: ".dreamlab-draggable-slider-section",
      swiper: ".draggable-swiper-slider",
      pointer: "#pointer",
      pointerText: ".pointer-text",
      staticDr: ".static-dr",
      animatedAG: ".animated-ag",
      animatedOP: ".animated-op",
    },
  };

  // Initialize on DOM load
  document.addEventListener("DOMContentLoaded", initializeApp);

  function initializeApp() {
    const draggableSliderSection = document.querySelector(
      config.selectors.sliderSection
    );
    if (!draggableSliderSection) return;

    initializeDraggableSlider();
  }

  function initializeDraggableSlider() {
    if (state.draggableSliderInitialized) return;

    // Clone last item to make sure to slide all items smoothly
    cloneLastSlide();

    state.draggableSliderInitialized = true;
    state.draggableSliderInstance = createSwiperInstance();
  }

  function cloneLastSlide() {
    const swiperWrapper = document.querySelector(`${config.selectors.swiper} .swiper-wrapper`);
    const slides = swiperWrapper?.querySelectorAll('.swiper-slide');
    
    if (slides?.length) {
      // Clone the last slide
      const lastSlide = slides[slides.length - 1];
      const clonedSlide = lastSlide.cloneNode(true);
      
      // Add the extra-item class
      clonedSlide.classList.add('extra-item');
      
      // Append it to the wrapper
      swiperWrapper.appendChild(clonedSlide);
    }
  }

  function createSwiperInstance() {
    return new Swiper(config.selectors.swiper, {
      spaceBetween: config.spaceBetween,
      slidesPerView: 1,
      allowTouchMove: true,
      grabCursor: false,
      breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
        1280: { slidesPerView: 4 },
      },
      on: {
        init: handleSwiperInit,
        touchStart: () => handleDragStart(),
        touchEnd: () => handleDragEnd(),
        sliderFirstMove: () => handleDragMove(),
        sliderMove: (_, e) => handleDragSlider(e),
      },
    });
  }

  function handleSwiperInit() {
    const slides = this.slides;
    const activeSlide = slides[this.activeIndex];

    if (!activeSlide) return;

    state.baseSlideWidth = activeSlide.offsetWidth;

    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      expandFirstSlide(activeSlide);
      initializeSlideHoverEffects(slides);

      if (!state.pointerInitialized) {
        initializePointerSystem();
        state.pointerInitialized = true;
      }
    });
  }

  function initializeSlideHoverEffects(slides) {
    if (!slides?.length) return;

    slides.forEach((slide) => {
      const slideWidth = slide.offsetWidth;
      setSlideWidthProperty(slide, slideWidth);
      attachSlideHoverListeners(slide, slides, slideWidth);
    });
  }

  function attachSlideHoverListeners(slide, allSlides, slideWidth) {
    slide.addEventListener("mouseenter", () => {
      if (slide.classList.contains("expanded")) return;

      resetAllSlides(allSlides, slideWidth);
      expandSlide(slide, slideWidth);
    });
  }

  function resetAllSlides(slides, baseWidth) {
    slides.forEach((slide) => {
      slide.classList.remove("expanded");
      slide.style.width = `${baseWidth / 16}rem`;
    });
  }

  function expandSlide(slide, baseWidth) {
    slide.classList.add("expanded");
    slide.style.width = `${(baseWidth * config.slideExpandMultiplier) / 16}rem`;
  }

  function expandFirstSlide(activeSlide) {
    const slideWidth = activeSlide.offsetWidth;
    expandSlide(activeSlide, slideWidth);
  }

  function setSlideWidthProperty(element, width) {
    element.style.setProperty("--item-width", `${width / 16}rem`);
  }

  function initializePointerSystem() {
    const elements = getPointerElements();
    if (!elements.isValid) return;

    initializePointerText(elements.pointerText);
    attachPointerEventListeners(elements);
    setupGlobalDragHandlers();
  }

  function getPointerElements() {
    const pointer = document.querySelector(config.selectors.pointer);
    const slider = document.querySelector(config.selectors.swiper);
    const pointerText = pointer?.querySelector(config.selectors.pointerText);

    const isValid = pointer && slider && pointerText;

    if (!isValid) {
      console.warn("Required pointer elements not found");
    }

    return { pointer, slider, pointerText, isValid };
  }

  function attachPointerEventListeners(elements) {
    const { pointer, slider, pointerText } = elements;

    // Mouse enter/leave handlers
    slider.addEventListener("mouseenter", () => handlePointerEnter(pointer));
    slider.addEventListener("mouseleave", () =>
      handlePointerLeave(pointer, pointerText)
    );

    // Mouse move handler - works during both hover and drag
    slider.addEventListener("mousemove", (e) =>
      handlePointerMove(e, slider, pointer)
    );

    // Mouse drag handlers for non-touch devices
    slider.addEventListener("mousedown", (e) =>
      handleMouseDown(e, pointerText)
    );
    document.addEventListener("mouseup", () => handleMouseUp(pointerText));

    // Global mousemove for tracking during drag
    document.addEventListener("mousemove", (e) => {
      if (state.isDragging && state.isHovering) {
        handlePointerMove(e, slider, pointer);
      }
    });

    // Prevent context menu on right click during drag
    slider.addEventListener("contextmenu", (e) => {
      if (state.isDragging) e.preventDefault();
    });
  }

  function handlePointerEnter(pointer) {
    state.isHovering = true;
    gsap.to(pointer, {
      scale: 1,
      duration: config.animationDurations.hover,
      ease: "back.out(1.7)",
    });
  }

  function handlePointerLeave(pointer, pointerText) {
    state.isHovering = false;
    state.isDragging = false;

    gsap.to(pointer, {
      scale: 0,
      duration: config.animationDurations.hover,
      ease: "back.in(1.7)",
    });

    // Reset text after animation
    setTimeout(() => setPointerTextToDrag(pointerText), 100);
  }

  function handlePointerMove(event, slider, pointer) {
    if (!state.isHovering) return;

    const rect = slider.getBoundingClientRect();
    const x = event.clientX - rect.left - pointer.offsetWidth / 2;
    const y = event.clientY - rect.top - pointer.offsetHeight / 2;

    gsap.to(pointer, {
      x: x,
      y: y,
      duration: config.animationDurations.pointer,
      ease: "power2.out",
    });
  }

  function handleMouseDown(event, pointerText) {
    if (!state.isHovering) return;

    // Only handle left mouse button
    if (event.button !== 0) return;
    state.isDragging = true;
    animateToDropText(pointerText);
  }

  function handleMouseUp(pointerText) {
    if (!state.isDragging || !state.isHovering) return;

    state.isDragging = false;
    setTimeout(() => setPointerTextToDrag(pointerText), 100);
  }

  function setupGlobalDragHandlers() {
    // Global handlers for Swiper touch events
    window.handleDragStart = function () {
      if (!state.isHovering) return;

      state.isDragging = true;
      // Get elements for pointer movement
      const elements = getPointerElements();
      if (elements.isValid) {
        animateToDropText(elements.pointerText);

        slideItemsScaleDown(elements.slider);

        // Scale down the pointer
        gsap.to(elements.pointer, {
          scale: 0.8,
          duration: config.animationDurations.pointer,
          ease: "power2.out",
        });
      }
    };

    window.handleDragMove = function (event) {
      if (!state.isHovering) return;

      if (!state.isDragging) {
        state.isDragging = true;
        const elements = getPointerElements();
        if (elements.isValid) {
          animateToDropText(elements.pointerText);
        }
      }
    };

    window.handleDragEnd = function () {
      if (!state.isHovering) return;

      state.isDragging = false;
      // Get elements to scale up the pointer
      const elements = getPointerElements();
      if (elements.isValid) {
        setTimeout(() => setPointerTextToDrag(elements.pointerText), 100);

        resetSlideItemsScale(elements.slider);

        gsap.to(elements.pointer, {
          scale: 1,
          duration: config.animationDurations.pointer,
          ease: "power2.out",
        });
      }
    };

    window.handleDragSlider = function (event) {
      state.isDragging = true;
      const elements = getPointerElements();
      if (elements.isValid) {
        // Immediately update pointer position on mousedown
        handlePointerMove(event, elements.slider, elements.pointer);
      }
    };
  }

  function slideItemsScaleDown(swiper) {
    const slideItems = swiper.querySelectorAll(".swiper-slide");
    slideItems.forEach(slide => {
        gsap.to(slide, {
            scale: 0.95,
            duration: config.animationDurations.pointer,
            ease: "power2.out",
        })
    }); 
  }

  function resetSlideItemsScale(swiper) {
    const slideItems = swiper.querySelectorAll(".swiper-slide");
    slideItems.forEach(slide => {
        gsap.to(slide, {
            scale: 1,
            duration: config.animationDurations.pointer,
            ease: "power2.out",
        })
    }); 
  }

  function initializePointerText(pointerText) {
    cleanupExistingTextElements(pointerText);

    const animatedAG = createTextElement(
      "animated-ag",
      "<span>a</span><span>g</span>"
    );
    pointerText.appendChild(animatedAG);

    gsap.set(animatedAG.children, { y: 0, opacity: 1 });
  }

  function cleanupExistingTextElements(pointerText) {
    const existingElements = [
      pointerText.querySelector(config.selectors.animatedAG),
      pointerText.querySelector(config.selectors.animatedOP),
    ];

    existingElements.forEach((el) => el?.remove());
  }

  function createTextElement(className, innerHTML) {
    const element = document.createElement("span");
    element.classList.add(className, "d-inline-flex");
    element.innerHTML = innerHTML;
    return element;
  }

  function animateToDropText(pointerText) {
    const existingOP = pointerText.querySelector(config.selectors.animatedOP);
    existingOP?.remove();

    const ag = pointerText.querySelector(config.selectors.animatedAG);

    // Animate out "ag" letters
    if (ag?.children.length > 0) {
      gsap.to([...ag.children], {
        y: 25,
        opacity: 0,
        duration: config.animationDurations.textTransition,
        stagger: config.animationDurations.textStagger,
        ease: "power2.in",
        onComplete: () => ag.remove(),
      });
    }

    // Create and animate in "op" letters
    const animatedOP = createTextElement(
      "animated-op",
      "<span>o</span><span>p</span>"
    );
    insertAfterStaticDr(pointerText, animatedOP);

    gsap.fromTo(
      animatedOP.children,
      { y: -25, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: config.animationDurations.textStagger,
        ease: "power2.in",
      }
    );
  }

  function insertAfterStaticDr(pointerText, element) {
    const staticDr = pointerText.querySelector(config.selectors.staticDr);
    if (staticDr) {
      staticDr.parentNode.insertBefore(element, staticDr.nextSibling);
    } else {
      pointerText.appendChild(element);
    }
  }

  function setPointerTextToDrag(pointerText) {
    const op = pointerText.querySelector(config.selectors.animatedOP);
    const existingAG = pointerText.querySelector(config.selectors.animatedAG);

    // Animate out "op" letters
    if (op?.children.length > 0) {
      gsap.to(op.children, {
        y: -25,
        opacity: 0,
        duration: config.animationDurations.textTransition,
        stagger: config.animationDurations.textStagger,
        ease: "power2.in",
        onComplete: () => op.remove(),
      });
    }

    // Restore "ag" letters if missing
    if (!existingAG) {
      setTimeout(() => {
        const animatedAG = createTextElement(
          "animated-ag",
          "<span>a</span><span>g</span>"
        );
        pointerText.appendChild(animatedAG);

        gsap.fromTo(
          [...animatedAG.children],
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: config.animationDurations.textTransition,
            stagger: config.animationDurations.textStagger,
            ease: "power2.out",
          }
        );
      }, 150);
    }
  }
})();
