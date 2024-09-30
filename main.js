let selectedPlanet = null;
let zooming = false;
let audioPlaying = null; 
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .07, 10000000000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const planets = [];

// Distance ranges
const audioFiles = {
    close: new Audio('assets/sounds/25.mp3'),  
    medium: new Audio('assets/sounds/30.mp3'),  
    far: new Audio('assets/sounds/75.mp3')
};

// Mass-based sounds
const massAudioFiles = {
    lowMass: new Audio('assets/sounds/702.mp3'), 
    mediumMass: new Audio('assets/sounds/702.mp3'), 
    highMass: new Audio('assets/sounds/702.mp3')  
};

Object.values(audioFiles).forEach(audio => {
    audio.loop = true;
});

Object.values(massAudioFiles).forEach(audio => {
    audio.loop = true;
});

// Labels
function createTextLabel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1061;  
    canvas.height = 781; 
    context.font = 'Bold 90px Arial';
    context.fillStyle = 'white';
    context.fillText(text, 0, 54);  
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1000, 50, 1);  
    return sprite;
}

// Orbit line
function createOrbitLine(distance, segments = 100, color = 0xffffff) {
    const geometry = new THREE.BufferGeometry();
    const points = [];

    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = distance * Math.cos(theta);
        const z = distance * Math.sin(theta);
        points.push(new THREE.Vector3(x, 0, z));
    }

    geometry.setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    return new THREE.Line(geometry, material);
}

function loadPlanets(scene, raycaster, mouse, planets) {
    const loader = new THREE.GLTFLoader();
    const planetsData = [
        {
            name: "Mercury",
            model: "assets/Mercury.glb",
            distance: 57.91, // million km
            orbitPeriod: 88, // days
            rotationPeriod: 58.65 * 60 * 60 * 1000, // milliseconds
            axialTilt: 0.034, // degrees
            scale: 0.383, // relative to Earth
            mass: 0.330 // Earth masses
        },
        {
            name: "Venus",
            model: "assets/Venus.glb",
            distance: 108.21, // million km
            orbitPeriod: 225, // days
            rotationPeriod: 243 * 60 * 60 * 1000, // milliseconds
            axialTilt: 177.4, // degrees
            scale: 0.949, // relative to Earth
            mass: 0.815 // Earth masses
        },
        {
            name: "Earth",
            model: "assets/Earth.glb",
            distance: 149.6, // million km
            orbitPeriod: 365.26, // days
            rotationPeriod: 1 * 60 * 60 * 1000, // milliseconds
            axialTilt: 23.5, // degrees
            scale: 1, // relative to Earth
            mass: 1 // Earth masses
        },
        {
            name: "Mars",
            model: "assets/Mars.glb",
            distance: 227.92, // million km
            orbitPeriod: 687, // days
            rotationPeriod: 1.025 * 60 * 60 * 1000, // milliseconds
            axialTilt: 25.2, // degrees
            scale: 0.532, // relative to Earth
            mass: 0.107 // Earth masses
        },
        {
            name: "Jupiter",
            model: "assets/Jupiter.glb",
            distance: 778.57, // million km
            orbitPeriod: 4331, // days
            rotationPeriod: 0.41 * 60 * 60 * 1000, // milliseconds
            axialTilt: 3.1, // degrees
            scale: 11.21, // relative to Earth
            mass: 317.8 // Earth masses
        },
        {
            name: "Saturn",
            model: "assets/Saturn.glb",
            distance: 1433.5, // million km
            orbitPeriod: 10747, // days
            rotationPeriod: 0.45 * 60 * 60 * 1000, // milliseconds
            axialTilt: 26.7, // degrees
            scale: 9.45, // relative to Earth
            mass: 95.2 // Earth masses
        },
        {
            name: "Uranus",
            model: "assets/Uranus.glb",
            distance: 2872.5, // million km
            orbitPeriod: 30589, // days
            rotationPeriod: -0.72 * 60 * 60 * 1000, // milliseconds
            axialTilt: 97.8, // degrees
            scale: 4.01, // relative to Earth
            mass: 14.5 // Earth masses
        },
        {
            name: "Neptune",
            model: "assets/Neptune.glb",
            distance: 4495.1, // million km
            orbitPeriod: 59800, // days
            rotationPeriod: 0.67 * 60 * 60 * 1000, // milliseconds
            axialTilt: 28.3, // degrees
            scale: 3.88, // relative to Earth
            mass: 17.1 // Earth masses
        }
    ];
    

    planetsData.forEach(data => {
        loader.load(data.model, gltf => { 
            const planet = gltf.scene;
            planet.scale.set(data.scale, data.scale, data.scale);
            scene.add(planet);

            planet.userData = {
                name: data.name,
                distance: data.distance / 0.00008,
                orbitSpeed: (1 / data.orbitPeriod) * .1,
                rotationSpeed: (1 / data.rotationPeriod) * 5,
                angle: Math.random() * Math.PI * 2,
                axialTilt: data.axialTilt,
                mass: data.mass  
            };

            planet.rotation.z = THREE.MathUtils.degToRad(planet.userData.axialTilt);
            planets.push(planet);
            const orbitLine = createOrbitLine(planet.userData.distance, 128, 0x888888);
            scene.add(orbitLine);

            const label = createTextLabel(data.name);
            label.position.set(planet.position.x - 100, planet.position.y + 100, planet.position.z);
            planet.userData.label = label;
            scene.add(label);
        }, undefined, error => {
            console.error('Error loading model:', error);
        });
    });
}

