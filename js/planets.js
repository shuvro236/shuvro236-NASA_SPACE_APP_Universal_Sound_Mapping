const loader = new THREE.GLTFLoader();
const planets = [];
let selectedPlanet = null;
let zooming = false;

// Data for each planet
const planetsData = [
    { name: "Mercury", model: "Mercury.glb", distance: 57.91, orbitPeriod: 87.96, rotationPeriod: 58.64, axialTilt: 0 },
    { name: "Venus", model: "Venus.glb", distance: 108.20, orbitPeriod: 224.68, rotationPeriod: 243, axialTilt: 177.4 },
    { name: "Earth", model: "Earth.glb", distance: 149.60, orbitPeriod: 365.26, rotationPeriod: 1, axialTilt: 23.4 },
    { name: "Mars", model: "Mars.glb", distance: 227.90, orbitPeriod: 686.95, rotationPeriod: 1.025, axialTilt: 25.2 }
];

// Load planets
planetsData.forEach(data => {
    loader.load(data.model, gltf => {
        const planet = gltf.scene;
        planet.scale.set(0.01, 0.01, 0.01);
        scene.add(planet);

        planet.userData = {
            name: data.name,
            distance: data.distance * 10,  // Adjust for visualization
            orbitSpeed: (1 / data.orbitPeriod) * 50,
            rotationSpeed: (1 / data.rotationPeriod) * 0.05,
            angle: Math.random() * Math.PI * 2,
            axialTilt: data.axialTilt
        };

        planet.rotation.z = THREE.MathUtils.degToRad(planet.userData.axialTilt);
        planets.push(planet);
    }, undefined, error => {
        console.error('Error loading model:', error);
    });
});

//text label for each planet
function createTextLabel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold 50px Arial';
    context.fillStyle = 'white';
    context.fillText(text, 0, 50);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(20, 10, 1);
    return sprite;
}
