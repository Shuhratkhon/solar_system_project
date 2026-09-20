import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl =
    "https://yahdltcbqrlepdtittdw.supabase.co";

const supabaseKey =
    "sb_publishable_w597cITNuGIRj_laJKpd4A_BVsxT9g6";

const supabase =
    createClient(
        supabaseUrl,
        supabaseKey
    );

const likeButton =
    document.getElementById("likeButton");

const likeCount =
    document.getElementById("likeCount");

const likeIcon =
    document.getElementById("likeIcon");

let userLiked = false;
let likeBusy = false;


async function ensureAnonymousUser() {

    const {
        data: sessionData,
        error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {

        console.error(
            "Session error:",
            sessionError
        );

        return null;
    }

    if (sessionData.session?.user) {

        return sessionData.session.user;
    }

    const {
        data,
        error
    } = await supabase.auth.signInAnonymously();

    if (error) {

        console.error(
            "Anonymous sign-in error:",
            error
        );

        return null;
    }

    if (!data.user) {

        console.error(
            "Anonymous sign-in returned no user."
        );

        return null;
    }

    console.log(
        "Anonymous user created:",
        data.user.id
    );

    return data.user;
}


async function updateLikeState() {

    const user =
        await ensureAnonymousUser();

    if (!user) {

        likeButton.disabled = true;

        return;
    }

    const {
        data,
        error
    } = await supabase
        .from("user_likes")
        .select("user_id")
        .eq(
            "user_id",
            user.id
        )
        .maybeSingle();

    if (error) {

        console.error(
            "Like state error:",
            error
        );

        return;
    }

    userLiked =
        !!data;

    likeIcon.textContent =
        userLiked ? "♥" : "♡";
}


async function loadLikeCount() {

    const {
        data,
        error
    } = await supabase
        .from("likes")
        .select("count")
        .eq("id", 1)
        .maybeSingle();

    if (error) {

        console.error(
            "Like count error:",
            error
        );

        return;
    }

    if (data) {

        likeCount.textContent =
            data.count;
    }
}


likeButton.addEventListener(
    "click",
    async () => {

        if (likeBusy) {
            return;
        }

        likeBusy = true;
        likeButton.disabled = true;

        const user =
            await ensureAnonymousUser();

        if (!user) {

            console.error(
                "Like cancelled: no authenticated user."
            );

            likeButton.disabled = false;
            likeBusy = false;

            return;
        }

        const {
            data,
            error
        } = await supabase.rpc(
            "toggle_like"
        );

        if (error) {

            console.error(
                "Like error:",
                error
            );

            likeButton.disabled = false;
            likeBusy = false;

            return;
        }

        userLiked =
            !userLiked;

        likeIcon.textContent =
            userLiked ? "♥" : "♡";

        if (data !== null) {

            likeCount.textContent =
                data;
        }

        likeButton.disabled = false;
        likeBusy = false;
    }
);

updateLikeState();
loadLikeCount();

supabase
    .channel("likes-realtime")
    .on(
        "postgres_changes",
        {
            event: "UPDATE",
            schema: "public",
            table: "likes",
            filter: "id=eq.1"
        },
        (payload) => {

            if (
                payload.new &&
                payload.new.count !== undefined
            ) {

                likeCount.textContent =
                    payload.new.count;
            }
        }
    )
    .subscribe();


import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

let showcasePlanet = null;
let showcaseScene = null;
let showcaseCamera = null;
let showcaseRenderer = null;

const canvas = document.getElementById("space");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.00035);

const camera = new THREE.PerspectiveCamera(
    48,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 105, 175);

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

showcaseScene =
    new THREE.Scene();

const showcaseAmbient =
    new THREE.AmbientLight(
        0xffffff,
        0.45
    );

showcaseScene.add(
    showcaseAmbient
);

const showcaseLight =
    new THREE.DirectionalLight(
        0xffffff,
        2.5
    );

showcaseLight.position.set(
    5,
    3,
    8
);

showcaseScene.add(
    showcaseLight
);

showcaseCamera =
    new THREE.PerspectiveCamera(
        35,
        1,
        0.1,
        100
    );

showcaseRenderer =
    new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
    });

showcaseRenderer.setClearColor(
    0x000000,
    1
);

showcaseRenderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

showcaseRenderer.outputColorSpace =
    THREE.SRGBColorSpace;

showcaseRenderer.toneMapping =
    THREE.ACESFilmicToneMapping;

showcaseRenderer.toneMappingExposure =
    1.15;

const planetDisplay =
    document.getElementById(
        "planetDisplay"
    );

planetDisplay.appendChild(
    showcaseRenderer.domElement
);


const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(
    scene,
    camera
);

composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(
        window.innerWidth,
        window.innerHeight
    ),
    0.65,
    0.7,
    0.2
);

