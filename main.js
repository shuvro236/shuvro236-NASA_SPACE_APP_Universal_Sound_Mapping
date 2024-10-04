// main.js
let selectedPlanet = null;
let zooming = false;
let audioPlaying = null; 
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.07, 10000000000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const planets = [];

// Load the background texture
const backgroundLoader = new THREE.TextureLoader();
backgroundLoader.load('assets/ba.jpg', function(texture) {
    scene.background = texture;  // Set the texture as the scene's background
});

// Distance ranges
const audioFiles = {
    close: new Audio('assets/sounds/C.mp3'),  
    medium: new Audio('assets/sounds/D.mp3'),  
    far: new Audio('assets/sounds/G.mp3')
};

// Mass-based sounds
const massAudioFiles = {
    lowMass: new Audio('assets/sounds/25.mp3'), 
    mediumMass: new Audio('assets/sounds/55.mp3'), 
    highMass: new Audio('assets/sounds/75.mp3')  
};

const planetTypeAudioFiles = {
    habitable: new Audio('assets/sounds/Guitar.mp3'), 
    gasGiant: new Audio('assets/sounds/untitled.mp3')     // Flute sound for gas giants
};

Object.values(audioFiles).forEach(audio => {
    audio.loop = true;
});

Object.values(massAudioFiles).forEach(audio => {
    audio.loop = true;
});

