let selectedPlanet = null;
let zooming = false;
let audioPlaying = null;  // Variable to track the currently playing audio

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .7, 10000000000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls for zooming and rotation
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const planets = [];

// Audio files for different distance ranges
const audioFiles = {
    close: new Audio('assets/sounds/25.mp3'),   // For distances close to the Sun
    medium: new Audio('assets/sounds/30.mp3'),  // For medium distances
    far: new Audio('assets/sounds/75.mp3')      // For far distances
};

// Create text labels for planets
function createTextLabel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 1012;  
    canvas.height = 728;
    context.font = 'Bold 100px Arial';
    context.fillStyle = 'white';
    context.fillText(text, 0, 64);  
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(35, 22.5, 10);  
    return sprite;
}

// Load planets into the scene
function loadPlanets(scene, raycaster, mouse, planets, onPlanetClick) {
    const loader = new THREE.GLTFLoader();
    const planetsData = [
        { name: "Mercury", model: "assets/Mercury.glb", distance: 4100, orbitPeriod: 87.97, rotationPeriod: 58.64 * 10, axialTilt: 0, scale: 0.0035 },
        { name: "Venus", model: "assets/Venus.glb", distance: 2400, orbitPeriod: 224.70, rotationPeriod: 243 * 10, axialTilt: 177.4, scale: 0.087 },
        { name: "Earth", model: "assets/Earth.glb", distance: 43300, orbitPeriod: 365.26, rotationPeriod: 1 * 10, axialTilt: 23.4, scale: 0.092 },
        { name: "Mars", model: "assets/Mars.glb", distance: 50700, orbitPeriod: 686.98, rotationPeriod: 1.025 * 10, axialTilt: 25.2, scale: 0.49 },
        { name: "Jupiter", model: "assets/Jupiter.glb", distance: 17290, orbitPeriod: 4332.82, rotationPeriod: 0.41 * 10, axialTilt: 3.1, scale: .121 },
        { name: "Saturn", model: "assets/Saturn.glb", distance: 3178000, orbitPeriod: 10755.70, rotationPeriod: 0.45 * 10, axialTilt: 26.7, scale: 0.0862 },
        { name: "Uranus", model: "assets/Uranus.glb", distance: 63780000, orbitPeriod: 30687.15, rotationPeriod: -0.72 * 10, axialTilt: 97.8, scale: 0.0372 },
        { name: "Neptune", model: "assets/Neptune.glb", distance: 1000000, orbitPeriod: 60190.03, rotationPeriod: 0.67 * 10, axialTilt: 28.3, scale: 0.0356 }
    ];

    planetsData.forEach(data => {
        loader.load(data.model, gltf => { 
            const planet = gltf.scene;
            planet.scale.set(data.scale, data.scale, data.scale);
            scene.add(planet);

            planet.userData = {
                name: data.name,
                distance: data.distance * 0.1,
                orbitSpeed: (1 / data.orbitPeriod) * .1,
                rotationSpeed: (1 / data.rotationPeriod) * .05,
                angle: Math.random() * Math.PI * 2,
                axialTilt: data.axialTilt
            };

            planet.rotation.z = THREE.MathUtils.degToRad(planet.userData.axialTilt);
            planets.push(planet);

            const label = createTextLabel(data.name);
            label.position.set(planet.position.x, planet.position.y + 15, planet.position.z);
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
            // Orbit calculations
            planet.userData.angle += planet.userData.orbitSpeed;
            planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
            planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
            planet.rotation.y += planet.userData.rotationSpeed;

            // Adjust label positioning and scaling based on camera distance
            planet.userData.label.position.set(planet.position.x, planet.position.y + 15, planet.position.z);
            const distance = camera.position.distanceTo(planet.position);
            const scale = Math.max(50, 20000 / distance);
            planet.userData.label.scale.set(scale, scale, scale);
        }
    });

    // Stable Zoom Logic
    if (selectedPlanet && zooming) {
        const baseZoomDistance = 600;  // Base zoom distance for all planets (adjust this value to your preference)
        const zoomAdjustmentFactor = selectedPlanet.scale.x * 100;  // Small adjustment based on planet size
        
        // Ensure the zoom distance is stable but adjusted by planet size slightly
        const zoomDistance = baseZoomDistance + zoomAdjustmentFactor; 

        // Get the planet's position
        const planetPosition = selectedPlanet.parent.position;

        // Calculate the direction vector from the camera to the planet
        const direction = new THREE.Vector3().subVectors(camera.position, planetPosition).normalize();

        // Target camera position at a stable distance from the planet
        const targetPosition = new THREE.Vector3().copy(planetPosition).add(direction.multiplyScalar(zoomDistance));

        // Smoothly move the camera to the new position while keeping the same zoom distance
        camera.position.lerp(targetPosition, 0.05);

        // Ensure the camera looks at the planet's center
        camera.lookAt(planetPosition);
    }
}

camera.position.z = 3000;
camera.position.y = 100;

function loadSun(scene) {
    const loader = new THREE.GLTFLoader();
    
    loader.load('assets/Sun.glb', gltf => {
        const sun = gltf.scene;
        sun.scale.set(.5, .5, .5);
        scene.add(sun);

        // Ambient light to simulate scattered light in space
        const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
        scene.add(ambientLight);

        // Directional light to simulate sunlight coming from the Sun
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Higher intensity for a stronger sunlight effect
        directionalLight.position.set(100, 100, 100); // Position it to cast shadows
        directionalLight.castShadow = true; // Enable shadows
        scene.add(directionalLight);

        // Hemisphere light for balanced illumination
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, .5); // Sky color, ground color, intensity
        scene.add(hemisphereLight);

        // Point light to simulate the Sun's light
        const pointLight = new THREE.PointLight(0xffffff, 1, 100, 1);
        pointLight.position.set(0, 0, 0);
        sun.add(pointLight); // Attach the point light to the Sun

        // Sun rotation animation
        function animateSun() {
            sun.rotation.y += 0.001; // Adjust rotation speed as necessary
        }

        function animate() {
            requestAnimationFrame(animate);
            animateSun();
        }
        animate();
    }, undefined, error => {
        console.error('Error loading Sun model:', error);
    });
}