composer.addPass(bloomPass);

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.035;
controls.enablePan = false;
controls.minDistance = 8;
controls.maxDistance = 500;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;
controls.target.set(0, 0, 0);
controls.enabled = true;


/* lighting */

const ambientLight = new THREE.AmbientLight(
    0xffffff,
    0.08
);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(
    0xffd7a0,
    5200,
    400,
    1.4
);

sunLight.position.set(
    -65,
    0,
    0
);

scene.add(sunLight);
const softFill = new THREE.DirectionalLight(
    0x9bb8ff,
    0.12
);

softFill.position.set(
    80,
    100,
    100
);
scene.add(softFill);


/* star field */

const starPositions = [];
const starCount = 500;

for (let i = 0; i < starCount; i++) {
    const radius = 250 + Math.random() * 350;
    const theta = Math.random() * Math.PI * 2;
    const phi =
        Math.acos(
            THREE.MathUtils.randFloatSpread(2)
        );
    const x =
        radius *
        Math.sin(phi) *
        Math.cos(theta);
    const y =
        radius *
        Math.cos(phi);
    const z =
        radius *
        Math.sin(phi) *
        Math.sin(theta);
    starPositions.push(x, y, z);
}

const starGeometry =
    new THREE.BufferGeometry();

starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
        starPositions,
        3
    )
);

const starMaterial =
    new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.55,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
    });

const stars =
    new THREE.Points(
        starGeometry,
        starMaterial
    );
scene.add(stars);


/* space dust */

const dustPositions = [];
for (let i = 0; i < 350; i++) {
    const radius =
        120 + Math.random() * 180;
    const angle =
        Math.random() * Math.PI * 2;
    const x =
        Math.cos(angle) *
        radius *
        (0.5 + Math.random() * 0.5);
    const z =
        Math.sin(angle) *
        radius;
    const y =
        THREE.MathUtils.randFloatSpread(80);
    dustPositions.push(
        x,
        y,
        z
    );
}

const dustGeometry =
    new THREE.BufferGeometry();
dustGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
        dustPositions,
        3
    )
);

const dustMaterial =
    new THREE.PointsMaterial({
        color: 0xaaaeb8,
        size: 0.25,
        transparent: true,
        opacity: 0.25,
        sizeAttenuation: true
    });

const dust =
    new THREE.Points(
        dustGeometry,
        dustMaterial
    );

scene.add(dust);


/* textures */

