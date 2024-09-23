function loadSun(scene, camera) {
    const loader = new THREE.GLTFLoader();
    
    loader.load('assets/Sun.glb', gltf => {
        const sun = gltf.scene;
        sun.scale.set(0.05, 0.05, 0.05);
        scene.add(sun);

        // Set the Sun's rotation speed
        sun.userData = {
            rotationSpeed: 0.001
        };

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(20, 20, 20).normalize();
        scene.add(directionalLight);

        // Sun's rotation
        function animateSun() {
            sun.rotation.y += sun.userData.rotationSpeed;
        }

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            animateSun();
        }
        animate();
    }, undefined, error => {
        console.error('Error loading Sun model:', error);
    });
}

export { loadSun };