Object.values(planetTypeAudioFiles).forEach(audio => {
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
            distance: 57.91,
            orbitPeriod: 88,
            rotationPeriod: 58.65 * 60 * 60 * 1000, 
            axialTilt: 0.034,
            scale: 0.383, 
            mass: 0.330,
            type: 'rockey', 
            description: "Mercury is the smallest planet in our solar system and closest to the Sun. It has no atmosphere and experiences extreme temperature fluctuations."
        },
        {
            name: "Venus",
            model: "assets/Venus.glb",
            distance: 108.21, 
            orbitPeriod: 225, 
            rotationPeriod: 243 * 60 * 60 * 1000, 
            axialTilt: 177.4, 
            scale: 0.949, 
            mass: 0.815,
            type: 'rockey', 
            description: "Venus has a thick atmosphere that traps heat, making it the hottest planet in our solar system. Its rotation is slower than its orbit around the Sun."
        },
        {
            name: "Earth",
            model: "assets/Earth.glb",
            distance: 149.6,
            orbitPeriod: 365.26, 
            rotationPeriod: 1 * 60 * 60 * 1000,
            axialTilt: 23.5,
            scale: 1,
            mass: 1, 
            type: 'habitable', 
            description: "Earth—our home planet—is the only place we know of so far that’s inhabited by living things. It's also the only planet in our solar system with liquid water on the surface.Earth is only the fifth largest planet in the solar system, just slightly larger than nearby Venus. Earth is the biggest of the four planets closest to the Sun, all of which are made of rock and metal."
        },
        {
            name: "Mars",
            model: "assets/Mars.glb",
            distance: 227.92, 
            orbitPeriod: 687, 
            rotationPeriod: 1.025 * 60 * 60 * 1000, 
            axialTilt: 25.2, 
            scale: 0.532, 
            mass: 0.107,
            type: 'none', 
            description: "The fourth planet from the Sun, Mars is a dusty, cold, desert world with a very thin atmosphere. Mars was named by the ancient Romans for their god of war because its reddish color was reminiscent of blood. The Red Planet is actually many colors. At the surface we see colors such as brown, gold and tan."
        },
        {
            name: "Jupiter",
            model: "assets/Jupiter.glb",
            distance: 778.57, 
            orbitPeriod: 4331, 
            rotationPeriod: 0.41 * 60 * 60 * 1000, 
            axialTilt: 3.1,
            scale: 11.21, 
            mass: 317.8, 
            type: 'gasGiant', 
            description: "Gas Giant Jupiter is the fifth planet from our Sun and is, by far, the largest planet in the solar system – more than twice as massive as all the other planets combined.Jupiter's stripes and swirls are actually cold, windy clouds of ammonia and water, floating in an atmosphere of hydrogen and helium. Jupiter’s iconic Great Red Spot is a giant storm bigger than Earth that has raged for hundreds of years."
        },
        {
            name: "Saturn",
            model: "assets/Saturn.glb",
            distance: 1433.5, 
            orbitPeriod: 10747,
            rotationPeriod: 0.45 * 60 * 60 * 1000,
            axialTilt: 26.7, 
            scale: 9.45, 
            mass: 95.2, 
            type: 'none', 
            description: "Saturn is known for its stunning ring system, made of ice and rock particles. It is the second-largest planet in our solar system."
        },
        {
            name: "Uranus",
            model: "assets/Uranus.glb",
            distance: 2872.5, 
            orbitPeriod: 30589, 
            rotationPeriod: -0.72 * 60 * 60 * 1000,
            axialTilt: 97.8, 
            scale: 4.01, 
            mass: 14.5, 
            type: 'none', 
            description: "Uranus has a unique sideways rotation and is the coldest planet in the solar system. Its bluish color comes from methane in the atmosphere."
        },
        {
            name: "Neptune",
            model: "assets/Neptune.glb",
            distance: 4495.1, 
            orbitPeriod: 59800,
            rotationPeriod: 0.67 * 60 * 60 * 1000,
            axialTilt: 28.3,
            scale: 3.88,
            mass: 17.1,  
            type: 'none', 
            description: "Neptune is known for its deep blue color and strong winds. It is the farthest planet from the Sun and has a storm system similar to Jupiter's."
        }
    ];

    planetsData.forEach(data => {
        loader.load(data.model, gltf => { 
            const planet = gltf.scene;
            planet.scale.set(data.scale, data.scale, data.scale);
            scene.add(planet);

            planet.userData = {
                name: data.name,
                distance: data.distance / 0.00008, // Adjusted distance
                orbitSpeed: (1 / data.orbitPeriod) * .1,
                rotationSpeed: (1 / data.rotationPeriod) *100,
                angle: Math.random() * Math.PI * 2,
                axialTilt: data.axialTilt,
                mass: data.mass,
                type: data.type,
                description: data.description 
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
        const smallPlanetThreshold = 0.5;
        
        if (selectedPlanet.scale.x > bigPlanetThreshold) {
            zoomAdjustmentFactor = 4500; 
            console.log("Big planet zoom adjustment:", zoomAdjustmentFactor);  
        } else if (selectedPlanet.scale.x <= smallPlanetThreshold) {
            zoomAdjustmentFactor = -12000; 
            console.log("Small planet zoom adjustment:", zoomAdjustmentFactor);  
        } else if (selectedPlanet.scale.x > smallPlanetThreshold && selectedPlanet.scale.x <= bigPlanetThreshold) {
            zoomAdjustmentFactor = -1000; 
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

        if (camera.position.distanceTo(planetPosition) < zoomDistance * 0.1) {
            zooming = false;
        }
    }
}

camera.position.z = 1030000;
camera.position.y = 1055000;

function loadSun(scene) {
    const loader = new THREE.GLTFLoader();
    
    loader.load('assets/Sun.glb', gltf => {
        const sun = gltf.scene;
        sun.scale.set(150, 150, 150);
        scene.add(sun);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5); 
        scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(100, 100, 100); 
        directionalLight.target.position.set(0, 0, 0); 
        directionalLight.target.updateMatrixWorld(); 
        scene.add(directionalLight);
        scene.add(directionalLight.target); 

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
        audioPlaying = null; 
    }

    // Stop all mass audio
    Object.values(massAudioFiles).forEach(audio => {
        audio.pause();
        audio.currentTime = 0; 
    });

    Object.values(planetTypeAudioFiles).forEach(audio => {
        audio.pause();
        audio.currentTime = 0; 
    });
}

// Click event listener
let lastClickTime = 0;
window.addEventListener('click', (event) => {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime;

    
    if (timeDiff < 500) {
        
        stopAllAudio();
        selectedPlanet = null; 
        zooming = false; 
        hidePlanetDetailsSidebar();
        return;
    }

    lastClickTime = currentTime;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    
    raycaster.setFromCamera(mouse, camera);
    const planetIntersects = raycaster.intersectObjects(planets);

    if (planetIntersects.length > 0) {
        const planet = planetIntersects[0].object;
        handlePlanetClick(planet);
    }

    const labels = planets.map(planet => planet.userData.label);
    const labelIntersects = raycaster.intersectObjects(labels);

    if (labelIntersects.length > 0) {
        const label = labelIntersects[0].object;
        const planet = planets.find(planet => planet.userData.label === label);
        if (planet) handlePlanetClick(planet);
    }
});

// Handle planet clicks
function handlePlanetClick(planet) {
    selectedPlanet = planet;
    zooming = true;

    const distance = selectedPlanet.userData.distance;
    const habit = selectedPlanet.userData.type;

    stopAllAudio();

    if (distance < 10000000) {
        audioPlaying = audioFiles.close;
    } else if (distance < 200000000) { 
        audioPlaying = audioFiles.medium;
    } else {
        audioPlaying = audioFiles.far; 
    }


    if (audioPlaying) {
        audioPlaying.play();
    }

    if (selectedPlanet.userData.mass < 0.5) {
        massAudioFiles.lowMass.play();
    } else if (selectedPlanet.userData.mass < 1.0) {
        massAudioFiles.mediumMass.play();
    } else {
        massAudioFiles.highMass.play();
    }

    
    if (habit === 'habitable') {
        planetTypeAudioFiles.habitable.play();
    
    } else if (habit === 'gasGiant') {
        planetTypeAudioFiles.gasGiant.play();
    }
    updatePlanetDetailsSidebar(selectedPlanet.userData);
}

function updatePlanetDetailsSidebar(planet) {
    const sidebar = document.getElementById('planet-details-sidebar');
    const planetName = document.getElementById('planet-name');
    const planetDescription = document.getElementById('planet-description');

    planetName.textContent = planet.name;
    planetDescription.textContent = planet.description; 
    sidebar.classList.add('open');
}


const planet = {
    name: 'Sun',
    description: 'The Sun—the heart of our solar system—is a yellow dwarf star, a hot ball of glowing gases. Its gravity holds the solar system together, keeping everything from the biggest planets to the smallest particles of debris in its orbit. Electric currents in the Sun generate a magnetic field that is carried out through the solar system by the solar wind—a stream of electrically charged gas blowing outward from the Sun in all directions.'
};

updatePlanetDetailsSidebar(planet);



function hidePlanetDetailsSidebar() {
    const sidebar = document.getElementById('planet-details-sidebar');
    sidebar.classList.remove('open'); 
}


document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-sidebar');
    closeBtn.addEventListener('click', () => {
        hidePlanetDetailsSidebar();
        resetPlanetSelection();
    });
});


function resetPlanetSelection() {
    selectedPlanet = null;
    zooming = false;
    hidePlanetDetailsSidebar(); 
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
