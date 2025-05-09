// Global variables
let canvas, ctx;
let isDragging = false;
let animationFrame;
let tooltip;

// PPF parameters
const MAX_EDUCATION = 100;
const MAX_HEALTHCARE = 100;
let currentPoint = { x: 0, y: calculateY(0) };
let pointPosition = "on"; // "on", "under", or "over" the curve

// Canvas setup dimensions
let canvasWidth, canvasHeight;
const PADDING = 60;

// Animation properties
let shouldAnimate = true;
const ANIMATION_DURATION = 1000; // milliseconds

// PPF Dynamics parameters
let dynamicsCanvas, dynamicsCtx;
let dynamicsPoint = { x: 0, y: calculateY(0) };
let dynamicsPointPosition = "on";
let dynamicsPPF = {
    maxEducation: MAX_EDUCATION,
    maxHealthcare: MAX_HEALTHCARE,
    curve: 1.5 // Power for the curve equation
};

// Original PPF parameters to store the initial state for comparison
const originalPPF = {
    maxEducation: MAX_EDUCATION,
    maxHealthcare: MAX_HEALTHCARE,
    curve: 1.5
};

// Fixed axes limits for dynamics graph (these won't change)
const FIXED_MAX_EDUCATION = 150;  // Higher than any scenario will go
const FIXED_MAX_HEALTHCARE = 150; // Higher than any scenario will go

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up canvas
    setupCanvas();
    
    // Set up navigation
    setupNavigation();
    
    // Set up tabs
    setupTabs();
    
    // Set up tooltip
    tooltip = document.getElementById('tooltip');
    
    // Initial draw with animation
    initializePPF();
    
    // Initialize PPF Dynamics
    initializePPFDynamics();
    
    // Handle window resize for responsive canvases
    handleResponsiveCanvases();
    
    // Add resize handler
    window.addEventListener('resize', handleResponsiveCanvases);
});

// Handle responsive canvases on window resize
function handleResponsiveCanvases() {
    // Main PPF canvas
    resizeCanvas();
    drawPPF();
    
    // Dynamics canvas if it exists
    if (dynamicsCanvas) {
        const container = dynamicsCanvas.parentElement;
        if (container) {
            // Set canvas dimensions based on screen size
            dynamicsCanvas.width = container.clientWidth;
            
            // Adjust height for mobile
            if (window.innerWidth <= 480) {
                dynamicsCanvas.height = 300;
            } else if (window.innerWidth <= 768) {
                dynamicsCanvas.height = 350;
            } else {
                dynamicsCanvas.height = 500;
            }
            
            drawDynamicsPPF();
        }
    }
}

// Canvas is ready event handler for mobile devices
function onCanvasReady() {
    // Force resize after the page has fully loaded
    setTimeout(() => {
        handleResponsiveCanvases();
    }, 500);
}

// Add page load event
window.addEventListener('load', onCanvasReady);

// Set up canvas and context
function setupCanvas() {
    canvas = document.getElementById('ppfCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas dimensions based on its container
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Add mouse event listeners for interactivity
    setupCanvasInteractions();
}

// Resize canvas to fill its container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvasWidth = container.clientWidth;
    canvasHeight = 500; // Fixed height
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Redraw if needed
    if (ctx) {
        drawPPF();
    }
}

// Set up canvas interactions (drag point)
function setupCanvasInteractions() {
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; });
    
    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleMouseDown({
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY
        });
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleMouseMove({
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY
        });
    });
    
    canvas.addEventListener('touchend', () => { isDragging = false; });
}

// Handle mouse down
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert canvas coordinates to graph coordinates
    const graphX = PADDING + (currentPoint.x / MAX_EDUCATION) * (canvasWidth - 2 * PADDING);
    const graphY = canvasHeight - PADDING - (currentPoint.y / MAX_HEALTHCARE) * (canvasHeight - 2 * PADDING);
    
    // Check if the user clicked near the current point
    if (Math.hypot(mouseX - graphX, mouseY - graphY) < 20) {
        isDragging = true;
        
        // Show tooltip
        tooltip.classList.add('visible');
        updateTooltipPosition({ x: mouseX, y: mouseY });
    } else {
        // Allow creating a new point by clicking anywhere in the graph area
        if (mouseX >= PADDING && 
            mouseX <= canvasWidth - PADDING && 
            mouseY >= PADDING && 
            mouseY <= canvasHeight - PADDING) {
            
            // Convert mouse position to graph coordinates
            const graphPosX = ((mouseX - PADDING) / (canvasWidth - 2 * PADDING)) * MAX_EDUCATION;
            const graphPosY = ((canvasHeight - PADDING - mouseY) / (canvasHeight - 2 * PADDING)) * MAX_HEALTHCARE;
            
            // Update current point
            currentPoint = {
                x: graphPosX,
                y: graphPosY
            };
            
            // Determine if the point is on, under, or over the curve
            updatePointPosition();
            
            // Update display
            isDragging = true;
            drawPPF();
            updateDisplayValues();
            
            // Show tooltip
            tooltip.classList.add('visible');
            updateTooltipPosition({ x: mouseX, y: mouseY });
        }
    }
}

// Handle mouse move
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // If dragging, update point position
    if (isDragging) {
        // Only allow dragging within the graph area
        if (mouseX >= PADDING && 
            mouseX <= canvasWidth - PADDING && 
            mouseY >= PADDING && 
            mouseY <= canvasHeight - PADDING) {
            
            // Convert mouse position to graph coordinates
            const graphPosX = ((mouseX - PADDING) / (canvasWidth - 2 * PADDING)) * MAX_EDUCATION;
            const graphPosY = ((canvasHeight - PADDING - mouseY) / (canvasHeight - 2 * PADDING)) * MAX_HEALTHCARE;
            
            // Update current point
            currentPoint = {
                x: graphPosX,
                y: graphPosY
            };
            
            // Determine if the point is on, under, or over the curve
            updatePointPosition();
            
            // Update display
            drawPPF();
            updateDisplayValues();
            
            // Update tooltip position
            updateTooltipPosition({ x: mouseX, y: mouseY });
        }
    }
}

// Calculate Y value for a given X on the PPF curve
function calculateY(x) {
    return MAX_HEALTHCARE * (1 - Math.pow(x / MAX_EDUCATION, 1.5));
}

