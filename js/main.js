// Animate the Sun's rotation
function animateSun(sun) {
    if (sun) {
        sun.rotation.y += sun.userData.rotationSpeed;
    }
}

// Animate the scene
function animate() {
    requestAnimationFrame(animate);

    // Update each planet's orbit and self-rotation
    planets.forEach(planet => {
        if (planet.userData) {
            planet.userData.angle += planet.userData.orbitSpeed;



            // Update position based on orbit (circular motion)
            planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
            planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);

            
            // Rotate the planet on its axis
            planet.rotation.y += planet.userData.rotationSpeed;
        }
    });

    // Handle camera zoom
    if (selectedPlanet && zooming) {
        camera.position.lerp(new THREE.Vector3(
            selectedPlanet.position.x,
            selectedPlanet.position.y + 20,
            selectedPlanet.position.z + 50
        ), 0.05);
        camera.lookAt(selectedPlanet.position);
    }

    renderer.render(scene, camera);
}

// Mouse click event to zoom into planets
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

animate();