function createTexture(type) {
    const width = 1024;
    const height = 512;
    const canvas =
        document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context =
        canvas.getContext("2d");

    if (type === "earth") {
        context.fillStyle = "#17395c";
        context.fillRect(
            0,
            0,
            width,
            height
        );

        for (let i = 0; i < 35; i++) {
            const x =
                Math.random() * width;
            const y =
                Math.random() * height;
            const w =
                35 + Math.random() * 130;
            const h =
                20 + Math.random() * 80;
            context.fillStyle =
                i % 3 === 0
                    ? "#4d7047"
                    : "#335f3c";
            context.beginPath();
            context.ellipse(
                x,
                y,
                w,
                h,
                Math.random(),
                0,
                Math.PI * 2
            );
            context.fill();
        }

        for (let i = 0; i < 100; i++) {
            const x =
                Math.random() * width;
            const y =
                Math.random() * height;
            context.fillStyle =
                "rgba(255,255,255,0.10)";
            context.beginPath();
            context.ellipse(
                x,
                y,
                15 + Math.random() * 45,
                2 + Math.random() * 8,
                Math.random(),
                0,
                Math.PI * 2
            );
            context.fill();
        }

    } else if (type === "jupiter") {

        const gradient =
            context.createLinearGradient(
                0,
                0,
                0,
                height
            );

        gradient.addColorStop(0, "#9b7655");
        gradient.addColorStop(0.25, "#d4b083");
        gradient.addColorStop(0.5, "#806047");
        gradient.addColorStop(0.72, "#c7a077");
        gradient.addColorStop(1, "#725441");

        context.fillStyle = gradient;
        context.fillRect(
            0,
            0,
            width,
            height
        );

        for (let y = 0; y < height; y += 18) {

            context.fillStyle =
                Math.random() > 0.5
                    ? "rgba(255,240,210,0.12)"
                    : "rgba(60,35,25,0.12)";

            context.fillRect(
                0,
                y,
                width,
                6 + Math.random() * 9
            );
        }

        context.fillStyle =
            "rgba(145,65,40,0.75)";
        context.beginPath();
        context.ellipse(
            710,
            330,
            85,
            38,
            -0.1,
            0,
            Math.PI * 2
        );
        context.fill();

    } else if (type === "mars") {
        context.fillStyle = "#793626";
        context.fillRect(
            0,
            0,
            width,
            height
        );

        for (let i = 0; i < 150; i++) {
            const x =
                Math.random() * width;
            const y =
                Math.random() * height;
            const size =
                2 + Math.random() * 12;
            context.fillStyle =
                Math.random() > 0.5
                    ? "rgba(180,90,55,0.35)"
                    : "rgba(45,20,15,0.35)";
            context.beginPath();
            context.arc(
                x,
                y,
                size,
                0,
                Math.PI * 2
            );
            context.fill();
        }

    } else if (type === "mercury") {
        context.fillStyle = "#77736d";
        context.fillRect(
            0,
            0,
            width,
            height
        );

        for (let i = 0; i < 170; i++) {
            const x =
                Math.random() * width;
            const y =
                Math.random() * height;
            const size =
                2 + Math.random() * 15;
            context.fillStyle =
                Math.random() > 0.5
                    ? "rgba(35,35,35,0.3)"
                    : "rgba(220,220,220,0.15)";
            context.beginPath();
            context.arc(
                x,
                y,
                size,
                0,
                Math.PI * 2
            );
            context.fill();
        }

    } else if (type === "venus") {
        context.fillStyle = "#c89e61";
        context.fillRect(
            0,
            0,
            width,
            height
        );

        for (let y = 0; y < height; y += 22) {
            context.strokeStyle =
                "rgba(255,235,185,0.15)";
            context.lineWidth =
                8 + Math.random() * 10;
            context.beginPath();
            context.moveTo(
                0,
                y
            );

            context.bezierCurveTo(
                width * 0.25,
                y - 25,
                width * 0.7,
                y + 25,
                width,
                y
            );
            context.stroke();
        }

    } else if (type === "saturn") {
        context.fillStyle = "#b79b70";
        context.fillRect(
            0,
            0,
            width,
            height
        );

        for (let y = 0; y < height; y += 30) {
            context.fillStyle =
                Math.random() > 0.5
                    ? "rgba(255,240,200,0.12)"
                    : "rgba(75,50,30,0.12)";
            context.fillRect(
                0,
                y,
                width,
                12
            );
        }

    } else if (type === "uranus") {
        context.fillStyle = "#79adb7";
        context.fillRect(
            0,
            0,
            width,
            height
        );

        for (let y = 0; y < height; y += 35) {
            context.strokeStyle =
                "rgba(255,255,255,0.08)";
            context.lineWidth = 7;
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }

    } else if (type === "neptune") {
        context.fillStyle = "#315da8";
        context.fillRect(
            0,
            0,
            width,
            height
        );

        for (let i = 0; i < 35; i++) {
            context.strokeStyle =
                "rgba(150,190,255,0.12)";
            context.lineWidth =
                4 + Math.random() * 8;
            const y =
                Math.random() * height;
            context.beginPath();
            context.moveTo(0, y);
            context.bezierCurveTo(
                width * 0.3,
                y - 20,
                width * 0.7,
                y + 20,
                width,
                y
            );
            context.stroke();
        }

    } else {
        context.fillStyle = "#aaaaaa";
        context.fillRect(
            0,
            0,
            width,
            height
        );
    }

    const texture =
        new THREE.CanvasTexture(canvas);
    texture.colorSpace =
        THREE.SRGBColorSpace;
    texture.anisotropy =
        renderer.capabilities.getMaxAnisotropy();
    return texture;
}


/* atmosphere */

function createAtmosphere(
    radius,
    color,
    strength
) {

    const geometry =
        new THREE.SphereGeometry(
            radius * 1.035,
            64,
            64
        );

    const material =
        new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.BackSide,
            blending:
                THREE.AdditiveBlending,
            depthWrite: false,
            uniforms: {
                atmosphereColor: {
                    value: new THREE.Color(color)
                },
                intensity: {
                    value: strength
                }
            },

            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vWorldPosition;

                void main() {
                    vNormal =
                        normalize(
                            normalMatrix *
                            normal
                        );
                    vec4 worldPosition =
                        modelMatrix *
                        vec4(position, 1.0);
                    vWorldPosition =
                        worldPosition.xyz;
                    gl_Position =
                        projectionMatrix *
                        viewMatrix *
                        worldPosition;
                }
            `,

            fragmentShader: `
                uniform vec3 atmosphereColor;
                uniform float intensity;
                varying vec3 vNormal;
                varying vec3 vWorldPosition;

                void main() {
                    vec3 viewDirection =
                        normalize(
                            cameraPosition -
                            vWorldPosition
                        );
                    float fresnel =
                        pow(
                            1.0 -
                            abs(
                                dot(
                                    vNormal,
                                    viewDirection
                                )
                            ),
                            3.5
                        );

                    float alpha =
                        fresnel *
                        intensity;

                    gl_FragColor =
                        vec4(
                            atmosphereColor,
                            alpha
                        );
                }
            `
        });


    return new THREE.Mesh(
        geometry,
        material
    );
}


/* sun */

const sunGeometry =
    new THREE.SphereGeometry(
        8.5,
        64,
        64
    );

const sunMaterial =
    new THREE.ShaderMaterial({
        uniforms: {
            time: {
                value: 0
            }
        },

        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vNormal = normal;
                vPosition = position;
                gl_Position =
                    projectionMatrix *
                    modelViewMatrix *
                    vec4(
                        position,
                        1.0
                    );
            }
        `,

        fragmentShader: `
            uniform float time;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                float wave =
                    sin(
                        vPosition.y * 1.8 +
                        time * 0.3
                    );
                float wave2 =
                    sin(
                        vPosition.x * 2.4 -
                        time * 0.22
                    );
                float intensity =
                    0.92 +
                    wave * 0.035 +
                    wave2 * 0.025;
                vec3 color =
                    vec3(
                        1.0,
                        0.48,
                        0.10
                    ) *
                    intensity;
                gl_FragColor =
                    vec4(
                        color,
                        1.0
                    );
            }
        `
    });