// Determine if the point is on, under, or over the curve
function updatePointPosition() {
    const curveY = calculateY(currentPoint.x);
    
    // Allow some tolerance for being "on" the curve
    const tolerance = 2;
    
    if (Math.abs(currentPoint.y - curveY) <= tolerance) {
        pointPosition = "on";
    } else if (currentPoint.y < curveY) {
        pointPosition = "under";
    } else {
        pointPosition = "over";
    }
}

// Initialize PPF with animation
function initializePPF() {
    if (shouldAnimate) {
        animatePPFDraw();
    } else {
        drawPPF();
    }
    updateDisplayValues();
}

// Animate drawing of PPF
function animatePPFDraw() {
    let startTime = null;
    
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / ANIMATION_DURATION;
        
        if (progress < 1) {
            // Clear canvas
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            
            // Draw axes
            drawAxes();
            
            // Draw partial PPF based on progress
            drawPartialPPF(progress);
            
            // Continue animation
            animationFrame = requestAnimationFrame(animate);
        } else {
            // Animation complete
            drawPPF();
            
            // Reset for next animation if needed
            startTime = null;
        }
    }
    
    // Start animation
    animationFrame = requestAnimationFrame(animate);
}

// Draw partial PPF for animation
function drawPartialPPF(progress) {
    const steps = Math.floor(100 * progress);
    
    ctx.beginPath();
    ctx.strokeStyle = '#3a86ff';
    ctx.lineWidth = 3;
    
    for (let i = 0; i <= steps; i++) {
        const x = (i / 100) * MAX_EDUCATION;
        const y = calculateY(x);
        
        const canvasX = PADDING + (x / MAX_EDUCATION) * (canvasWidth - 2 * PADDING);
        const canvasY = canvasHeight - PADDING - (y / MAX_HEALTHCARE) * (canvasHeight - 2 * PADDING);
        
        if (i === 0) {
            ctx.moveTo(canvasX, canvasY);
        } else {
            ctx.lineTo(canvasX, canvasY);
        }
    }
    
    ctx.stroke();
}

// Draw complete PPF
function drawPPF() {
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw background grid
    drawGrid();
    
    // Draw axes
    drawAxes();
    
    // Draw PPF curve
    drawPPFCurve();

    // Draw shaded areas
    drawShadedAreas();
    
    // Draw points of interest
    drawCurrentPoint();
}

// Draw background grid
function drawGrid() {
    ctx.beginPath();
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    // Draw vertical grid lines
    for (let i = 0; i <= MAX_EDUCATION; i += 10) {
        const x = PADDING + (i / MAX_EDUCATION) * (canvasWidth - 2 * PADDING);
        ctx.moveTo(x, PADDING);
        ctx.lineTo(x, canvasHeight - PADDING);
    }
    
    // Draw horizontal grid lines
    for (let i = 0; i <= MAX_HEALTHCARE; i += 10) {
        const y = canvasHeight - PADDING - (i / MAX_HEALTHCARE) * (canvasHeight - 2 * PADDING);
        ctx.moveTo(PADDING, y);
        ctx.lineTo(canvasWidth - PADDING, y);
    }
    
    ctx.stroke();
}

// Draw shaded areas for under, over, and attainable regions
function drawShadedAreas() {
    // Shade the area under the curve (attainable but inefficient)
    ctx.beginPath();
    ctx.moveTo(PADDING, canvasHeight - PADDING);
    
    // Draw to the first point on curve
    const firstY = canvasHeight - PADDING - (calculateY(0) / MAX_HEALTHCARE) * (canvasHeight - 2 * PADDING);
    ctx.lineTo(PADDING, firstY);
    
    // Draw the curve backwards
    for (let i = 0; i <= 100; i++) {
        const x = ((100 - i) / 100) * MAX_EDUCATION;
        const y = calculateY(x);
        
        const canvasX = PADDING + (x / MAX_EDUCATION) * (canvasWidth - 2 * PADDING);
        const canvasY = canvasHeight - PADDING - (y / MAX_HEALTHCARE) * (canvasHeight - 2 * PADDING);
        
        ctx.lineTo(canvasX, canvasY);
    }
    
    // Close the path back to origin
    ctx.lineTo(canvasWidth - PADDING, canvasHeight - PADDING);
    ctx.lineTo(PADDING, canvasHeight - PADDING);
    
    // Fill with light blue
    ctx.fillStyle = 'rgba(135, 206, 250, 0.1)';
    ctx.fill();
}