function updatePlanets(planets, selectedPlanet, zooming, camera) {
    planets.forEach(planet => {
        if (planet.userData) {
            // Update planet position and rotation
            planet.userData.angle += planet.userData.orbitSpeed;
            planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
            planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
            planet.rotation.y += planet.userData.rotationSpeed;

            // Position the label above the planet
            planet.userData.label.position.set(planet.position.x, planet.position.y + 4, planet.position.z); 
            const distance = camera.position.distanceTo(planet.position);
            const labelScale = Math.max(40, distance / 2); 
            planet.userData.label.scale.set(labelScale, labelScale, 20);
            planet.userData.label.lookAt(camera.position);
        }
    });

    // Zoom Logic
    if (selectedPlanet && zooming) {
        console.log("Selected Planet Scale:", selectedPlanet.scale.x);  // Debug: check planet scale

        const baseZoomDistance = 5000;
        let zoomAdjustmentFactor = 0;
        
        const bigPlanetThreshold = 5;
        const smallPlanetThreshold = .5;
        
        
        if (selectedPlanet.scale.x > bigPlanetThreshold) {
            zoomAdjustmentFactor = 4500; 
            console.log("Big planet zoom adjustment:", zoomAdjustmentFactor);  
        } else if (selectedPlanet.scale.x <= smallPlanetThreshold) {
            zoomAdjustmentFactor = -12000; 
            console.log("Small planet zoom adjustment:", zoomAdjustmentFactor);  
        } else if (selectedPlanet.scale.x > smallPlanetThreshold && selectedPlanet.scale.x <= bigPlanetThreshold) {
            zoomAdjustmentFactor = -8050; 
            console.log("Mid-sized planet zoom adjustment:", zoomAdjustmentFactor); 
        }


        const zoomDistance = baseZoomDistance + zoomAdjustmentFactor;
        console.log("Calculated Zoom Distance:", zoomDistance); 

        const planetPosition = selectedPlanet.position;
        console.log("Selected Planet Position:", planetPosition); 

        const direction = new THREE.Vector3().subVectors(camera.position, planetPosition).normalize();
        const targetPosition = new THREE.Vector3().copy(planetPosition).add(direction.multiplyScalar(zoomDistance));

        console.log("Camera Target Position:", targetPosition);  

        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(planetPosition);
    }
}

camera.position.z = 3000000;
camera.position.y = 500000;

function loadSun(scene) {
    const loader = new THREE.GLTFLoader();
    
    loader.load('assets/Sun.glb', gltf => {
        const sun = gltf.scene;
        sun.scale.set(100, 100, 100);
        scene.add(sun);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
        scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Set intensity as needed
        directionalLight.position.set(100, 100, 100); // Adjust the position
        directionalLight.target.position.set(0, 0, 0); // Point towards the center
        directionalLight.target.updateMatrixWorld(); // Ensure the target is updated
        scene.add(directionalLight);
        scene.add(directionalLight.target); // Add the target to the scene

        // Optional: add helper to visualize the light direction
        const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
        scene.add(helper);
    }, undefined, error => {
        console.error('Error loading model:', error);
    });
}