audioFiles.close.loop = true;
audioFiles.medium.loop = true;
audioFiles.far.loop = true;

// Play audio based on distance range
function playAudioBasedOnDistance(distance) {
    stopAllAudio(); // Stop any currently playing audio

    if (distance < 500) {
        audioFiles.close.play();
        audioPlaying = audioFiles.close;
    } else if (distance < 2000) {
        audioFiles.medium.play();
        audioPlaying = audioFiles.medium;
    } else {
        audioFiles.far.play();
        audioPlaying = audioFiles.far;
    }
}

// Stop all audio
function stopAllAudio() {
    if (audioPlaying) {
        audioPlaying.pause();
        audioPlaying.currentTime = 0; // Reset to start
        audioPlaying = null;
    }
}

// Load sun and planets
loadSun(scene);
loadPlanets(scene, raycaster, mouse, planets, (intersects) => {
    if (intersects.length > 0) {
        selectedPlanet = intersects[0].object;
        zooming = true;
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updatePlanets(planets, selectedPlanet, zooming, camera);
    renderer.render(scene, camera);
}

// Event listeners
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets, true);
    
    if (intersects.length > 0) {
        selectedPlanet = intersects[0].object;
        zooming = true;
        const distance = selectedPlanet.parent.position.distanceTo(camera.position);
        playAudioBasedOnDistance(distance);
    }
});

// Double-click event to stop zooming and reset camera position smoothly
window.addEventListener('dblclick', () => {
    zooming = false;
    stopAllAudio(); // Stop any audio when zooming out
    
    const resetPosition = new THREE.Vector3(0, 100, 3000); // Original camera position
    new TWEEN.Tween(camera.position)
        .to(resetPosition, 2000) // Smooth transition back to original position over 2 seconds
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
});

// Initialize the animation loop
animate();