// Draw axes
function drawAxes() {
    // Draw grid
    drawGrid();
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--dark');
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.moveTo(PADDING, canvasHeight - PADDING);
    ctx.lineTo(canvasWidth - PADDING, canvasHeight - PADDING);
    
    // Y-axis
    ctx.moveTo(PADDING, PADDING);
    ctx.lineTo(PADDING, canvasHeight - PADDING);
    
    ctx.stroke();
    
    // Draw axis labels
    ctx.font = '14px Segoe UI';
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--dark');
    ctx.textAlign = 'center';
    
    // X-axis label
    ctx.fillText('Education (units)', canvasWidth / 2, canvasHeight - PADDING / 2);
    
    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(PADDING / 2, canvasHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Healthcare (units)', 0, 0);
    ctx.restore();
    
    // Draw tick marks and values
    const xTicks = 5;
    const yTicks = 5;
    
    // X-axis ticks
    for (let i = 0; i <= xTicks; i++) {
        const x = PADDING + (i / xTicks) * (canvasWidth - 2 * PADDING);
        const value = Math.round((i / xTicks) * MAX_EDUCATION);
        
        // Draw tick
        ctx.beginPath();
        ctx.moveTo(x, canvasHeight - PADDING);
        ctx.lineTo(x, canvasHeight - PADDING + 5);
        ctx.stroke();
        
        // Draw value
        ctx.fillText(value.toString(), x, canvasHeight - PADDING + 20);
    }
    
    // Y-axis ticks
    for (let i = 0; i <= yTicks; i++) {
        const y = canvasHeight - PADDING - (i / yTicks) * (canvasHeight - 2 * PADDING);
        const value = Math.round((i / yTicks) * MAX_HEALTHCARE);
        
        // Draw tick
        ctx.beginPath();
        ctx.moveTo(PADDING, y);
        ctx.lineTo(PADDING - 5, y);
        ctx.stroke();
        
        // Draw value
        ctx.textAlign = 'right';
        ctx.fillText(value.toString(), PADDING - 10, y + 4);
    }
    
    // Draw legend
    const legendX = canvasWidth - PADDING - 200;
    const legendY = PADDING + 20;
    
    // Legend background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(legendX - 10, legendY - 10, 210, 100);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--light-gray');
    ctx.strokeRect(legendX - 10, legendY - 10, 210, 100);
    
    // Legend title
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--dark');
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText('PPF Areas', legendX, legendY);
    
    // Legend items
    ctx.font = '12px Segoe UI';
    
    // Efficient points
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--success');
    ctx.fillRect(legendX, legendY + 20, 10, 10);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--dark');
    ctx.fillText('Efficient (on curve)', legendX + 20, legendY + 28);
    
    // Inefficient points
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--warning');
    ctx.fillRect(legendX, legendY + 40, 10, 10);
    ctx.fillText('Inefficient (inside)', legendX + 20, legendY + 48);
    
    // Unattainable points
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--danger');
    ctx.fillRect(legendX, legendY + 60, 10, 10);
    ctx.fillText('Unattainable (outside)', legendX + 20, legendY + 68);
}

// Draw PPF curve
function drawPPFCurve() {
    ctx.beginPath();
    ctx.strokeStyle = '#3a86ff';
    ctx.lineWidth = 3;
    
    // Draw curve
    for (let i = 0; i <= 100; i++) {
        const x = (i / 100) * MAX_EDUCATION;
        const y = calculateY(x);
        
        const canvasX = PADDING + (x / MAX_EDUCATION) * (canvasWidth - 2 * PADDING);
        const canvasY = canvasHeight - PADDING - (y / MAX_HEALTHCARE) * (canvasHeight - 2 * PADDING);
        
        if (i === 0) {
            ctx.moveTo(canvasX, canvasY);
        } else {
            ctx.lineTo(canvasX, canvasY);
        }
    }
    
    ctx.stroke();
}

// Draw current point
function drawCurrentPoint() {
    const canvasX = PADDING + (currentPoint.x / MAX_EDUCATION) * (canvasWidth - 2 * PADDING);
    const canvasY = canvasHeight - PADDING - (currentPoint.y / MAX_HEALTHCARE) * (canvasHeight - 2 * PADDING);
    
    // Draw drop lines to axes
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 0, 110, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    
    // Vertical line to X-axis
    ctx.moveTo(canvasX, canvasY);
    ctx.lineTo(canvasX, canvasHeight - PADDING);
    
    // Horizontal line to Y-axis
    ctx.moveTo(canvasX, canvasY);
    ctx.lineTo(PADDING, canvasY);
    
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw different colored points based on position relative to curve
    if (pointPosition === "on") {
        // On the curve - Green point
  ctx.beginPath();
        ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#38b000'; // Green
        ctx.fill();
        
        // Draw tangent line
        const slope = calculateSlope(currentPoint.x);
        const tangentLength = 60;
        const dx = tangentLength / Math.sqrt(1 + slope * slope);
        const dy = slope * dx;
        
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(102, 102, 102, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.moveTo(canvasX - dx, canvasY - dy);
        ctx.lineTo(canvasX + dx, canvasY + dy);
        ctx.stroke();
        ctx.setLineDash([]);
    } else if (pointPosition === "under") {
        // Under the curve - Yellow point (inefficient)
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffbe0b'; // Yellow
        ctx.fill();
        
        // Draw a line to the efficient point on the curve
        const efficientY = calculateY(currentPoint.x);
        const efficientCanvasY = canvasHeight - PADDING - (efficientY / MAX_HEALTHCARE) * (canvasHeight - 2 * PADDING);
        
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56, 176, 0, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.moveTo(canvasX, canvasY);
        ctx.lineTo(canvasX, efficientCanvasY);
        ctx.stroke();
        ctx.setLineDash([]);
    } else {
        // Over the curve - Red point (unattainable)
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#d90429'; // Red
        ctx.fill();
    }
    
    // Add highlight effect with color based on position
    const highlightColor = 
        pointPosition === "on" ? 'rgba(56, 176, 0, 0.5)' : // Green
        pointPosition === "under" ? 'rgba(255, 190, 11, 0.5)' : // Yellow
        'rgba(217, 4, 41, 0.5)'; // Red
    
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 12, 0, 2 * Math.PI);
    ctx.strokeStyle = highlightColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Calculate slope of PPF at point x
function calculateSlope(x) {
    // Derivative of y = MAX_HEALTHCARE * (1 - (x/MAX_EDUCATION)^1.5)
    return -1.5 * MAX_HEALTHCARE / MAX_EDUCATION * Math.pow(x / MAX_EDUCATION, 0.5);
}

// Update display values
function updateDisplayValues() {
    // Update tooltip values
    document.getElementById('healthcareValue').textContent = Math.round(currentPoint.y);
    document.getElementById('educationValue').textContent = Math.round(currentPoint.x);
    
    // Calculate opportunity cost
    const slope = calculateSlope(currentPoint.x);
    const opportunityCost = Math.abs(slope).toFixed(2);
    document.getElementById('mocValue').textContent = opportunityCost;
    
    // Calculate MRT
    document.getElementById('mrtValue').textContent = opportunityCost;
    
    // Update tooltip content based on point position
    const tooltipContent = document.querySelector('.tooltip-content');
    let statusText = '';
    let explanationText = '';
    
    switch (pointPosition) {
        case 'on':
            statusText = 'Efficient Production';
            explanationText = 'All resources are being used efficiently. To produce more of one good, we must give up some of the other good.';
            break;
        case 'under':
            statusText = 'Inefficient Production';
            explanationText = 'Resources are not being used efficiently. We can produce more of both goods without giving up anything.';
            break;
        case 'over':
            statusText = 'Unattainable Production';
            explanationText = 'This combination is not possible with current resources and technology.';
            break;
    }
    
    // Add status and explanation to tooltip
    if (!tooltipContent.querySelector('.tooltip-status')) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'tooltip-status';
        tooltipContent.insertBefore(statusDiv, tooltipContent.firstChild);
    }
    
    if (!tooltipContent.querySelector('.tooltip-explanation')) {
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'tooltip-explanation';
        tooltipContent.appendChild(explanationDiv);
    }
    
    tooltipContent.querySelector('.tooltip-status').textContent = statusText;
    tooltipContent.querySelector('.tooltip-explanation').textContent = explanationText;
    
    // Update tooltip styling based on point position
    const tooltip = document.getElementById('tooltip');
    tooltip.className = 'tooltip';
    tooltip.classList.add(pointPosition);
    
    // Add opportunity cost explanation
    if (pointPosition === 'on') {
        const opportunityCostText = opportunityCost === '1.00' 
            ? '1 unit of healthcare must be sacrificed to produce 1 more unit of education.'
            : `${opportunityCost} units of healthcare must be sacrificed to produce 1 more unit of education.`;
        
        if (!tooltipContent.querySelector('.tooltip-opportunity-cost')) {
            const opportunityCostDiv = document.createElement('div');
            opportunityCostDiv.className = 'tooltip-opportunity-cost';
            tooltipContent.appendChild(opportunityCostDiv);
        }
        
        tooltipContent.querySelector('.tooltip-opportunity-cost').textContent = opportunityCostText;
    } else {
        const opportunityCostDiv = tooltipContent.querySelector('.tooltip-opportunity-cost');
        if (opportunityCostDiv) {
            opportunityCostDiv.remove();
        }
    }
}

// Update tooltip position
function updateTooltipPosition(position) {
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    
    // Position tooltip near the point but ensure it's visible
    let tooltipX = position.x + 20;
    let tooltipY = position.y - tooltipHeight / 2;
    
    // Adjust if off screen
    if (tooltipX + tooltipWidth > canvasWidth) {
        tooltipX = position.x - tooltipWidth - 20;
    }
    
    // Extra check for mobile devices - if tooltip would go off the left edge
    if (tooltipX < 0) {
        tooltipX = Math.min(10, (canvasWidth - tooltipWidth) / 2);
    }
    
    if (tooltipY < 0) {
        tooltipY = 10;
    } else if (tooltipY + tooltipHeight > canvasHeight) {
        tooltipY = canvasHeight - tooltipHeight - 10;
    }
    
    // Handle small screens by centering if necessary
    if (window.innerWidth <= 480 && tooltipWidth > canvasWidth * 0.7) {
        tooltipX = (canvasWidth - tooltipWidth) / 2;
        tooltipY = canvasHeight / 2;
    }
    
    // Set position
    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';
}

// Set up navigation between sections
function setupNavigation() {
    const navSections = document.querySelectorAll('.nav-section');
    const sections = document.querySelectorAll('.section');
    
    navSections.forEach(navSection => {
        navSection.addEventListener('click', () => {
            const targetSection = navSection.getAttribute('data-section');
            
            // Update active nav section
            navSections.forEach(item => item.classList.remove('active'));
            navSection.classList.add('active');
            
            // Show target section, hide others
            sections.forEach(section => {
                if (section.id === targetSection) {
                    section.classList.add('active');
                    
                    // If it's the dynamics section, make sure to initialize/redraw
                    if (targetSection === 'dynamics' && dynamicsCanvas) {
                        console.log('Showing dynamics section, redrawing graph');
                        // Reset canvas dimensions and redraw
                        const container = dynamicsCanvas.parentElement;
                        if (container) {
                            dynamicsCanvas.width = container.clientWidth;
                            dynamicsCanvas.height = 500;
                            drawDynamicsPPF();
                        }
                    }
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
}

// Set up tabs in info panel
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            
            // Show target tab content, hide others
            tabPanes.forEach(pane => {
                if (pane.id === targetTab) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
        });
    });
}

// Initialize PPF Dynamics
function initializePPFDynamics() {
    console.log('Initializing PPF Dynamics...');
    
    dynamicsCanvas = document.getElementById('dynamicsPPFCanvas');
    if (!dynamicsCanvas) {
        console.error('Dynamics canvas element not found');
        return;
    }
    
    dynamicsCtx = dynamicsCanvas.getContext('2d');
    if (!dynamicsCtx) {
        console.error('Could not get 2D context for dynamics canvas');
        return;
    }
    
    // Set canvas dimensions
    const container = dynamicsCanvas.parentElement;
    if (!container) {
        console.error('Dynamics canvas container not found');
        return;
    }
    
    dynamicsCanvas.width = container.clientWidth;
    dynamicsCanvas.height = Math.min(500, Math.max(300, window.innerHeight * 0.5));
    
    console.log('Dynamics canvas initialized with dimensions:', {
        width: dynamicsCanvas.width,
        height: dynamicsCanvas.height
    });
    
    // Reset to original PPF values
    dynamicsPPF = {
        maxEducation: originalPPF.maxEducation,
        maxHealthcare: originalPPF.maxHealthcare,
        curve: originalPPF.curve
    };
    
    // Initialize dynamicsPoint properly
    dynamicsPoint = { 
        x: dynamicsPPF.maxEducation / 2, 
        y: calculateDynamicsY(dynamicsPPF.maxEducation / 2) 
    };
    
    // Add legend for the PPF curves
    addDynamicsLegend();
    
    // Set up dynamics canvas interactions
    setupDynamicsCanvasInteractions();
    
    // Set up scenario buttons
    setupScenarioButtons();
    
    // Set up sliders
    setupSliders();
    
    // Initial draw
    drawDynamicsPPF();
}

// Setup interactions for dynamics canvas
function setupDynamicsCanvasInteractions() {
    let isDraggingDynamics = false;
    const dynamicsTooltip = document.getElementById('dynamicsTooltip');
    
    function handleDynamicsPointerDown(clientX, clientY) {
        const rect = dynamicsCanvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        
        // Convert canvas coordinates to graph coordinates
        const graphX = PADDING + (dynamicsPoint.x / FIXED_MAX_EDUCATION) * (dynamicsCanvas.width - 2 * PADDING);
        const graphY = dynamicsCanvas.height - PADDING - (dynamicsPoint.y / FIXED_MAX_HEALTHCARE) * (dynamicsCanvas.height - 2 * PADDING);
        
        // Check if the user clicked near the current point
        if (Math.hypot(mouseX - graphX, mouseY - graphY) < 20) {
            isDraggingDynamics = true;
            
            // Show tooltip
            if (dynamicsTooltip) {
                dynamicsTooltip.classList.add('visible');
                updateDynamicsTooltipPosition({ x: mouseX, y: mouseY });
            }
        } else {
            // Allow creating a new point by clicking anywhere in the graph area
            if (mouseX >= PADDING && 
                mouseX <= dynamicsCanvas.width - PADDING && 
                mouseY >= PADDING && 
                mouseY <= dynamicsCanvas.height - PADDING) {
                
                // Convert mouse position to graph coordinates
                const graphPosX = ((mouseX - PADDING) / (dynamicsCanvas.width - 2 * PADDING)) * FIXED_MAX_EDUCATION;
                const graphPosY = ((dynamicsCanvas.height - PADDING - mouseY) / (dynamicsCanvas.height - 2 * PADDING)) * FIXED_MAX_HEALTHCARE;
                
                // Update dynamics point (clamped to valid values)
                dynamicsPoint = {
                    x: Math.min(graphPosX, dynamicsPPF.maxEducation),
                    y: Math.min(graphPosY, dynamicsPPF.maxHealthcare)
                };
                
                // Update display
                isDraggingDynamics = true;
                drawDynamicsPPF();
                
                // Show tooltip
                if (dynamicsTooltip) {
                    dynamicsTooltip.classList.add('visible');
                    updateDynamicsTooltipPosition({ x: mouseX, y: mouseY });
                }
            }
        }
    }
    
    function handleDynamicsPointerMove(clientX, clientY) {
        if (isDraggingDynamics) {
            const rect = dynamicsCanvas.getBoundingClientRect();
            const mouseX = clientX - rect.left;
            const mouseY = clientY - rect.top;
            
            // Only allow dragging within the graph area
            if (mouseX >= PADDING && 
                mouseX <= dynamicsCanvas.width - PADDING && 
                mouseY >= PADDING && 
                mouseY <= dynamicsCanvas.height - PADDING) {
                
                // Convert mouse position to graph coordinates
                const graphPosX = ((mouseX - PADDING) / (dynamicsCanvas.width - 2 * PADDING)) * FIXED_MAX_EDUCATION;
                const graphPosY = ((dynamicsCanvas.height - PADDING - mouseY) / (dynamicsCanvas.height - 2 * PADDING)) * FIXED_MAX_HEALTHCARE;
                
                // Update dynamics point (clamped to valid values)
                dynamicsPoint = {
                    x: Math.min(graphPosX, dynamicsPPF.maxEducation),
                    y: Math.min(graphPosY, dynamicsPPF.maxHealthcare)
                };
                
                // Update display
                drawDynamicsPPF();
                
                // Update tooltip position
                if (dynamicsTooltip) {
                    updateDynamicsTooltipPosition({ x: mouseX, y: mouseY });
                }
            }
        }
    }
    
    dynamicsCanvas.addEventListener('mousedown', (e) => {
        handleDynamicsPointerDown(e.clientX, e.clientY);
    });
    
    dynamicsCanvas.addEventListener('mousemove', (e) => {
        handleDynamicsPointerMove(e.clientX, e.clientY);
    });
    
    dynamicsCanvas.addEventListener('mouseup', () => {
        isDraggingDynamics = false;
    });
    
    dynamicsCanvas.addEventListener('mouseleave', () => {
        isDraggingDynamics = false;
    });
    
    // Touch support
    dynamicsCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleDynamicsPointerDown(touch.clientX, touch.clientY);
    });
    
    dynamicsCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleDynamicsPointerMove(touch.clientX, touch.clientY);
    });
    
    dynamicsCanvas.addEventListener('touchend', () => {
        isDraggingDynamics = false;
    });
}

// Update dynamics tooltip position
function updateDynamicsTooltipPosition(position) {
    const dynamicsTooltip = document.getElementById('dynamicsTooltip');
    if (!dynamicsTooltip) return;
    
    const tooltipWidth = dynamicsTooltip.offsetWidth;
    const tooltipHeight = dynamicsTooltip.offsetHeight;
    
    // Position tooltip near the point but ensure it's visible
    let tooltipX = position.x + 20;
    let tooltipY = position.y - tooltipHeight / 2;
    
    // Adjust if off screen
    if (tooltipX + tooltipWidth > dynamicsCanvas.width) {
        tooltipX = position.x - tooltipWidth - 20;
    }
    
    // Extra check for mobile devices - if tooltip would go off the left edge
    if (tooltipX < 0) {
        tooltipX = Math.min(10, (dynamicsCanvas.width - tooltipWidth) / 2);
    }
    
    if (tooltipY < 0) {
        tooltipY = 10;
    } else if (tooltipY + tooltipHeight > dynamicsCanvas.height) {
        tooltipY = dynamicsCanvas.height - tooltipHeight - 10;
    }
    
    // Handle small screens by centering if necessary
    if (window.innerWidth <= 480 && tooltipWidth > dynamicsCanvas.width * 0.7) {
        tooltipX = (dynamicsCanvas.width - tooltipWidth) / 2;
        tooltipY = dynamicsCanvas.height / 2;
    }
    
    // Set position
    dynamicsTooltip.style.left = tooltipX + 'px';
    dynamicsTooltip.style.top = tooltipY + 'px';
}

// Set up scenario buttons
function setupScenarioButtons() {
    try {
        const buttons = document.querySelectorAll('.scenario-btn');
        console.log('Found scenario buttons:', buttons.length);
        
        if (buttons.length === 0) {
            console.error('No scenario buttons found');
            return;
        }
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const scenario = button.getAttribute('data-scenario');
                console.log('Button clicked for scenario:', scenario);
                
                if (scenario) {
                    // Highlight the active button
                    buttons.forEach(btn => {
                        btn.classList.remove('active');
                    });
                    button.classList.add('active');
                    
                    // Handle the scenario
                    handleScenario(scenario);
                }
            });
        });
    } catch (error) {
        console.error('Error setting up scenario buttons:', error);
    }
}

