# Interactive Map Animation

This module provides an interactive, animated map for displaying stories across North America. It uses HTML, CSS, and JavaScript (with GSAP for animations and Bootstrap for layout).

### Features

- **Dynamic State Indicators:** Implements CSS variable-based indicators that reflect active state movements using the `calc()` function
- **Automatic Content Playback:** Slider automatically begins playback when expanded via map pointer interaction
- **Animated Map Indicators:** Locations on the map pulse using GSAP animations
- **Story Info Panel:** Displays a heading and description for the map
- **Navigation Controls:** Users can interact with map controls to highlight different areas
- **Responsive Design:** Uses Bootstrap and custom CSS for mobile-friendly layouts

### Files

- `dreamlab-map.html`: Main HTML structure for the map section.
- `dreamlab-map.js`: Handles map animations, controls, and interactivity.
- `dreamlab-map.css`: Custom styles for the map, info panel, and controls.

### Technical Details

#### Dynamic Indicators
- Utilizes CSS custom properties for dynamic positioning
- Implements `calc()` function for precise animations
- Provides smooth transitions between states
- Optimizes performance through CSS-based animations

#### Content Slider
- Features automatic playback functionality
- Triggers on map interaction
- Seamlessly integrates with existing animations
- Displays region-specific content

### Usage

1. **Include Dependencies:**
   - Bootstrap CSS/JS
   - GSAP (GreenSock Animation Platform)
2. **Open `dreamlab-map.html` in your browser**
3. **Interact with the map:**
   - Click on any region to activate the indicator
   - Watch as the slider area expands automatically
   - Content playback will begin automatically
4. **Customize locations and stories** by editing the HTML and JS as needed

### Customization

- Update map areas and indicators in the HTML
- Adjust animation parameters in `dreamlab-map.js`
- Modify colors and layout in `dreamlab-map.css`
- Configure autoplay timing and transitions in the slider settings