const sun =
    new THREE.Mesh(
        sunGeometry,
        sunMaterial
    );

sun.position.set(
    0,
    0,
    0
);

scene.add(sun);


/* sun glow */

const sunGlow1 =
    new THREE.Mesh(
        new THREE.SphereGeometry(
            10.5,
            32,
            32
        ),

        new THREE.MeshBasicMaterial({
            color: 0xffa13b,
            transparent: true,
            opacity: 0.12,
            blending:
                THREE.AdditiveBlending,
            depthWrite: false
        })
    );

sunGlow1.position.copy(
    sun.position
);

scene.add(sunGlow1);

const sunGlow2 =
    new THREE.Mesh(
        new THREE.SphereGeometry(
            15,
            32,
            32
        ),

        new THREE.MeshBasicMaterial({
            color: 0xff7a20,
            transparent: true,
            opacity: 0.045,
            blending:
                THREE.AdditiveBlending,
            depthWrite: false
        })
    );

sunGlow2.position.copy(
    sun.position
);

scene.add(sunGlow2);


/* planets */

const planetData = [

    {
        name: "Mercury",
        radius: 1.25,
        distance: 19,
        orbitSpeed: 0.007,
        rotationSpeed: 0.010,
        texture: "mercury",
        atmosphere: null
    },

    {
        name: "Venus",
        radius: 2,
        distance: 27,
        orbitSpeed: 0.0055,
        rotationSpeed: -0.004,
        texture: "venus",
        atmosphere: {
            color: 0xffd38a,
            strength: 0.22
        }
    },

    {
        name: "Earth",
        radius: 2.25,
        distance: 36,
        orbitSpeed: 0.0044,
        rotationSpeed: 0.012,
        texture: "earth",
        atmosphere: {
            color: 0x4ba7ff,
            strength: 0.7
        }
    },

    {
        name: "Mars",
        radius: 1.7,
        distance: 45,
        orbitSpeed: 0.0035,
        rotationSpeed: 0.008,
        texture: "mars",
        atmosphere: {
            color: 0xd56f49,
            strength: 0.08
        }
    },

    {
        name: "Jupiter",
        radius: 6.5,
        distance: 66,
        orbitSpeed: 0.0022,
        rotationSpeed: 0.019,
        texture: "jupiter",
        atmosphere: {
            color: 0xd6b487,
            strength: 0.08
        }
    },

    {
        name: "Saturn",
        radius: 5.7,
        distance: 88,
        orbitSpeed: 0.0016,
        rotationSpeed: 0.016,
        texture: "saturn",
        atmosphere: {
            color: 0xe4c995,
            strength: 0.09
        }
    },

    {
        name: "Uranus",
        radius: 4.1,
        distance: 109,
        orbitSpeed: 0.00115,
        rotationSpeed: 0.010,
        texture: "uranus",
        atmosphere: {
            color: 0x79d7e6,
            strength: 0.2
        }
    },

    {
        name: "Neptune",
        radius: 4,
        distance: 128,
        orbitSpeed: 0.0009,
        rotationSpeed: 0.009,
        texture: "neptune",
        atmosphere: {
            color: 0x3e7cff,
            strength: 0.22
        }
    }

];

const planets = [];
const clickablePlanets = [];