// Handle different scenarios
function handleScenario(scenario) {
    console.log('Handling scenario:', scenario);
    
    // Store original values for animation
    const prevPPF = {
        maxEducation: dynamicsPPF.maxEducation,
        maxHealthcare: dynamicsPPF.maxHealthcare,
        curve: dynamicsPPF.curve
    };
    
    // First, reset to default values if needed
    if (scenario === 'reset') {
        dynamicsPPF = {
            maxEducation: MAX_EDUCATION,
            maxHealthcare: MAX_HEALTHCARE,
            curve: 1.5
        };
    } else {
        // Then apply the specific scenario
        switch (scenario) {
            case 'healthcare-tech':
                // Improve healthcare technology - rotates the curve upward
                dynamicsPPF.maxHealthcare *= 1.3;
                dynamicsPPF.curve = 1.3; // Less steep curve
                break;
                
            case 'education-tech':
                // Improve education technology - extends the curve to the right
                dynamicsPPF.maxEducation *= 1.3;
                dynamicsPPF.curve = 1.7; // Steeper curve
                break;
                
            case 'pandemic':
                // Reduce healthcare capacity
                dynamicsPPF.maxHealthcare *= 0.7;
                break;
                
            case 'school-closure':
                // Reduce education capacity
                dynamicsPPF.maxEducation *= 0.7;
                break;
                
            case 'economic-growth':
                // Overall growth - moves the entire curve outward
                dynamicsPPF.maxHealthcare *= 1.3;
                dynamicsPPF.maxEducation *= 1.3;
                break;
                
            case 'economic-crisis':
                // Overall reduction - moves the entire curve inward
                dynamicsPPF.maxHealthcare *= 0.7;
                dynamicsPPF.maxEducation *= 0.7;
                break;
        }
    }
    
    // Update dynamicsPoint to be on the new curve
    dynamicsPoint.y = calculateDynamicsY(dynamicsPoint.x);
    
    // Update sliders to match new values
    updateSliders();
    
    // Update tooltip content to explain the change
    updateDynamicsTooltipContent(scenario);
    
    // Animate the transition
    animatePPFTransition(prevPPF, dynamicsPPF);
}

