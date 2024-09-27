let selectedPlanet = null;
let zooming = false;
let audioPlaying = null; 
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .7, 10000000000);
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
function createOrbitLine(distance, segments = 64, color = 0xffffff) {
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
        { name: "Mercury", model: "assets/Mercury.glb", distance: 410, orbitPeriod: 87.97, rotationPeriod: 58.64 * 10, axialTilt: 0, scale: 35, mass: 0.33 },
        { name: "Venus", model: "assets/Venus.glb", distance: 240, orbitPeriod: 224.70, rotationPeriod: 243 * 10, axialTilt: 177.4, scale: 87, mass: 4.87 },
        { name: "Earth", model: "assets/Earth.glb", distance: 4330, orbitPeriod: 365.26, rotationPeriod: 1 * 10, axialTilt: 23.4, scale: 92, mass: 5.97 },
        { name: "Mars", model: "assets/Mars.glb", distance: 5070, orbitPeriod: 686.98, rotationPeriod: 1.025 * 10, axialTilt: 25.2, scale: 49, mass: 0.64 },
        { name: "Jupiter", model: "assets/Jupiter.glb", distance: 172, orbitPeriod: 4332.82, rotationPeriod: 0.41 * 10, axialTilt: 3.1, scale: 121, mass: 1898 },
        { name: "Saturn", model: "assets/Saturn.glb", distance: 3178, orbitPeriod: 10755.70, rotationPeriod: 0.45 * 10, axialTilt: 26.7, scale: 862, mass: 568 },
        { name: "Uranus", model: "assets/Uranus.glb", distance: 63780, orbitPeriod: 30687.15, rotationPeriod: -0.72 * 10, axialTilt: 97.8, scale: 372, mass: 86.8 },
        { name: "Neptune", model: "assets/Neptune.glb", distance: 10000, orbitPeriod: 60190.03, rotationPeriod: 0.67 * 10, axialTilt: 28.3, scale: 356, mass: 102 }
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
                rotationSpeed: (1 / data.rotationPeriod) * .05,
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
            planet.userData.angle += planet.userData.orbitSpeed;
            planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
            planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
            planet.rotation.y += planet.userData.rotationSpeed;

            const distance = camera.position.distanceTo(planet.position);
            planet.userData.label.position.set(planet.position.x, planet.position.y + 4, planet.position.z); 
            const labelScale = Math.max(40, distance / 2); 
            planet.userData.label.scale.set(labelScale, labelScale, 20);
            planet.userData.label.lookAt(camera.position);
        }
    });
    // Zoom
    if (selectedPlanet && zooming) {
        const baseZoomDistance = 200000;
        const zoomAdjustmentFactor = selectedPlanet.scale.x * 100;
        const zoomDistance = baseZoomDistance + zoomAdjustmentFactor;
        const planetPosition = selectedPlanet.position;
        const direction = new THREE.Vector3().subVectors(camera.position, planetPosition).normalize();
        const targetPosition = new THREE.Vector3().copy(planetPosition).add(direction.multiplyScalar(zoomDistance));

        camera.position.lerp(targetPosition, 0.05);
        camera.lookAt(planetPosition);
    }
}

camera.position.z = 3000000;
camera.position.y = 500000;

function loadSun(scene) {
    const loader = new THREE.GLTFLoader();
    
    loader.load('assets/Sun.glb', gltf => {
        const sun = gltf.scene;
        sun.scale.set(1000, 1000, 1000);
        scene.add(sun);
        const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 0, 10).normalize();
        directionalLight.castShadow = true;
        scene.add(directionalLight);
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
    if (timeDiff < 300) {
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