// Stop all audio
function stopAllAudio() {
    if (audioPlaying) {
        audioPlaying.pause();
        audioPlaying.currentTime = 0;
    }

    // Stop all mass audio
    for (const massAudio of Object.values(massAudioFiles)) {
        massAudio.pause();
        massAudio.currentTime = 0; 
    }
}

// Click event listener
let lastClickTime = 0;
window.addEventListener('click', (event) => {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime;

    // Check for double-click
    if (timeDiff < 500) {
        // Handle double-click
        stopAllAudio();
        selectedPlanet = null; // Reset selection
        zooming = false; // Stop zooming
        return;
    }

    lastClickTime = currentTime;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycasting to detect planet clicks
    raycaster.setFromCamera(mouse, camera);
    const planetIntersects = raycaster.intersectObjects(planets);

    if (planetIntersects.length > 0) {
        const planet = planetIntersects[0].object;
        handlePlanetClick(planet);
    }

    // Raycasting to detect label clicks
    const labels = planets.map(planet => planet.userData.label);
    const labelIntersects = raycaster.intersectObjects(labels);

    if (labelIntersects.length > 0) {
        const label = labelIntersects[0].object;
        const planet = planets.find(planet => planet.userData.label === label);
        handlePlanetClick(planet);
    }
});

// Handle planet clicks
function handlePlanetClick(planet) {
    selectedPlanet = planet;
    zooming = true;

    // Play distance-based sound
    const distance = selectedPlanet.userData.distance;

    if (distance < 500) {
        audioPlaying = audioFiles.close;
    } else if (distance < 1500) {
        audioPlaying = audioFiles.medium;
    } else {
        audioPlaying = audioFiles.far;
    }

    stopAllAudio();
    audioPlaying.play();

    // Play mass-based sound
    if (selectedPlanet.userData.mass < 0.5) {
        massAudioFiles.lowMass.play();
    } else if (selectedPlanet.userData.mass < 1.0) {
        massAudioFiles.mediumMass.play();
    } else {
        massAudioFiles.highMass.play();
    }

    // Update the sidebar with planet details
    updatePlanetDetailsSidebar(planet);
}

// Function to update the sidebar with the clicked planet's details
function updatePlanetDetailsSidebar(planet) {
    const sidebar = document.getElementById('planet-details-sidebar');
    const planetName = document.getElementById('planet-name');
    const planetDistance = document.getElementById('planet-distance');
    const planetMass = document.getElementById('planet-mass');
    const planetOrbitPeriod = document.getElementById('planet-orbit-period');
    const planetRotationPeriod = document.getElementById('planet-rotation-period');
    const planetAxialTilt = document.getElementById('planet-axial-tilt');

    // Populate the sidebar with planet information
    planetName.textContent = planet.userData.name;
    planetDistance.textContent = `Distance: ${planet.userData.distance.toFixed(2)} km`;
    planetMass.textContent = `Mass: ${planet.userData.mass} x 10^24 kg`;
    planetOrbitPeriod.textContent = `Orbit Period: ${planet.userData.orbitSpeed.toFixed(2)} Earth days`;
    planetRotationPeriod.textContent = `Rotation Period: ${planet.userData.rotationSpeed.toFixed(2)} Earth days`;
    planetAxialTilt.textContent = `Axial Tilt: ${planet.userData.axialTilt.toFixed(2)}°`;

    // Show the sidebar by adding the "open" class
    sidebar.classList.add('open');
}

// Function to hide the sidebar when no planet is selected
function hidePlanetDetailsSidebar() {
    const sidebar = document.getElementById('planet-details-sidebar');
    sidebar.classList.remove('open'); // Hide the sidebar by removing the "open" class
}

// Call this function when the sidebar needs to be hidden
function resetPlanetSelection() {
    selectedPlanet = null;
    zooming = false;
    hidePlanetDetailsSidebar(); // Hide sidebar when no planet is selected
}


// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updatePlanets(planets, selectedPlanet, zooming, camera);
    renderer.render(scene, camera);
}

// Window resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start
loadSun(scene);
loadPlanets(scene, raycaster, mouse, planets);
animate();