// Animate the transition between old and new PPF curves
function animatePPFTransition(startPPF, endPPF) {
    let startTime = null;
    const duration = 800; // milliseconds
    
    // Create a temporary PPF object for animation
    let animPPF = { ...startPPF };
    
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min(1, (timestamp - startTime) / duration);
        
        // Interpolate between start and end values
        animPPF.maxEducation = startPPF.maxEducation + (endPPF.maxEducation - startPPF.maxEducation) * progress;
        animPPF.maxHealthcare = startPPF.maxHealthcare + (endPPF.maxHealthcare - startPPF.maxHealthcare) * progress;
        animPPF.curve = startPPF.curve + (endPPF.curve - startPPF.curve) * progress;
        
        // Temporarily set the dynamic PPF to the animated values
        const tempPPF = { ...dynamicsPPF };
        dynamicsPPF = animPPF;
        
        // Redraw with current animation frame
        drawDynamicsPPF();
        
        // Continue animation if not complete
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Animation complete, restore final values
            dynamicsPPF = endPPF;
            drawDynamicsPPF();
        }
    }
    
    // Start the animation
    requestAnimationFrame(animate);
}

// Update dynamics tooltip content based on scenario
function updateDynamicsTooltipContent(scenario) {
    const dynamicsTooltipContent = document.getElementById('dynamicsTooltipContent');
    if (!dynamicsTooltipContent) return;
    
    let content = '';
    
    switch (scenario) {
        case 'healthcare-tech':
            content = `<strong>Healthcare Technology Improvement</strong><br>
                      Healthcare productivity increased by 30%.<br>
                      The PPF rotates outward along the healthcare axis.`;
            break;
            
        case 'education-tech':
            content = `<strong>Education Technology Improvement</strong><br>
                      Education productivity increased by 30%.<br>
                      The PPF rotates outward along the education axis.`;
            break;
            
        case 'pandemic':
            content = `<strong>Pandemic Impact</strong><br>
                      Healthcare capacity reduced by 30%.<br>
                      The PPF shifts inward on the healthcare axis.`;
            break;
            
        case 'school-closure':
            content = `<strong>School Closures</strong><br>
                      Education capacity reduced by 30%.<br>
                      The PPF shifts inward on the education axis.`;
            break;
            
        case 'economic-growth':
            content = `<strong>Economic Growth</strong><br>
                      Overall production capacity increased by 30%.<br>
                      The PPF shifts outward in all directions.`;
            break;
            
        case 'economic-crisis':
            content = `<strong>Economic Crisis</strong><br>
                      Overall production capacity decreased by 30%.<br>
                      The PPF shifts inward in all directions.`;
            break;
            
        case 'reset':
            content = `<strong>Reset to Original</strong><br>
                      PPF returned to initial production possibilities.`;
            break;
            
        default:
            content = 'Select a scenario to see how the PPF changes.';
    }
    
    dynamicsTooltipContent.innerHTML = content;
    
    // Show the tooltip temporarily
    const dynamicsTooltip = document.getElementById('dynamicsTooltip');
    if (dynamicsTooltip) {
        dynamicsTooltip.classList.add('visible');
        setTimeout(() => {
            dynamicsTooltip.classList.remove('visible');
        }, 5000);
    }
}

