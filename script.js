const canvas = document.getElementById("simulationCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 400;

//DOM Elements
const material1 = document.getElementById("material1");
const customN1 = document.getElementById("customN1");
const material2 = document.getElementById("material2");
const customN2 = document.getElementById("customN2");
const showNormals = document.getElementById("showNormals");
const showAngles = document.getElementById("showAngles");
const laserColorPicker = document.getElementById("laserColor");

//Initial refractive indices and laser settings
let n1 = parseFloat(material1.value);
let n2 = parseFloat(material2.value);
let laserAngle = 45; //Laser pointer angle in degrees, limited to 0° to 90°.
let laserColor = laserColorPicker.value; //Initial laser color from the color picker

//Event listener for laser beam color
laserColorPicker.addEventListener("input", () => {
    laserColor = laserColorPicker.value; //Update laser color dynamically
    drawSimulation();
});

//Event listeners for material and custom refractive indices
material1.addEventListener("change", () => {
    n1 = material1.value === "custom" ? parseFloat(customN1.value) : parseFloat(material1.value);
    customN1.disabled = material1.value !== "custom";
    drawSimulation();
});

customN1.addEventListener("input", () => {
    n1 = parseFloat(customN1.value);
    drawSimulation();
});

material2.addEventListener("change", () => {
    n2 = material2.value === "custom" ? parseFloat(customN2.value) : parseFloat(material2.value);
    customN2.disabled = material2.value !== "custom";
    drawSimulation();
});

customN2.addEventListener("input", () => {
    n2 = parseFloat(customN2.value);
    drawSimulation();
});

//Dragging the laser to change its angle
canvas.addEventListener("mousedown", startDragging);
canvas.addEventListener("mousemove", dragLaser);
canvas.addEventListener("mouseup", stopDragging);

let dragging = false;

function startDragging(event) {
    dragging = true;
    dragLaser(event);
}

function dragLaser(event) {
    if (!dragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    //Calculate angle in degrees (0° to 90°) from the X-axis to the normal
    const angle = Math.atan2(y - canvas.height / 2, x - canvas.width / 2) * (180 / Math.PI);

    //Restrict the angle to the range 0° to 90°
    laserAngle = Math.min(Math.max(angle, 0), 90);

    drawSimulation();
}

function stopDragging() {
    dragging = false;
}

//Function to get color based on refractive index
function getMaterialColor(n) {
    if (n === 1.0) return "#ffffff"; //Air - White
    if (n === 1.33) return "#00ffff"; //Water - Cyan
    if (n === 1.5) return "#d3d3d3"; //Glass - Light Gray
    return "#add8e6"; //Custom values - Light Blue
}

//Function to calculate the speed of light in a medium
function calculateLightSpeed(n) {
    const c = 3e8; //Speed of light in vacuum (m/s)
    return c / n; //Speed in the medium
}

//Function to calculate the critical angle
function calculateCriticalAngle(n1, n2) {
    if (n1 > n2) {
        return Math.asin(n2 / n1) * (180 / Math.PI); //Convert to degrees
    }
    return null; //No critical angle if n1 <= n2
}

//Function to lighten a color (used for faint laser line)
function lightenColor(color, percent) {
    const num = parseInt(color.slice(1), 16); //Convert hex to a number
    const r = Math.min(255, ((num >> 16) & 255) + percent);
    const g = Math.min(255, ((num >> 8) & 255) + percent);
    const b = Math.min(255, (num & 255) + percent);
    return `rgb(${r}, ${g}, ${b})`;
}

function drawSimulation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Set top material color (n1)
    ctx.fillStyle = getMaterialColor(n1);
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

    //Set bottom material color (n2)
    ctx.fillStyle = getMaterialColor(n2);
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    //Draw boundary
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    const boundaryX = canvas.width / 2;
    const boundaryY = canvas.height / 2;

    // Incident ray
    const incidentStartX = canvas.width / 2 - 150 * Math.cos((laserAngle * Math.PI) / 180);
    const incidentStartY = canvas.height / 2 - 150 * Math.sin((laserAngle * Math.PI) / 180);

    // Main laser beam (bright)
    ctx.strokeStyle = laserColor; // Use selected laser color
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(incidentStartX, incidentStartY);
    ctx.lineTo(boundaryX, boundaryY);
    ctx.stroke();

    //Calculate angles relative to the normal
    const angleRelativeToXAxis = laserAngle; //Angle provided by user
    const incidentAngle = 90 - angleRelativeToXAxis; //Measure relative to the normal (90°)
    const incidentAngleRadians = (incidentAngle * Math.PI) / 180; //Convert to radians

    const sinIncident = Math.sin(incidentAngleRadians); //sin(θ₁)

    let sinRefraction; //sin(θ₂)
    let isTIR = false;

    //Handle Total Internal Reflection or normal refraction
    if (n1 > n2 && sinIncident > n2 / n1) {
        isTIR = true; // Total Internal Reflection occurs when sin(θ₂) > 1
    } else {
        sinRefraction = (n1 / n2) * sinIncident; // sin(θ₂) = sin(θ₁) * (n₁ / n₂)
    }

    if (isTIR) {
        //Total Internal Reflection: draw reflected ray
        const reflectedAngle = incidentAngle; // Reflection angle equals incident angle
        const reflectedAngleRadians = (reflectedAngle * Math.PI) / 180;
        const reflectedX = boundaryX + 150 * Math.sin(reflectedAngleRadians);
        const reflectedY = boundaryY - 150 * Math.cos(reflectedAngleRadians);

        ctx.strokeStyle = laserColor; //Use the same laser color
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(boundaryX, boundaryY);
        ctx.lineTo(reflectedX, reflectedY);
        ctx.stroke();

        if (showAngles.checked) {
            ctx.fillStyle = "black";
            ctx.font = "14px Arial";
            ctx.fillText(`Incidence Angle: ${incidentAngle.toFixed(1)}°`, 10, 20);
            ctx.fillText(`Total Internal Reflection`, 10, 40);
        }
    } else {
        //Normal refraction: calculate refraction angle
        const refractionAngleRadians = Math.asin(sinRefraction); //Refraction angle in radians
        const refractionAngle = (refractionAngleRadians * 180) / Math.PI; //Convert to degrees

        //Draw refracted ray
        const refractedX = boundaryX + 150 * Math.sin(refractionAngleRadians); //Use θ₂
        const refractedY = boundaryY + 150 * Math.cos(refractionAngleRadians);

        ctx.strokeStyle = laserColor; //Keep refracted ray same as main laser
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(boundaryX, boundaryY);
        ctx.lineTo(refractedX, refractedY);
        ctx.stroke();

        if (showAngles.checked) {
            ctx.fillStyle = "black";
            ctx.font = "14px Arial";
            ctx.fillText(`Incidence Angle: ${incidentAngle.toFixed(1)}°`, 10, 20);
            ctx.fillText(`Refraction Angle: ${refractionAngle.toFixed(1)}°`, 10, 40);
        }
    }

    //Normal line
    if (showNormals.checked) {
        ctx.strokeStyle = "gray";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(boundaryX, 0);
        ctx.lineTo(boundaryX, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    //Display light speed information
    const speed1 = calculateLightSpeed(n1).toExponential(2);
    const speed2 = calculateLightSpeed(n2).toExponential(2);

    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText(`Speed in Medium 1: ${speed1} m/s`, 10, 80);
    ctx.fillText(`Speed in Medium 2: ${speed2} m/s`, 10, 100);
}

drawSimulation();

