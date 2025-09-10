(function () {
  "use strict";
  
  // Main application class
  class DraggableSliderApp {
    constructor() {
      // State management
      this.state = {
        draggableSliderInitialized: false,
        draggableSliderInstance: null,
        baseSlideWidth: null,
        pointerInitialized: false,
        isDragging: false,
        isHovering: false,
      };

      // Configuration
      this.config = {
        spaceBetween: 32,
        slideExpandMultiplier: 2,
        animationDurations: {
          hover: 0.3,
          pointer: 0.2,
          textTransition: 0.3,
          textStagger: 0.05,
          slide: 0.2,
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
      document.addEventListener("DOMContentLoaded", () => this.initializeApp());
    }

    initializeApp() {
      const draggableSliderSection = document.querySelector(
        this.config.selectors.sliderSection
      );
      if (!draggableSliderSection) return;
      
      this.initializeDraggableSlider();
    }

    initializeDraggableSlider() {
      if (this.state.draggableSliderInitialized) return;
      
      this.cloneLastSlideWithCheckWindowSize();
      this.state.draggableSliderInitialized = true;
      this.state.draggableSliderInstance = this.createSwiperInstance();
    }

    cloneLastSlide() {
      const swiperWrapper = document.querySelector(
        `${this.config.selectors.swiper} .swiper-wrapper`
      );
      const slides = swiperWrapper?.querySelectorAll(".swiper-slide");
      
      if (!swiperWrapper || !slides.length) return;
      
      // Check if an extra-item already exists
      if (swiperWrapper.querySelector(".swiper-slide.extra-item")) return;
      
      const lastSlide = slides[slides.length - 1];
      const clonedSlide = lastSlide.cloneNode(true);
      clonedSlide.classList.add("extra-item");
      swiperWrapper.appendChild(clonedSlide);
    }

    removeClonedSlides() {
      const swiperWrapper = document.querySelector(
        `${this.config.selectors.swiper} .swiper-wrapper`
      );
      if (!swiperWrapper) return;
      
      const extraItems = swiperWrapper.querySelectorAll(".swiper-slide.extra-item");
      extraItems.forEach((item) => item.remove());
    }

    cloneLastSlideWithCheckWindowSize() {
      if (window.innerWidth >= 1024) {
        this.cloneLastSlide();
      } else {
        this.removeClonedSlides();
      }
    }

    debounce(func, delay) {
      let timeoutId;
      return function () {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, arguments);
        }, delay);
      };
    }

    createSwiperInstance() {
      // Setup debounced resize handler
      window.addEventListener(
        "resize",
        this.debounce(() => this.cloneLastSlideWithCheckWindowSize(), 200)
      );

      return new Swiper(this.config.selectors.swiper, {
        spaceBetween: this.config.spaceBetween,
        slidesPerView: 1,
        allowTouchMove: true,
        grabCursor: false,
        breakpoints: {
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        },
        on: {
          init: this.handleSwiperInit.bind(this),
          touchStart: () => this.handleDragStart(),
          touchEnd: () => this.handleDragEnd(),
          sliderFirstMove: () => this.handleDragMove(),
          sliderMove: (_, e) => this.handleDragSlider(e),
        },
      });
    }

    handleSwiperInit() {
      const slides = this.slides;
      const activeSlide = slides[this.activeIndex];
      if (!activeSlide) return;
      
      this.state.baseSlideWidth = this.getSwiperSlideWidth();
      
      requestAnimationFrame(() => {
        this.expandFirstSlide(activeSlide);
        this.initializeSlideHoverEffects(slides);
        if (!this.state.pointerInitialized) {
          this.initializePointerSystem();
          this.state.pointerInitialized = true;
        }
      });
    }

    initializeSlideHoverEffects(slides) {
      if (!slides?.length) return;
      
      const slideWidth = this.getSwiperSlideWidth();
      if (!slideWidth) return;
      
      slides.forEach((slide) => {
        this.setSlideWidthProperty(slide, slideWidth);
        this.attachSlideHoverListeners(slide, slides, slideWidth);
      });
    }

    attachSlideHoverListeners(slide, allSlides, slideWidth) {
      slide.addEventListener("mouseenter", () => {
        if (slide.classList.contains("expanded")) return;
        this.resetAllSlides(allSlides, slideWidth);
        this.expandSlide(slide, slideWidth);
      });
    }

    resetAllSlides(slides, baseWidth) {
      slides.forEach((slide) => {
        slide.classList.remove("expanded");
        this.animateSlideWidth(slide, `${baseWidth / 16}rem`);
      });
    }

    expandSlide(slide, baseWidth) {
      const expandedWidth = (baseWidth * this.config.slideExpandMultiplier) / 16;
      slide.classList.add("expanded");
      this.animateSlideWidth(slide, `${expandedWidth}rem`);
    }

    animateSlideWidth(slide, width) {
      gsap.to(slide, {
        width: width,
        duration: this.config.animationDurations.slide,
        ease: "power4.out"
      });
    }

    getSwiperSlideWidth() {    
      if (!this.state.draggableSliderInstance) return null;
      
      const swiperWidth = this.state.draggableSliderInstance.width;
      const slidesPerView = this.state.draggableSliderInstance.params.slidesPerView;
      const spaceBetween = this.state.draggableSliderInstance.params.spaceBetween;
      
      const totalSpaceBetween = spaceBetween * (Math.floor(slidesPerView) - 1);
      const slideWidth = (swiperWidth - totalSpaceBetween) / slidesPerView;
      
      return slideWidth;
    }

    expandFirstSlide(activeSlide) {
      if (!activeSlide) return;
      const slideWidth = this.getSwiperSlideWidth();
      this.expandSlide(activeSlide, slideWidth);
    }

    setSlideWidthProperty(element, width) {
      element.style.setProperty("--item-width", `${width / 16}rem`);
    }

    initializePointerSystem() {
      const elements = this.getPointerElements();
      if (!elements.isValid) return;
      
      this.initializePointerText(elements.pointerText);
      this.attachPointerEventListeners(elements);
    }

    getPointerElements() {
      const pointer = document.querySelector(this.config.selectors.pointer);
      const slider = document.querySelector(this.config.selectors.swiper);
      const pointerText = pointer?.querySelector(this.config.selectors.pointerText);
      const isValid = pointer && slider && pointerText;
      
      if (!isValid) {
        console.warn("Required pointer elements not found");
      }
      
      return { pointer, slider, pointerText, isValid };
    }

    attachPointerEventListeners(elements) {
      const { pointer, slider, pointerText } = elements;
      
      // Mouse enter/leave handlers
      slider.addEventListener("mouseenter", () => this.handlePointerEnter(pointer));
      slider.addEventListener("mouseleave", () =>
        this.handlePointerLeave(pointer, pointerText)
      );
      
      // Mouse move handler
      slider.addEventListener("mousemove", (e) =>
        this.handlePointerMove(e, slider, pointer)
      );
      
      // Mouse drag handlers
      slider.addEventListener("mousedown", (e) =>
        this.handleMouseDown(e, pointerText)
      );
      document.addEventListener("mouseup", () => this.handleMouseUp(pointerText));
      
      // Global mousemove for tracking during drag
      document.addEventListener("mousemove", (e) => {
        if (this.state.isDragging && this.state.isHovering) {
          this.handlePointerMove(e, elements.slider, elements.pointer);
        }
      });
      
      // Prevent context menu on right click during drag
      slider.addEventListener("contextmenu", (e) => {
        if (this.state.isDragging) e.preventDefault();
      });
    }

    handlePointerEnter(pointer) {
      this.state.isHovering = true;
      this.animatePointerScale(pointer, 1);
    }

    handlePointerLeave(pointer, pointerText) {
      this.state.isHovering = false;
      this.state.isDragging = false;
      this.animatePointerScale(pointer, 0);
      
      // Reset text after animation
      setTimeout(() => this.setPointerTextToDrag(pointerText), 100);
    }

    handlePointerMove(event, slider, pointer) {
      if (!this.state.isHovering) return;
      
      const rect = slider.getBoundingClientRect();
      const x = event.clientX - rect.left - pointer.offsetWidth / 2;
      const y = event.clientY - rect.top - pointer.offsetHeight / 2;
      
      gsap.to(pointer, {
        x: x,
        y: y,
        duration: this.config.animationDurations.pointer,
        ease: "power2.out",
      });
    }

    handleMouseDown(event, pointerText) {
      if (!this.state.isHovering || event.button !== 0) return;
      
      this.state.isDragging = true;
      this.animateToDropText(pointerText);
    }

    handleMouseUp(pointerText) {
      if (!this.state.isDragging || !this.state.isHovering) return;
      
      this.state.isDragging = false;
      setTimeout(() => this.setPointerTextToDrag(pointerText), 100);
    }

    animatePointerScale(pointer, scale) {
      gsap.to(pointer, {
        scale: scale,
        duration: this.config.animationDurations.hover,
        ease: scale === 1 ? "back.out(1.7)" : "back.in(1.7)",
      });
    }

    handleDragStart() {
      if (!this.state.isHovering) return;
      
      this.state.isDragging = true;
      const elements = this.getPointerElements();
      if (elements.isValid) {
        this.animateToDropText(elements.pointerText);
        this.slideItemsScaleDown(elements.slider);
        this.animatePointerScale(elements.pointer, 0.8);
      }
    }

    handleDragMove(event) {
      if (!this.state.isHovering) return;
      
      if (!this.state.isDragging) {
        this.state.isDragging = true;
        const elements = this.getPointerElements();
        if (elements.isValid) {
          this.animateToDropText(elements.pointerText);
        }
      }
    }

    handleDragEnd() {
      if (!this.state.isHovering) return;
      
      this.state.isDragging = false;
      const elements = this.getPointerElements();
      if (elements.isValid) {
        setTimeout(() => this.setPointerTextToDrag(elements.pointerText), 100);
        this.resetSlideItemsScale(elements.slider);
        this.animatePointerScale(elements.pointer, 1);
      }
    }

    handleDragSlider(event) {
      this.state.isDragging = true;
      const elements = this.getPointerElements();
      if (elements.isValid) {
        this.handlePointerMove(event, elements.slider, elements.pointer);
      }
    }

    slideItemsScaleDown(swiper) {
      this.animateSlideItemsScale(swiper, 0.95);
    }

    resetSlideItemsScale(swiper) {
      this.animateSlideItemsScale(swiper, 1);
    }

    animateSlideItemsScale(swiper, scale) {
      const slideItems = swiper.querySelectorAll(".swiper-slide");
      slideItems.forEach((slide) => {
        gsap.to(slide, {
          scale: scale,
          duration: this.config.animationDurations.pointer,
          ease: "power2.out",
        });
      });
    }

    initializePointerText(pointerText) {
      this.cleanupExistingTextElements(pointerText);
      const animatedAG = this.createTextElement(
        "animated-ag",
        "<span>a</span><span>g</span>"
      );
      pointerText.appendChild(animatedAG);
      gsap.set(animatedAG.children, { y: 0, opacity: 1 });
    }

    cleanupExistingTextElements(pointerText) {
      const existingElements = [
        pointerText.querySelector(this.config.selectors.animatedAG),
        pointerText.querySelector(this.config.selectors.animatedOP),
      ];
      existingElements.forEach((el) => el?.remove());
    }

    createTextElement(className, innerHTML) {
      const element = document.createElement("span");
      element.classList.add(className, "d-inline-flex");
      element.innerHTML = innerHTML;
      return element;
    }

    animateToDropText(pointerText) {
      const existingOP = pointerText.querySelector(this.config.selectors.animatedOP);
      existingOP?.remove();
      
      const ag = pointerText.querySelector(this.config.selectors.animatedAG);
      
      // Animate out "ag" letters
      if (ag?.children.length > 0) {
        this.animateTextLettersOut(ag, () => ag.remove());
      }
      
      // Create and animate in "op" letters
      const animatedOP = this.createTextElement(
        "animated-op",
        "<span>o</span><span>p</span>"
      );
      this.insertAfterStaticDr(pointerText, animatedOP);
      this.animateTextLettersIn(animatedOP.children, -25);
    }

    animateTextLettersOut(element, onComplete) {
      gsap.to([...element.children], {
        y: 25,
        opacity: 0,
        duration: this.config.animationDurations.textTransition,
        stagger: this.config.animationDurations.textStagger,
        ease: "power2.in",
        onComplete: onComplete,
      });
    }

    animateTextLettersIn(elements, startY) {
      gsap.fromTo(
        elements,
        { y: startY, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: this.config.animationDurations.textStagger,
          ease: "power2.in",
        }
      );
    }

    insertAfterStaticDr(pointerText, element) {
      const staticDr = pointerText.querySelector(this.config.selectors.staticDr);
      if (staticDr) {
        staticDr.parentNode.insertBefore(element, staticDr.nextSibling);
      } else {
        pointerText.appendChild(element);
      }
    }

    setPointerTextToDrag(pointerText) {
      const op = pointerText.querySelector(this.config.selectors.animatedOP);
      const existingAG = pointerText.querySelector(this.config.selectors.animatedAG);
      
      // Animate out "op" letters
      if (op?.children.length > 0) {
        this.animateTextLettersOut(op, () => op.remove());
      }
      
      // Restore "ag" letters if missing
      if (!existingAG) {
        setTimeout(() => {
          const animatedAG = this.createTextElement(
            "animated-ag",
            "<span>a</span><span>g</span>"
          );
          pointerText.appendChild(animatedAG);
          this.animateTextLettersIn(animatedAG.children, 20);
        }, 150);
      }
    }
  }

  // Initialize the application
  new DraggableSliderApp();
})();