// Set up sliders
function setupSliders() {
    const healthcareSlider = document.getElementById('healthcareTechSlider');
    const educationSlider = document.getElementById('educationTechSlider');
    const resourcesSlider = document.getElementById('resourcesSlider');
    
    if (!healthcareSlider || !educationSlider || !resourcesSlider) {
        console.error('One or more sliders not found');
        return;
    }
    
    // Initialize sliders to middle position
    healthcareSlider.value = 50;
    educationSlider.value = 50;
    resourcesSlider.value = 50;
    
    // Add event listeners for sliders
    healthcareSlider.addEventListener('input', () => {
        // Convert slider value (0-100) to a factor (0.5-1.5)
        const factor = 0.5 + healthcareSlider.value / 100;
        
        // Update healthcare max based on original value
        dynamicsPPF.maxHealthcare = originalPPF.maxHealthcare * factor;
        
        // Clear any active scenario button highlight
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Update the curve
        drawDynamicsPPF();
    });
    
    educationSlider.addEventListener('input', () => {
        // Convert slider value (0-100) to a factor (0.5-1.5)
        const factor = 0.5 + educationSlider.value / 100;
        
        // Update education max based on original value
        dynamicsPPF.maxEducation = originalPPF.maxEducation * factor;
        
        // Clear any active scenario button highlight
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Update the curve
        drawDynamicsPPF();
    });
    
    resourcesSlider.addEventListener('input', () => {
        // Convert slider value (0-100) to a factor (0.5-1.5)
        const factor = 0.5 + resourcesSlider.value / 100;
        
        // Update both healthcare and education based on original values
        dynamicsPPF.maxHealthcare = originalPPF.maxHealthcare * factor;
        dynamicsPPF.maxEducation = originalPPF.maxEducation * factor;
        
        // Clear any active scenario button highlight
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Update the curve
        drawDynamicsPPF();
    });
}

// Update sliders to match current PPF values
function updateSliders() {
    const healthcareSlider = document.getElementById('healthcareTechSlider');
    const educationSlider = document.getElementById('educationTechSlider');
    const resourcesSlider = document.getElementById('resourcesSlider');
    
    if (!healthcareSlider || !educationSlider || !resourcesSlider) {
        return;
    }
    
    // Calculate slider values based on ratio to original values
    const healthcareFactor = dynamicsPPF.maxHealthcare / originalPPF.maxHealthcare;
    const educationFactor = dynamicsPPF.maxEducation / originalPPF.maxEducation;
    
    // Convert factors (0.5-1.5) to slider values (0-100)
    healthcareSlider.value = (healthcareFactor - 0.5) * 100;
    educationSlider.value = (educationFactor - 0.5) * 100;
    
    // For resources slider, use the average of the two factors
    const avgFactor = (healthcareFactor + educationFactor) / 2;
    resourcesSlider.value = (avgFactor - 0.5) * 100;
}

