(function () {
  "use strict";

  // === State ===
  const state = {
    draggableSliderInitialized: false,
    draggableSliderInstance: null,
    baseSlideWidth: null,
    pointerInitialized: false,
    isDragging: false,
    isHovering: false,
  };

  // === Config ===
  const config = {
    spaceBetween: 32,
    slideExpandMultiplier: 2,
    durations: {
      hover: 0.3,
      pointer: 0.2,
      text: 0.3,
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

  // === DOM Ready ===
  document.addEventListener("DOMContentLoaded", () => {
    const section = select(config.selectors.sliderSection);
    if (section) initializeDraggableSlider();
  });

  // === Init Draggable Slider ===
  function initializeDraggableSlider() {
    if (state.draggableSliderInitialized) return;

    updateClonedSlideByWindow();
    state.draggableSliderInitialized = true;
    state.draggableSliderInstance = createSwiper();
  }

  window.addEventListener(
    "resize",
    debounce(updateClonedSlideByWindow, 200)
  );

  function updateClonedSlideByWindow() {
    window.innerWidth >= 1024 ? cloneLastSlide() : removeClonedSlides();
  }

  function cloneLastSlide() {
    const wrapper = select(`${config.selectors.swiper} .swiper-wrapper`);
    if (!wrapper) return;

    const slides = wrapper.querySelectorAll(".swiper-slide");
    if (!slides.length || wrapper.querySelector(".extra-item")) return;

    const cloned = slides[slides.length - 1].cloneNode(true);
    cloned.classList.add("extra-item");
    wrapper.appendChild(cloned);
  }

  function removeClonedSlides() {
    const wrapper = select(`${config.selectors.swiper} .swiper-wrapper`);
    if (!wrapper) return;
    wrapper.querySelectorAll(".swiper-slide.extra-item").forEach(el => el.remove());
  }

  // === Swiper Setup ===
  function createSwiper() {
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
        init: onSwiperInit,
        touchStart: handleDragStart,
        touchEnd: handleDragEnd,
        sliderFirstMove: handleDragMove,
        sliderMove: (_, e) => handleDragSlider(e),
      },
    });
  }

  function onSwiperInit() {
    const slides = this.slides;
    const activeSlide = slides[this.activeIndex];
    if (!activeSlide) return;

    state.baseSlideWidth = getSlideWidth();

    requestAnimationFrame(() => {
      expandSlide(activeSlide, state.baseSlideWidth);
      setupSlideHover(slides);

      if (!state.pointerInitialized) {
        setupPointer();
        state.pointerInitialized = true;
      }
    });
  }

  function getSlideWidth() {
    const swiper = state.draggableSliderInstance;
    if (!swiper) return null;

    const { width, params } = swiper;
    const totalGap = params.spaceBetween * (Math.floor(params.slidesPerView) - 1);
    return (width - totalGap) / params.slidesPerView;
  }

  function setupSlideHover(slides) {
    if (!slides.length) return;
    const width = getSlideWidth();
    if (!width) return;

    slides.forEach(slide => {
      setSlideWidth(slide, width);
      slide.addEventListener("mouseenter", () => {
        if (slide.classList.contains("expanded")) return;
        resetSlides(slides, width);
        expandSlide(slide, width);
      });
    });
  }

  function setSlideWidth(slide, width) {
    slide.style.setProperty("--item-width", `${width / 16}rem`);
  }

  function resetSlides(slides, width) {
    slides.forEach(slide => {
      slide.classList.remove("expanded");
      animateSlideWidth(slide, width / 16);
    });
  }

  function expandSlide(slide, width) {
    const expanded = (width * config.slideExpandMultiplier) / 16;
    slide.classList.add("expanded");
    animateSlideWidth(slide, expanded);
  }

  function animateSlideWidth(slide, remWidth) {
    gsap.to(slide, {
      width: `${remWidth}rem`,
      duration: config.durations.slide,
      ease: "power4.out",
    });
  }

  // === Pointer System ===
  function setupPointer() {
    const { pointer, slider, pointerText, isValid } = getPointerElements();
    if (!isValid) return;

    initPointerText(pointerText);

    slider.addEventListener("mouseenter", () => pointerEnter(pointer));
    slider.addEventListener("mouseleave", () => pointerLeave(pointer, pointerText));
    slider.addEventListener("mousemove", e => pointerMove(e, slider, pointer));

    slider.addEventListener("mousedown", e => pointerMouseDown(e, pointerText));
    document.addEventListener("mouseup", () => pointerMouseUp(pointerText));
    document.addEventListener("mousemove", e => {
      if (state.isDragging && state.isHovering) {
        pointerMove(e, slider, pointer);
      }
    });

    slider.addEventListener("contextmenu", e => {
      if (state.isDragging) e.preventDefault();
    });
  }

  function getPointerElements() {
    const pointer = select(config.selectors.pointer);
    const slider = select(config.selectors.swiper);
    const pointerText = pointer?.querySelector(config.selectors.pointerText);

    const isValid = !!(pointer && slider && pointerText);
    if (!isValid) console.warn("Missing pointer elements");

    return { pointer, slider, pointerText, isValid };
  }

  function pointerEnter(pointer) {
    state.isHovering = true;
    gsap.to(pointer, { scale: 1, duration: config.durations.hover, ease: "back.out(1.7)" });
  }

  function pointerLeave(pointer, pointerText) {
    state.isHovering = state.isDragging = false;
    gsap.to(pointer, { scale: 0, duration: config.durations.hover, ease: "back.in(1.7)" });
    setTimeout(() => setTextToDrag(pointerText), 100);
  }

  function pointerMove(e, slider, pointer) {
    if (!state.isHovering) return;
    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left - pointer.offsetWidth / 2;
    const y = e.clientY - rect.top - pointer.offsetHeight / 2;

    gsap.to(pointer, {
      x, y,
      duration: config.durations.pointer,
      ease: "power2.out",
    });
  }

  function pointerMouseDown(e, pointerText) {
    if (e.button !== 0 || !state.isHovering) return;
    state.isDragging = true;
    animateToDrop(pointerText);
  }

  function pointerMouseUp(pointerText) {
    if (!state.isDragging || !state.isHovering) return;
    state.isDragging = false;
    setTimeout(() => setTextToDrag(pointerText), 100);
  }

  // === Drag Events (Connected to Swiper) ===
  function handleDragStart() {
    if (!state.isHovering) return;
    state.isDragging = true;

    const { slider, pointer, pointerText, isValid } = getPointerElements();
    if (!isValid) return;

    animateToDrop(pointerText);
    scaleSlides(slider, 0.95);
    gsap.to(pointer, { scale: 0.8, duration: config.durations.pointer, ease: "power2.out" });
  }

  function handleDragMove() {
    if (!state.isHovering || state.isDragging) return;

    state.isDragging = true;
    const { pointerText } = getPointerElements();
    animate
    animateToDrop(pointerText);
  }

  function handleDragEnd() {
    if (!state.isHovering) return;

    state.isDragging = false;
    const { slider, pointer, pointerText, isValid } = getPointerElements();
    if (!isValid) return;

    setTimeout(() => setTextToDrag(pointerText), 100);
    scaleSlides(slider, 1);
    gsap.to(pointer, {
      scale: 1,
      duration: config.durations.pointer,
      ease: "power2.out",
    });
  }

  function handleDragSlider(event) {
    state.isDragging = true;
    const { slider, pointer, isValid } = getPointerElements();
    if (isValid) {
      pointerMove(event, slider, pointer);
    }
  }

  function scaleSlides(container, scaleValue) {
    const slides = container.querySelectorAll(".swiper-slide");
    slides.forEach((slide) => {
      gsap.to(slide, {
        scale: scaleValue,
        duration: config.durations.pointer,
        ease: "power2.out",
      });
    });
  }

  // === Pointer Text Animation ===
  function initPointerText(pointerText) {
    cleanupPointerText(pointerText);

    const animatedAG = createTextElement("animated-ag", "<span>a</span><span>g</span>");
    pointerText.appendChild(animatedAG);

    gsap.set(animatedAG.children, { y: 0, opacity: 1 });
  }

  function animateToDrop(pointerText) {
    removeElement(pointerText.querySelector(config.selectors.animatedOP));

    const ag = pointerText.querySelector(config.selectors.animatedAG);
    if (ag?.children.length) {
      gsap.to([...ag.children], {
        y: 25,
        opacity: 0,
        duration: config.durations.text,
        stagger: config.durations.textStagger,
        ease: "power2.in",
        onComplete: () => ag.remove(),
      });
    }

    const op = createTextElement("animated-op", "<span>o</span><span>p</span>");
    insertAfter(op, pointerText.querySelector(config.selectors.staticDr));
    gsap.fromTo(
      op.children,
      { y: -25, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: config.durations.text,
        stagger: config.durations.textStagger,
        ease: "power2.in",
      }
    );
  }

  function setTextToDrag(pointerText) {
    const op = pointerText.querySelector(config.selectors.animatedOP);
    if (op?.children.length) {
      gsap.to(op.children, {
        y: -25,
        opacity: 0,
        duration: config.durations.text,
        stagger: config.durations.textStagger,
        ease: "power2.in",
        onComplete: () => op.remove(),
      });
    }

    if (!pointerText.querySelector(config.selectors.animatedAG)) {
      setTimeout(() => {
        const ag = createTextElement("animated-ag", "<span>a</span><span>g</span>");
        pointerText.appendChild(ag);
        gsap.fromTo(
          ag.children,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: config.durations.text,
            stagger: config.durations.textStagger,
            ease: "power2.out",
          }
        );
      }, 150);
    }
  }

  function cleanupPointerText(pointerText) {
    [config.selectors.animatedAG, config.selectors.animatedOP].forEach((selector) => {
      removeElement(pointerText.querySelector(selector));
    });
  }

  function createTextElement(className, html) {
    const span = document.createElement("span");
    span.classList.add(className, "d-inline-flex");
    span.innerHTML = html;
    return span;
  }

  function insertAfter(newNode, referenceNode) {
    if (referenceNode?.parentNode) {
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }
  }

  function removeElement(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // === Utilities ===
  function debounce(fn, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function select(selector) {
    return document.querySelector(selector);
  }
})();
