// audio.js

const audioLoader = new THREE.AudioLoader();
const listener = new THREE.AudioListener();

// Create an object to store planet sounds
const planetSounds = {};

// Define sounds for different distance ranges
const distanceRanges = [
    { min: 0, max: 600, sound: 'sounds/close.mp3' },
    { min: 600, max: 1200, sound: 'sounds/midrange.mp3' },
    { min: 1200, max: Infinity, sound: 'sounds/distant.mp3' },
];

// Function to map distance to the correct sound file
function getSoundByDistance(distance) {
    for (const range of distanceRanges) {
        if (distance >= range.min && distance < range.max) {
            return range.sound;
        }
    }
    return null;
}

// Function to load audio for planets
function loadPlanetSounds(planets) {
    planets.forEach(planet => {
        const sound = new THREE.PositionalAudio(listener);
        const soundFile = getSoundByDistance(planet.userData.distance);

        if (soundFile) {
            audioLoader.load(soundFile, buffer => {
                sound.setBuffer(buffer);
                sound.setRefDistance(200);
                sound.setLoop(true);
                sound.play();
            });
        }

        planet.add(sound);
        planetSounds[planet.userData.name] = sound;
    });
}

// Function to play sound on planet click
function playSound(planet) {
    const sound = planetSounds[planet.userData.name];
    if (sound && !sound.isPlaying) {
        sound.play();
    }
}

// Function to stop sound on double-click
function stopSound(planet) {
    const sound = planetSounds[planet.userData.name];
    if (sound && sound.isPlaying) {
        sound.stop();
    }
}

export { loadPlanetSounds, playSound, stopSound, listener };