function createOrbit(distance) {

    const curve =
        new THREE.EllipseCurve(
            0,
            0,
            distance,
            distance * 0.98,
            0,
            Math.PI * 2,
            false,
            0
        );

    const points =
        curve.getPoints(256);

    const geometry =
        new THREE.BufferGeometry().setFromPoints(
            points.map(
                point =>
                    new THREE.Vector3(
                        point.x,
                        0,
                        point.y
                    )
            )
        );

    const material =
        new THREE.LineBasicMaterial({
            color: 0xffffff,

            transparent: true,

            opacity: 0.07
        });

    const line =
        new THREE.LineLoop(
            geometry,
            material
        );
    scene.add(line);
}

planetData.forEach((data, index) => {

    createOrbit(data.distance);

    const geometry =
        new THREE.SphereGeometry(
            data.radius,
            64,
            64
        );

    const texture =
        createTexture(data.texture);

    const material =
        new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.9,
            metalness: 0.0
        });

    const planet =
        new THREE.Mesh(
            geometry,
            material
        );

    planet.position.set(
        Math.cos(index * 0.9) *
        data.distance,
        0,
        Math.sin(index * 0.9) *
        data.distance
    );

    planet.userData = {
        name: data.name,
        radius: data.radius,
        distance: data.distance,
        orbitSpeed: data.orbitSpeed,
        rotationSpeed: data.rotationSpeed,
        orbitAngle:
            index * 0.9
    };

    scene.add(planet);
    planets.push(planet);
    clickablePlanets.push(planet);

    if (data.atmosphere) {

        const atmosphere =
            createAtmosphere(
                data.radius,
                data.atmosphere.color,
                data.atmosphere.strength
            );

        planet.add(atmosphere);
    }

    /* saturn rings */

    if (data.name === "Saturn") {

        const ringGeometry =
            new THREE.RingGeometry(
                data.radius * 1.25,
                data.radius * 2.15,
                128
            );

        const ringMaterial =
            new THREE.MeshBasicMaterial({
                color: 0xc8b18a,
                transparent: true,
                opacity: 0.48,
                side: THREE.DoubleSide,
                depthWrite: false
            });

        const rings =
            new THREE.Mesh(
                ringGeometry,
                ringMaterial
            );

        rings.rotation.x =
            THREE.MathUtils.degToRad(65);
        planet.add(rings);
    }

    /* earth moon */

    if (data.name === "Earth") {

        const moon =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.62,
                    32,
                    32
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x9b9b98,
                    roughness: 1
                })
            );

        moon.position.set(
            5.2,
            0.4,
            0
        );

        planet.add(moon);
        planet.userData.moon =
            moon;
    }

});


/* asteroid beld */

const asteroidGeometry =
    new THREE.DodecahedronGeometry(
        0.16,
        0
    );

const asteroidMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x756d62,
        roughness: 1,
        metalness: 0
    });

const asteroidGroup =
    new THREE.Group();

scene.add(asteroidGroup);

for (let i = 0; i < 280; i++) {

    const asteroid =
        new THREE.Mesh(
            asteroidGeometry,
            asteroidMaterial
        );

    const angle =
        Math.random() *
        Math.PI *
        2;

    const distance =
        50 +
        Math.random() *
        7;

    asteroid.position.set(
        Math.cos(angle) *
        distance,
        THREE.MathUtils.randFloatSpread(1.5),
        Math.sin(angle) *
        distance
    );

    const scale =
        0.4 +
        Math.random() *
        2.2;

    asteroid.scale.setScalar(
        scale
    );

    asteroid.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );

    asteroid.userData.orbitAngle =
        angle;
    asteroid.userData.distance =
        distance;
    asteroid.userData.speed =
        0.0015 +
        Math.random() * 0.001;

    asteroidGroup.add(
        asteroid
    );
}


/* meteors */

const meteorPositions = [];

for (let i = 0; i < 70; i++) {

    const angle =
        Math.random() *
        Math.PI *
        2;

    const distance =
        145 +
        Math.random() *
        100;

    meteorPositions.push(

        Math.cos(angle) *
        distance,
        THREE.MathUtils.randFloatSpread(60),
        Math.sin(angle) *
        distance
    );
}

const meteorGeometry =
    new THREE.BufferGeometry();

meteorGeometry.setAttribute(
    "position",

    new THREE.Float32BufferAttribute(
        meteorPositions,
        3
    )
);


const meteorMaterial =
    new THREE.PointsMaterial({
        color: 0x9da0a8,
        size: 0.4,
        transparent: true,
        opacity: 0.45
    });

const meteors =
    new THREE.Points(
        meteorGeometry,
        meteorMaterial
    );

scene.add(meteors);


/* planet action */

const raycaster =
    new THREE.Raycaster();

const pointer =
    new THREE.Vector2();

const planetLabel =
    document.getElementById(
        "planetLabel"
    );

const planetLabelName =
    document.getElementById(
        "planetLabelName"
    );

let hoveredPlanet = null;
let selectedPlanet = null;
let exploring = false;