// Calculate Y value for dynamics PPF
function calculateDynamicsY(x) {
    // Prevent division by zero or negative values
    if (x < 0) return dynamicsPPF.maxHealthcare;
    if (x > dynamicsPPF.maxEducation) return 0;
    
    // Standard PPF formula with power function
    const result = dynamicsPPF.maxHealthcare * (1 - Math.pow(x / dynamicsPPF.maxEducation, dynamicsPPF.curve));
    
    // Ensure the result is valid
    return Math.max(0, Math.min(result, dynamicsPPF.maxHealthcare));
}

// Draw PPF for dynamics section
function drawDynamicsPPF() {
    console.log('Drawing dynamics PPF with:', dynamicsPPF);
    
    // Ensure we have a valid context
    if (!dynamicsCtx) {
        console.error('No context for dynamics canvas');
        return;
    }
    
    // Clear canvas
    dynamicsCtx.clearRect(0, 0, dynamicsCanvas.width, dynamicsCanvas.height);
    
    // Draw grid
    drawDynamicsGrid();
    
    // Draw axes
    drawDynamicsAxes();
    
    // Draw original PPF curve (dashed gray)
    drawOriginalPPFCurve();
    
    // Draw current dynamic PPF curve (solid blue)
    drawCurrentDynamicsCurve();
    
    // Draw shaded areas
    drawDynamicsShadedAreas();
    
    // Draw current point
    drawDynamicsPoint();
}

// Draw the original PPF curve (dashed gray)
function drawOriginalPPFCurve() {
    dynamicsCtx.beginPath();
    dynamicsCtx.setLineDash([5, 3]);
    dynamicsCtx.strokeStyle = '#aaaaaa';
    dynamicsCtx.lineWidth = 2;
    
    for (let i = 0; i <= 100; i++) {
        const x = (i / 100) * originalPPF.maxEducation;
        const y = originalPPF.maxHealthcare * (1 - Math.pow(x / originalPPF.maxEducation, originalPPF.curve));
        
        // Convert to canvas coordinates using FIXED scales
        const canvasX = PADDING + (x / FIXED_MAX_EDUCATION) * (dynamicsCanvas.width - 2 * PADDING);
        const canvasY = dynamicsCanvas.height - PADDING - (y / FIXED_MAX_HEALTHCARE) * (dynamicsCanvas.height - 2 * PADDING);
        
        if (i === 0) {
            dynamicsCtx.moveTo(canvasX, canvasY);
        } else {
            dynamicsCtx.lineTo(canvasX, canvasY);
        }
    }
    
    dynamicsCtx.stroke();
    dynamicsCtx.setLineDash([]);
}

// Draw the current dynamics PPF curve (solid blue)
function drawCurrentDynamicsCurve() {
    dynamicsCtx.beginPath();
    dynamicsCtx.strokeStyle = '#3a86ff';
    dynamicsCtx.lineWidth = 3;
    
    for (let i = 0; i <= 100; i++) {
        const x = (i / 100) * dynamicsPPF.maxEducation;
        const y = calculateDynamicsY(x);
        
        // Convert to canvas coordinates using FIXED scales
        const canvasX = PADDING + (x / FIXED_MAX_EDUCATION) * (dynamicsCanvas.width - 2 * PADDING);
        const canvasY = dynamicsCanvas.height - PADDING - (y / FIXED_MAX_HEALTHCARE) * (dynamicsCanvas.height - 2 * PADDING);
        
        if (i === 0) {
            dynamicsCtx.moveTo(canvasX, canvasY);
        } else {
            dynamicsCtx.lineTo(canvasX, canvasY);
        }
    }
    
    dynamicsCtx.stroke();
}

// Draw grid for dynamics PPF
function drawDynamicsGrid() {
    dynamicsCtx.beginPath();
    dynamicsCtx.strokeStyle = '#f0f0f0';
    dynamicsCtx.lineWidth = 1;
    
    // Draw vertical grid lines - using FIXED values
    for (let i = 0; i <= FIXED_MAX_EDUCATION; i += FIXED_MAX_EDUCATION / 10) {
        const x = PADDING + (i / FIXED_MAX_EDUCATION) * (dynamicsCanvas.width - 2 * PADDING);
        dynamicsCtx.moveTo(x, PADDING);
        dynamicsCtx.lineTo(x, dynamicsCanvas.height - PADDING);
    }
    
    // Draw horizontal grid lines - using FIXED values
    for (let i = 0; i <= FIXED_MAX_HEALTHCARE; i += FIXED_MAX_HEALTHCARE / 10) {
        const y = dynamicsCanvas.height - PADDING - (i / FIXED_MAX_HEALTHCARE) * (dynamicsCanvas.height - 2 * PADDING);
        dynamicsCtx.moveTo(PADDING, y);
        dynamicsCtx.lineTo(dynamicsCanvas.width - PADDING, y);
    }
    
    dynamicsCtx.stroke();
}

