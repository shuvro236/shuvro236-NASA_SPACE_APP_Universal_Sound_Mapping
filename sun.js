// Merged File

let selectedPlanet = null;
let zooming = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls for zooming and rotation
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const planets = [];

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
    sprite.scale.set(25, 12.5, 1);  
    return sprite;
}

// Load planets into the scene
function loadPlanets(scene, raycaster, mouse, planets, onPlanetClick) {
    const loader = new THREE.GLTFLoader();
    const planetsData = [
        { name: "Mercury", model: "assets/Mercury.glb", distance: 57.91 * 10, orbitPeriod: 87.96 * 10, rotationPeriod: 58.64 * 10, axialTilt: 0 },
        { name: "Venus", model: "assets/Venus.glb", distance: 108.20 * 10, orbitPeriod: 224.68 * 10, rotationPeriod: 243 * 10, axialTilt: 177.4 },
        { name: "Earth", model: "assets/Earth.glb", distance: 149.60 * 10, orbitPeriod: 365.26 * 10, rotationPeriod: 1 * 10, axialTilt: 23.4 },
        { name: "Mars", model: "assets/Mars.glb", distance: 227.90 * 10, orbitPeriod: 686.95 * 10, rotationPeriod: 1.025 * 10, axialTilt: 25.2 },
        { name: "Jupiter", model: "assets/Jupiter.glb", distance: 778.57 * 10, orbitPeriod: 4332.59 * 10, rotationPeriod: 0.41 * 10, axialTilt: 3.1 },
        { name: "Saturn", model: "assets/Saturn.glb", distance: 1433.53 * 10, orbitPeriod: 10759 * 10, rotationPeriod: 0.45 * 10, axialTilt: 26.7 },
        { name: "Uranus", model: "assets/Uranus.glb", distance: 2872.46 * 10, orbitPeriod: 30687 * 10, rotationPeriod: -0.72 * 10, axialTilt: 97.8 },
        { name: "Neptune", model: "assets/Neptune.glb", distance: 4495.06 * 10, orbitPeriod: 60190 * 10, rotationPeriod: 0.67 * 10, axialTilt: 28.3 }
    ];

    planetsData.forEach(data => {
        loader.load(data.model, gltf => {
            const planet = gltf.scene;
            planet.scale.set(0.02, 0.02, 0.02);
            scene.add(planet);

            planet.userData = {
                name: data.name,
                distance: data.distance / 10,
                orbitSpeed: (1 / data.orbitPeriod) * 1,
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

// Update planet positions
function updatePlanets(planets, selectedPlanet, zooming, camera) {
    planets.forEach(planet => {
        if (planet.userData) {
            planet.userData.angle += planet.userData.orbitSpeed;
            planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
            planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
            planet.rotation.y += planet.userData.rotationSpeed;

            planet.userData.label.position.set(planet.position.x, planet.position.y + 15, planet.position.z);
            const distance = camera.position.distanceTo(planet.position);
            const scale = Math.max(50, 20000 / distance);
            planet.userData.label.scale.set(scale, scale, scale);
        }
    });

    if (selectedPlanet && zooming) {
        camera.position.lerp(new THREE.Vector3(
            selectedPlanet.parent.position.x,
            selectedPlanet.parent.position.y + 11,
            selectedPlanet.parent.position.z + .001
        ), 0.05);
        camera.lookAt(selectedPlanet.parent.position);
    }
}

// Load the Sun model
function loadSun(scene) {
    const loader = new THREE.GLTFLoader();
    
    loader.load('assets/Sun.glb', gltf => {
        const sun = gltf.scene;
        sun.scale.set(0.5, 0.5, 0.5);
        scene.add(sun);

        sun.userData = { rotationSpeed: 0.001 };

        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(20, 20, 20).normalize();
        scene.add(directionalLight);

        function animateSun() {
            sun.rotation.y += sun.userData.rotationSpeed;
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
    updatePlanets(planets, selectedPlanet, zooming, camera);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// Mouse click event
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets, true);
    
    if (intersects.length > 0) {
        selectedPlanet = intersects[0].object;
        zooming = true;
    }
});

// Reset camera on double click
window.addEventListener('dblclick', () => {
    selectedPlanet = null;
    zooming = false;
    camera.position.set(0, 0, 400);
});