const overviewPosition =
    new THREE.Vector3(
        105,
        95,
        165
    );

const overviewTarget =
    new THREE.Vector3(
        0,
        0,
        0
    );

const cameraGoal =
    overviewPosition.clone();

const targetGoal =
    overviewTarget.clone();

function updatePointer(event) {

    pointer.x =
        (event.clientX /
            window.innerWidth) *
        2 -
        1;

    pointer.y =
        -(event.clientY /
            window.innerHeight) *
        2 +
        1;
}

window.addEventListener(
    "pointermove",
    event => {

        updatePointer(event);

        if (!exploring) {
            planetLabel.style.display =
                "none";
            hoveredPlanet = null;
            return;
        }

        raycaster.setFromCamera(
            pointer,
            camera
        );

        const intersections =
            raycaster.intersectObjects(
                clickablePlanets,
                false
            );

        if (intersections.length > 0) {
            const planet =
                intersections[0].object;

            if (hoveredPlanet !== planet) {
                hoveredPlanet =
                    planet;
                planetLabelName.textContent =
                    planet.userData.name
                        .toUpperCase();
            }

            planetLabel.style.left =
                `${event.clientX}px`;

            planetLabel.style.top =
                `${event.clientY}px`;

            planetLabel.style.display =
                "block";

        } else {
            hoveredPlanet = null;
            planetLabel.style.display =
                "none";
        }

    }
);

window.addEventListener(
    "click",
    event => {
        if (!exploring) {
            return;
        }

        updatePointer(event);

        raycaster.setFromCamera(
            pointer,
            camera
        );

        const intersections =
            raycaster.intersectObjects(
                clickablePlanets,
                false
            );

        if (intersections.length === 0) {
            return;
        }

        const planet =
            intersections[0].object;

        selectPlanet(planet);
    }
);


/* Planet window*/

function selectPlanet(planet) {

    selectedPlanet = planet;
    openPlanetWindow(
        planet.userData.name
    );
}

const planetWindow =
    document.getElementById(
        "planetWindow"
    );

const planetInfoTitle =
    document.getElementById(
        "planetInfoTitle"
    );

const planetInfoText =
    document.getElementById(
        "planetInfoText"
    );

const planetSectionLabel =
    document.querySelector(
        ".planet-section-label"
    );

const planetButtons =
    document.querySelectorAll(
        ".planet-info-button"
    );

const planetClose =
    document.getElementById(
        "planetClose"
    );
function openPlanetWindow (planetName) {

    planetWindow.classList.add(
        "visible"
    );

    if (showcasePlanet) {
        showcaseScene.remove(
            showcasePlanet
        );

        showcasePlanet = null;
    }

    controls.enabled = false;

    const displayWidth =
        planetDisplay.clientWidth;

    const displayHeight =
        planetDisplay.clientHeight;

    showcaseRenderer.setSize(
        displayWidth,
        displayHeight,
        false
    );

    showcaseCamera.aspect =
        displayWidth /
        displayHeight;

    showcaseCamera.updateProjectionMatrix();

    createPlanetShowcase(
        selectedPlanet
    );

    planetInfoTitle.textContent =
        planetName.toUpperCase();

    showPlanetSection(
        planetName,
        "type"
    );
}

function createPlanetShowcase(planet) {

    if (showcasePlanet) {
        showcaseScene.remove(
            showcasePlanet
        );
    }

    showcasePlanet =
        planet.clone(true);

    showcasePlanet.position.set(
        -3,
        2,
        0
    );

    const radius =
        planet.userData.radius;

    const showcaseRadius = 4.5;

    const showcaseScale =
        showcaseRadius / radius;

    showcasePlanet.scale.setScalar(
        showcaseScale
    );

    showcaseScene.add(
        showcasePlanet
    );

    const cameraDistance = 23;

    showcaseCamera.position.set(
        0,
        0,
        cameraDistance
    );

    showcaseCamera.lookAt(
        0,
        0,
        0
    );
}

function showPlanetSection(
    planetName,
    section
) {

    planetSectionLabel.textContent =
        section.toUpperCase();

    planetInfoTitle.textContent =
        planetName.toUpperCase();

    planetButtons.forEach(
        button => {
            button.classList.toggle(
                "active",
                button.dataset.section === section
            );
        }
    );

    planetInfoText.innerHTML =
        getPlanetInformation(
            planetName,
            section
        );
}

planetButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                if (!selectedPlanet) {
                    return;
                }

                showPlanetSection(
                    selectedPlanet.userData.name,
                    button.dataset.section
                );
            }
        );
    }
);

planetClose.addEventListener(
    "click",
    () => {
        planetWindow.classList.remove(
            "visible"
        );
        selectedPlanet = null;
    }
);


