import { loadPlanets, updatePlanets, planets } from './planets.js';
import { loadSun } from './sun.js';

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

// Load sun and planets
loadSun(scene, camera);
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