// Draw axes for dynamics PPF
function drawDynamicsAxes() {
    dynamicsCtx.beginPath();
    dynamicsCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--dark');
    dynamicsCtx.lineWidth = 2;
    
    // X-axis
    dynamicsCtx.moveTo(PADDING, dynamicsCanvas.height - PADDING);
    dynamicsCtx.lineTo(dynamicsCanvas.width - PADDING, dynamicsCanvas.height - PADDING);
    
    // Y-axis
    dynamicsCtx.moveTo(PADDING, PADDING);
    dynamicsCtx.lineTo(PADDING, dynamicsCanvas.height - PADDING);
    
    dynamicsCtx.stroke();
    
    // Draw axis labels
    dynamicsCtx.font = '14px Segoe UI';
    dynamicsCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--dark');
    dynamicsCtx.textAlign = 'center';
    
    // X-axis label
    dynamicsCtx.fillText('Education (units)', dynamicsCanvas.width / 2, dynamicsCanvas.height - PADDING / 2);
    
    // Y-axis label (rotated)
    dynamicsCtx.save();
    dynamicsCtx.translate(PADDING / 2, dynamicsCanvas.height / 2);
    dynamicsCtx.rotate(-Math.PI / 2);
    dynamicsCtx.fillText('Healthcare (units)', 0, 0);
    dynamicsCtx.restore();
    
    // Draw tick marks and values - using FIXED values
    const xTicks = 5;
    const yTicks = 5;
    
    // X-axis ticks
    for (let i = 0; i <= xTicks; i++) {
        const x = PADDING + (i / xTicks) * (dynamicsCanvas.width - 2 * PADDING);
        const value = Math.round((i / xTicks) * FIXED_MAX_EDUCATION);
        
        dynamicsCtx.beginPath();
        dynamicsCtx.moveTo(x, dynamicsCanvas.height - PADDING);
        dynamicsCtx.lineTo(x, dynamicsCanvas.height - PADDING + 5);
        dynamicsCtx.stroke();
        
        dynamicsCtx.fillText(value.toString(), x, dynamicsCanvas.height - PADDING + 20);
    }
    
    // Y-axis ticks
    for (let i = 0; i <= yTicks; i++) {
        const y = dynamicsCanvas.height - PADDING - (i / yTicks) * (dynamicsCanvas.height - 2 * PADDING);
        const value = Math.round((i / yTicks) * FIXED_MAX_HEALTHCARE);
        
        dynamicsCtx.beginPath();
        dynamicsCtx.moveTo(PADDING, y);
        dynamicsCtx.lineTo(PADDING - 5, y);
        dynamicsCtx.stroke();
        
        dynamicsCtx.textAlign = 'right';
        dynamicsCtx.fillText(value.toString(), PADDING - 10, y + 4);
    }
}

// Draw shaded areas for dynamics PPF
function drawDynamicsShadedAreas() {
    dynamicsCtx.beginPath();
    dynamicsCtx.moveTo(PADDING, dynamicsCanvas.height - PADDING);
    
    const firstY = dynamicsCanvas.height - PADDING - (calculateDynamicsY(0) / FIXED_MAX_HEALTHCARE) * (dynamicsCanvas.height - 2 * PADDING);
    dynamicsCtx.lineTo(PADDING, firstY);
    
    // Draw the efficient frontier
    for (let i = 0; i <= 100; i++) {
        const x = (i / 100) * dynamicsPPF.maxEducation;
        const y = calculateDynamicsY(x);
        
        // Convert to canvas coordinates using FIXED scales
        const canvasX = PADDING + (x / FIXED_MAX_EDUCATION) * (dynamicsCanvas.width - 2 * PADDING);
        const canvasY = dynamicsCanvas.height - PADDING - (y / FIXED_MAX_HEALTHCARE) * (dynamicsCanvas.height - 2 * PADDING);
        
        dynamicsCtx.lineTo(canvasX, canvasY);
    }
    
    // Complete the path back to the origin
    dynamicsCtx.lineTo(PADDING + (dynamicsPPF.maxEducation / FIXED_MAX_EDUCATION) * (dynamicsCanvas.width - 2 * PADDING), dynamicsCanvas.height - PADDING);
    dynamicsCtx.lineTo(PADDING, dynamicsCanvas.height - PADDING);
    
    // Fill with light blue with opacity
    dynamicsCtx.fillStyle = 'rgba(58, 134, 255, 0.1)';
    dynamicsCtx.fill();
}

// Draw current point for dynamics PPF
function drawDynamicsPoint() {
    // Ensure the point is within the valid range
    dynamicsPoint.x = Math.min(dynamicsPoint.x, dynamicsPPF.maxEducation);
    dynamicsPoint.y = Math.min(dynamicsPoint.y, dynamicsPPF.maxHealthcare);
    
    // Convert to canvas coordinates using FIXED scales
    const canvasX = PADDING + (dynamicsPoint.x / FIXED_MAX_EDUCATION) * (dynamicsCanvas.width - 2 * PADDING);
    const canvasY = dynamicsCanvas.height - PADDING - (dynamicsPoint.y / FIXED_MAX_HEALTHCARE) * (dynamicsCanvas.height - 2 * PADDING);
    
    // Draw drop lines
    dynamicsCtx.beginPath();
    dynamicsCtx.strokeStyle = 'rgba(255, 0, 110, 0.5)';
    dynamicsCtx.lineWidth = 1.5;
    dynamicsCtx.setLineDash([4, 3]);
    
    dynamicsCtx.moveTo(canvasX, canvasY);
    dynamicsCtx.lineTo(canvasX, dynamicsCanvas.height - PADDING);
    
    dynamicsCtx.moveTo(canvasX, canvasY);
    dynamicsCtx.lineTo(PADDING, canvasY);
    
    dynamicsCtx.stroke();
    dynamicsCtx.setLineDash([]);
    
    // Determine if the point is on, under, or over the curve
    const curveY = calculateDynamicsY(dynamicsPoint.x);
    const tolerance = 2;
    
    let pointColor = '#38b000'; // Default: green (on curve)
    
    if (Math.abs(dynamicsPoint.y - curveY) <= tolerance) {
        // On the curve - Green point
        pointColor = '#38b000';
    } else if (dynamicsPoint.y < curveY) {
        // Under the curve - Yellow point (inefficient)
        pointColor = '#ffbe0b';
    } else {
        // Over the curve - Red point (unattainable)
        pointColor = '#d90429';
    }
    
    // Draw point
    dynamicsCtx.beginPath();
    dynamicsCtx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
    dynamicsCtx.fillStyle = pointColor;
    dynamicsCtx.fill();
    
    // Add highlight
    dynamicsCtx.beginPath();
    dynamicsCtx.arc(canvasX, canvasY, 12, 0, 2 * Math.PI);
    dynamicsCtx.strokeStyle = pointColor.replace(')', ', 0.5)').replace('rgb', 'rgba');
    dynamicsCtx.lineWidth = 2;
    dynamicsCtx.stroke();
}

// Add legend for the PPF curves
function addDynamicsLegend() {
    // Remove existing legend if any
    const existingLegend = document.querySelector('.dynamics-legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    
    // Create new legend
    const dynamicsLegend = document.createElement('div');
    dynamicsLegend.className = 'dynamics-legend';
    dynamicsLegend.innerHTML = `
        <div class="legend-item">
            <div class="legend-color original"></div>
            <div class="legend-text">Original PPF</div>
        </div>
        <div class="legend-item">
            <div class="legend-color current"></div>
            <div class="legend-text">Current PPF</div>
        </div>
    `;
    
    // Add to canvas container
    if (dynamicsCanvas.parentElement) {
        dynamicsCanvas.parentElement.appendChild(dynamicsLegend);
    }
}