/* explore mode */

const exploreButton =
    document.getElementById(
        "exploreButton"
    );

exploreButton.addEventListener(
    "click",
    () => {

        exploring = true;
        controls.enabled = true;
        document.body.classList.add(
            "exploring"
        );

        cameraGoal.copy(
            overviewPosition
        );

        targetGoal.copy(
            overviewTarget
        );

        showMessage(
            "EXPLORE MODE"
        );
    }
);


/* Planet Information*/

function getPlanetInformation(
    planetName,
    section
) {

    const name =
        planetName.toLowerCase();


    const data = {
        mercury: {
            type: "◈ terrestrial planet",
            size: "◈ Mercury is about 0.056 Earth sizes.",
            surface: "◈ Mercury has a rocky, heavily cratered surface with extreme temperature changes.",
            moons: "NONE",
            facts: "◈ A single day on Mercury lasts twice as long as its year! It has very slow spin but fast orbit around the Sun"
        },

        venus: {
            type: "◈ terrestrial planet",
            size: "◈ Venus is about 0.857 Earth sizes.",
            surface: "◈ Venus has a rocky surface hidden under a thick, extreme atmosphere of acid clouds and radiating gas.",
            moons: "NONE",
            facts: "◈ Venus is the only planet that spins clockwise.<br>◈ Venus is the hottest and the most circular shaped planed unlike oval shapes of other planets."
        },

        earth: {
            type: "◈ terrestrial planet",
            size: "◈ Earth is about 1 Earth size. Could you guess?",
            surface: "◈ Earth has oceans, continents, mountains, deserts, forests and a constantly changing atmosphere.",
            moons: "◈ 1 — the Moon.",
            facts: "◈ Earth days are getting both longer and shorter as centuries pass:<br>longer bcz of pull of Moon, shorter bcz of gravitational pull of Sun.<br><br>◈ Around 20 living animal species outnumber humans in their own planet."
        },

        mars: {
            type: "◈ terrestrial planet",
            size: "◈ Mars is about 0.151 Earth size.",
            surface: "◈ Mars has deserts, volcanoes, valleys, impact craters and polar ice caps.",
            moons: "◈ 2 — Phobos and Deimos.",
            facts: "◈ Mars has the largest volcano known in the Solar System: Olympus Mons, 2.5/3 times as tall as Mount Everest.<br>◈ Mars has blue sunsets bcz of the interaction between Mars's rusty dust and sunlight."
        },

        jupiter: {
            type: "◈ gas giant",
            size: "◈ Jupiter is about 1,321 Earth sizes.",
            surface: "◈ Jupiter does not have a solid surface like Earth. Its visible atmosphere contains powerful storms and cloud bands.",
            moons: "◈ 95 known moons.",
            facts: "◈ Jupiter is the oldest planet in our system.<br>◈ Jupiter has its ring too, but it is a dust ring unlike other 4 giant planets' ice-mixed rings which make them visible.<br>◈ Saturn's moon Enceladus is the best candidate for life as it has global liquid saltwater ocean and thermal vents as energy source."
        },

        saturn: {
            type: "◈ gas giant",
            size: "◈ Saturn is about 764 Earth sizes.",
            surface: "◈ Saturn is a gas giant with no solid surface. Its upper atmosphere contains powerful winds and layered clouds.",
            moons: "◈ 293 known moons.",
            facts: "◈ Saturn is the only planet in the Solar system that is less dense than water, meaning it would float in a giant bathtub.<br>◈ Saturn actually has 3 main rings of rock and ice which all makes it visible as whole.<br>◈ Winds in Saturn are so strong (1800 km/h) their speed exceeds the speed of sound (1235 km/h)"
        },

        uranus: {
            type: "◈ ice giant",
            size: "◈ Uranus is about 63 Earth sizes.",
            surface: "◈ Uranus is an ice giant with a deep atmosphere and no solid surface accessible like Earth's.",
            moons: "◈ 27 known moons.",
            facts: "◈ Uranus rotates on its side like a bowling ball bcz of its past collision with twice-Earth icy planet.<br>◈ It usually rains diamonds in Uranus bcz of methane gas pressure in its atmosphere<br>◈ All 27 moons of Uranus are named after characters in Shakespeare's works."
        },

        neptune: {
            type: "◈ ice giant",
            size: "◈ Neptune is about 58 Earth sizes, 59 if you relax..",
            surface: "◈ Neptune is an ice giant with a deep atmosphere and extremely powerful winds.",
            moons: "◈ 14 known moons.",
            facts: "◈ Neptune has even stronger winds than Saturn.<br>◈ Neptune is the only planet that was found by math, exactly gravity calculations, not telescope."
        }
    };

    return data[name]?.[section]
        || "Information unavailable.";
}


