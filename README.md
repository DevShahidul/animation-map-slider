
# Interactive Map Animation

This project provides an interactive, animated map and draggable slider for displaying stories across North America. It is built with HTML, CSS, and JavaScript, leveraging GSAP for animations and Bootstrap for responsive layout.

## Features

### Map Section & Draggable Slider
- **Dynamic State Indicators:** CSS variable-based indicators reflect active state movements using the `calc()` function.
- **Automatic Content Playback:** The slider automatically begins playback when expanded via map pointer interaction.
- **Animated Content & Background:** Slider background and content animate on slide change events, both forward and backward.
- **Animated Map Indicators:** Locations on the map pulse using GSAP animations.
- **Story Info Panel:** Displays a heading and description for the map.
- **Navigation Controls:** Users can interact with map controls to highlight different areas.
- **Responsive Design:** Uses Bootstrap and custom CSS for mobile-friendly layouts.
- **Custom Pointer:** Built with HTML and CSS, animated with GSAP and JavaScript. The pointer text changes from '**Drag**' to '**Drop**' on mousedown.
- **Expand Content:** Hovering over each slide expands the content with animation.
- **Scale Slide Item & Pointer:** On mousedown (dragging), the pointer and slide item scale down for a zoom-out effect.
- **Dynamic Counter Indicators:** CSS variables and `calc()` are used for a dynamic current slide indicator on the tracker.

## File Structure

### Map
- `map/index.html`: Main HTML structure for the map section.
- `map/dreamlab-map.js`: Handles map animations, controls, and interactivity.
- `map/dreamlab-map.css`: Custom styles for the map, info panel, and controls.

### Draggable Slider
- `slider/index.html`: Main HTML structure for the draggable slider section.
- `slider/dreamlab-slider.js`: Handles slide animations, dragging, pointer movement, and other interactivity.
- `slider/dreamlab-slider.css`: Custom styles for the slider, counter indicator, tracker, slide content, and custom pointer.

## Technical Details

### Dynamic Indicators
- Utilizes CSS custom properties for dynamic positioning.
- Implements the `calc()` function for precise animations.
- Provides smooth transitions between states.
- Optimizes performance through CSS-based animations.

### Content Slider
- Features automatic playback functionality.
- Triggers on map interaction.
- Seamlessly integrates with existing animations.
- Displays region-specific content.
- Dynamic slider counter with indicator movement based on the current slide.

## Usage

1. **Include Dependencies:**
   - Bootstrap CSS/JS
   - GSAP (GreenSock Animation Platform)
2. **Open `map/index.html` in your browser.**
3. **Interact with the map:**
   - Click on any region to activate the indicator.
   - Watch as the slider area expands automatically.
   - Content playback will begin automatically.
4. **Customize locations and stories** by editing the HTML and JS as needed.

## Customization

- Update map areas and indicators in the HTML.
- Create indicators with circular text using SVG path and text elements.
- Adjust animation parameters in `dreamlab-map.js`.
- Modify colors and layout in `dreamlab-map.css`.
- Configure autoplay timing and transitions in the slider settings.

## Main Challenges

### Map Section

- **Cross-browser SVG Text:** Displaying circular text in all browsers was challenging. Initially, it worked in Safari but not in Chrome. After debugging, I found the issue was using a `<circle>` tag as a reference path for the text element. Replacing it with a `<path>` tag (drawn using AI tools) resolved the issue for both browsers.
- **SVG Hover Area:** Changing the fill with an image on hover was inconsistent. Sometimes the SVG path area did not trigger hover/mouseenter events. After extensive debugging, I discovered the issue was setting `fill: none` by default, which caused the hover area to only trigger on the stroke. Setting a default fill color matching the section background resolved this.

## Lessons Learned

- Without a fill, the hover area is not triggered.
- The `<circle>` element does not work in all browsers as a reference for SVG text.