/* return to overview */

window.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        selectedPlanet = null;
        exploring = false;
        controls.enabled = false;
        cameraGoal.copy(
            overviewPosition
        );
        targetGoal.copy(
            overviewTarget
        );
        document.body.classList.remove(
            "exploring"
        );

        planetLabel.style.display =
            "none";

        planetWindow.classList.remove(
            "visible"
        );

        if (showcasePlanet) {
            showcaseScene.remove(
                showcasePlanet
            );

            showcasePlanet = null;
        }

        showMessage(
            "SOLAR SYSTEM OVERVIEW"
        );
    }
);


/* quiz */

const quizButton =
    document.getElementById(
        "quizButton"
    );

quizButton.addEventListener(
    "click",
    () => {
        showMessage(
            "QUIZ MODE COMING NEXT"
        );
    }
);


/* sound */

const soundButton =
    document.getElementById(
        "soundButton"
    );

let soundEnabled = true;

soundButton.addEventListener(
    "click",
    () => {

        soundEnabled =
            !soundEnabled;

        showMessage(
            soundEnabled
                ? "SOUND ON"
                : "SOUND OFF"
        );
    }
);

/* settings */

const settingsButton =
    document.getElementById(
        "settingsButton"
    );

settingsButton.addEventListener(
    "click",
    () => {

        showMessage(
            "SETTINGS COMING LATER"
        );
    }
);


/* message */

const message =
    document.getElementById(
        "message"
    );

let messageTimer;

function showMessage(text) {
    message.textContent =
        text;
    message.classList.add(
        "show"
    );

    clearTimeout(
        messageTimer
    );

    messageTimer =
        setTimeout(
            () => {
                message.classList.remove(
                    "show"
                );
            },
            1800
        );
}


/* animation */

const clock =
    new THREE.Clock();

function animate() {

    requestAnimationFrame(
        animate
    );

    const delta =
        clock.getDelta();

    const time =
        clock.elapsedTime;

    /* sun */

    sunMaterial.uniforms.time.value =
        time;

    const pulse =
        1 +
        Math.sin(time * 0.25) *
        0.012;

    sun.scale.setScalar(
        pulse
    );

    sunGlow1.scale.setScalar(
        1 +
        Math.sin(time * 0.3) *
        0.04
    );

    sunGlow2.scale.setScalar(
        1 +
        Math.sin(time * 0.21) *
        0.06
    );

    sunLight.intensity =
        5200 +
        Math.sin(time * 0.3) *
        180;

    /* planets */

    planets.forEach(
        planet => {
            const data =
                planet.userData;

            data.orbitAngle +=
                data.orbitSpeed *
                delta;

            planet.position.x =
                Math.cos(
                    data.orbitAngle
                ) *
                data.distance;

            planet.position.z =
                Math.sin(
                    data.orbitAngle
                ) *
                data.distance;

            planet.rotation.y +=
                data.rotationSpeed *
                delta;

            if (data.moon) {

                data.moon.rotation.y +=
                    0.02 *
                    delta;

                data.moon.position.x =
                    Math.cos(
                        time * 0.45
                    ) *
                    5.2;

                data.moon.position.z =
                    Math.sin(
                        time * 0.45
                    ) *
                    5.2;
            }
        }
    );

    /* asteroids */

    asteroidGroup.children.forEach(
        asteroid => {

            asteroid.userData.orbitAngle +=
                asteroid.userData.speed *
                delta;

            asteroid.position.x =
                Math.cos(
                    asteroid.userData.orbitAngle
                ) *
                asteroid.userData.distance;

            asteroid.position.z =
                Math.sin(
                    asteroid.userData.orbitAngle
                ) *
                asteroid.userData.distance;

            asteroid.rotation.x +=
                0.08 *
                delta;

            asteroid.rotation.y +=
                0.06 *
                delta;
        }
    );

    /* stars */

    stars.rotation.y +=
        0.000025;
    dust.rotation.y +=
        0.00004;
    meteors.rotation.y +=
        0.00008;

    controls.update();

    composer.render();

    if (showcasePlanet) {

        showcaseRenderer.render(
             showcaseScene,
             showcaseCamera
        );
    }
}

animate();


/* resize */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        composer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        const displayWidth =
            planetDisplay.clientWidth;

        const displayHeight =
            planetDisplay.clientHeight;

        showcaseRenderer.setSize(
            displayWidth,
            displayHeight,
            false
        );

        showcaseCamera.aspect =
            displayWidth /
            displayHeight;

        showcaseCamera.updateProjectionMatrix();
    }
);


/* loading */

window.addEventListener(
    "load",
    () => {
        setTimeout(
            () => {
                document
                    .getElementById("loading")
                    .classList.add("hidden");
            },
            1200
        );
    }
);
