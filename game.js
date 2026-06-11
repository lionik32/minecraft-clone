import * as THREE from 'three';

import { SimplexNoise } from './js/world/noise.js';

import { CHUNK_SIZE, RENDER_DISTANCE_CHUNKS, capasTierra, MAX_PROFUNDIDAD_PIEDRA, FONDO_Y, ATLAS_COLS, ATLAS_ROWS, ATLAS_TILE, ATLAS_W, ATLAS_H, B_TOP, B_NS, B_EW, B_BOTTOM, moveSpeed, sprintSpeed, sensitivity, PLAYER_HEIGHT, EYE_HEIGHT, HEAD_CLEARANCE, gravity, jumpForce, RENDER_DISTANCE, PHYSICS_STEP, SNEAK_OFFSET, WATER_FRAMES } from './js/config/constants.js';

import { BLOCK_UVS } from './js/config/blocks.js';

import { atlasArchivos, ATLAS_IDX, atlasUV, atlasTexture, atlasListo, cargarAtlas, loader, texSide, texTop, texBottom, texStone, texWood, atlasMaterial, actualizarAtlasMaterial } from './js/render/textures.js';

let noise = new SimplexNoise(42);


// 1. ESCENA Y CONFIGURACIÓN BÁSICA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0e6ff);
scene.fog = new THREE.Fog(0xa0e6ff, 55, 65);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });

// ===== FACE CULLING =====
const gl = renderer.getContext();
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
gl.frontFace(gl.CCW);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

const luzAmbiente = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(luzAmbiente);

// 2. TEXTURAS Y MATERIALES (CON COLORES VIVOS)


// ===== ATLAS DE TEXTURAS (5x4 = 20 texturas de 16x16) =====












function crearMeshManual(matType) {
    const mat = materialPorNombre[matType];
    const m = new THREE.Mesh(geometry, mat || materials);
    m.userData.matType = matType;
    return m;
}





const _glassOpts = (c) => ({
    map: texGlassBlock,
    transparent: true,
    alphaTest: 0.5,
    depthWrite: true,
    side: THREE.FrontSide,
    color: new THREE.Color(c, c, c),
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4
});
const glassMaterial = [
    new THREE.MeshBasicMaterial(_glassOpts(B_EW)),
    new THREE.MeshBasicMaterial(_glassOpts(B_EW)),
    new THREE.MeshBasicMaterial(_glassOpts(B_TOP)),
    new THREE.MeshBasicMaterial(_glassOpts(B_BOTTOM)),
    new THREE.MeshBasicMaterial(_glassOpts(B_NS)),
    new THREE.MeshBasicMaterial(_glassOpts(B_NS)),
];

const texSand = loader.load('textures/sand.png');
texSand.magFilter = texSand.minFilter = THREE.NearestFilter;
texSand.colorSpace = THREE.SRGBColorSpace;
texSand.generateMipmaps = false;
const sandMaterial = crearMaterialesUniformes(texSand);

const texWaterStill = loader.load('textures/water_still.png');
const texWaterFlow  = loader.load('textures/water_flow.png');
[texWaterStill, texWaterFlow].forEach(t => {
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.generateMipmaps = false;
});
texWaterFlow.repeat.set(1, 1/32);
texWaterFlow.offset.set(0, 31/32);
texWaterStill.repeat.set(1, 1/32);
texWaterStill.offset.set(0, 31/32);

let waterAnimFrame = 0;

setInterval(() => {
    waterAnimFrame = (waterAnimFrame + 1) % WATER_FRAMES;
    const frameOffset = (WATER_FRAMES - 1 - waterAnimFrame) / WATER_FRAMES;
    texWaterStill.offset.set(0, frameOffset);
    texWaterFlow.offset.set(0, frameOffset);
    texWaterFlowX.offset.set(frameOffset, 0);
    texWaterStill.needsUpdate = true;
    texWaterFlow.needsUpdate = true;
    texWaterFlowX.needsUpdate = true;
}, 66);

const texWaterFlowX = texWaterFlow.clone();
texWaterFlowX.needsUpdate = true;
texWaterFlowX.repeat.set(1/32, 1);
texWaterFlowX.offset.set(0, 0);

const _waterOpts = (map, c) => ({
    map, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide,
    color: new THREE.Color(c, c, c),
    polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8
});
const waterMaterial = [
    new THREE.MeshBasicMaterial(_waterOpts(texWaterStill, B_EW)),
    new THREE.MeshBasicMaterial(_waterOpts(texWaterStill, B_EW)),
    new THREE.MeshBasicMaterial(_waterOpts(texWaterStill, B_TOP)),
    new THREE.MeshBasicMaterial(_waterOpts(texWaterStill, B_BOTTOM)),
    new THREE.MeshBasicMaterial(_waterOpts(texWaterStill, B_NS)),
    new THREE.MeshBasicMaterial(_waterOpts(texWaterStill, B_NS)),
];

const texIron = loader.load('textures/iron_block.png');
const texBrick = loader.load('textures/brick.png');
texBrick.magFilter = texBrick.minFilter = THREE.NearestFilter;
texBrick.colorSpace = THREE.SRGBColorSpace;
texBrick.generateMipmaps = false;
texIron.colorSpace = THREE.SRGBColorSpace;
texIron.generateMipmaps = false;
const ironMaterial = crearMaterialesUniformes(texIron);
const brickMaterial = crearMaterialesUniformes(texBrick);

const texCRed     = loader.load('textures/concrete_red.png');
const texCBlack   = loader.load('textures/concrete_black.png');
const texCLGray   = loader.load('textures/concrete_silver.png');
const texCYellow  = loader.load('textures/concrete_yellow.png');
const texCLBlue   = loader.load('textures/concrete_light_blue.png');
const texCOrange  = loader.load('textures/concrete_orange.png');
const texCMagenta = loader.load('textures/concrete_magenta.png');
const texCLime    = loader.load('textures/concrete_lime.png');
const texCBrown   = loader.load('textures/concrete_brown.png');

[texCRed, texCBlack, texCLGray, texCYellow, texCLBlue, texCOrange, texCMagenta, texCLime, texCBrown].forEach(t => {
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = false;
});

const matCRed     = crearMaterialesUniformes(texCRed);
const matCBlack   = crearMaterialesUniformes(texCBlack);
const matCLGray   = crearMaterialesUniformes(texCLGray);
const matCYellow  = crearMaterialesUniformes(texCYellow);
const matCLBlue   = crearMaterialesUniformes(texCLBlue);
const matCOrange  = crearMaterialesUniformes(texCOrange);
const matCMagenta = crearMaterialesUniformes(texCMagenta);
const matCLime    = crearMaterialesUniformes(texCLime);
const matCBrown   = crearMaterialesUniformes(texCBrown);

const texOakLogTop = loader.load('textures/log_oak_top.png');
texOakLogTop.magFilter = texOakLogTop.minFilter = THREE.NearestFilter;
texOakLogTop.colorSpace = THREE.SRGBColorSpace;
texOakLogTop.generateMipmaps = false;
const texOakLogSide = loader.load('textures/log_oak.png');
texOakLogSide.magFilter = texOakLogSide.minFilter = THREE.NearestFilter;
texOakLogSide.colorSpace = THREE.SRGBColorSpace;
texOakLogSide.generateMipmaps = false;
const oakLogMaterial = crearMateriales(texOakLogTop, texOakLogSide, texOakLogTop);

function crearMaterialesHojas(tex) {
    const brightValues = [B_EW, B_EW, B_TOP, B_BOTTOM, B_NS, B_NS];
    return brightValues.map(b => new THREE.MeshBasicMaterial({
        map: tex,
        color: new THREE.Color(b, b, b),
        transparent: false,
        alphaTest: 0.5,
        depthWrite: true,
        side: THREE.DoubleSide,
    }));
}
const texLeaves = loader.load('textures/leaves_oak.png');
texLeaves.magFilter = texLeaves.minFilter = THREE.NearestFilter;
texLeaves.colorSpace = THREE.SRGBColorSpace;
texLeaves.generateMipmaps = false;
const oakLeavesMaterial = crearMaterialesHojas(texLeaves);
oakLeavesMaterial.forEach(m => { m.color.set(0x48b518); });

const todosMateriales = [...materials, ...stoneMaterial, ...woodMaterial, ...dirtMaterial, ...glassMaterial, ...sandMaterial, ...ironMaterial, ...oakLogMaterial, ...oakLeavesMaterial, ...brickMaterial,
    ...matCRed, ...matCBlack, ...matCLGray, ...matCYellow, ...matCLBlue, ...matCOrange, ...matCMagenta, ...matCLime, ...matCBrown, ...waterMaterial];


// 3. TERRENO INFINITO POR CHUNKS


const geometry = new THREE.BoxGeometry(1, 1, 1);
function createInstancedMesh(positions, material) {
    if (!positions || positions.length === 0) return null;
    const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
    const dummyMat = new THREE.Matrix4();
    positions.forEach((pos, idx) => {
        dummyMat.compose(new THREE.Vector3(pos.x, pos.y, pos.z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
        mesh.setMatrixAt(idx, dummyMat);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    return mesh;
}
const dummy = new THREE.Object3D();

function getAltura(x, z, tipo) {
    if (tipo === 'plano') return 0;
    const n1 = noise.noise2D(x * 0.003, z * 0.003) * 60;
    const n2 = noise.noise2D(x * 0.015, z * 0.015) * 20;
    const n3 = noise.noise2D(x * 0.06, z * 0.06) * 5;
    return Math.round(63 + n1 + n2 + n3);
}

// ===== CHUNK MANAGER =====
const activeChunks = new Map();
let tipoMundoChunks = 'plano';

function chunkKey(cx, cz) { return `${cx},${cz}`; }

function cargarChunk(cx, cz, tipo, forzar = false) {
    const key = chunkKey(cx, cz);
    if (activeChunks.has(key) && !forzar) return;

    const blocks = [];
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            const wx = cx * CHUNK_SIZE + lx;
            const wz = cz * CHUNK_SIZE + lz;
            const h = getAltura(wx, wz, tipo);
            const capasT = tipo === 'plano' ? 3 : capasTierra;
            const capasP = tipo === 'plano' ? 3 : MAX_PROFUNDIDAD_PIEDRA;
            let piedraStart = h - capasT - capasP;
            const yStart = tipo === 'plano' ? piedraStart : Math.max(FONDO_Y, piedraStart);
            for (let y = yStart; y <= h; y++) {
                let matType;
                if (y === h) matType = 'grass';
                else if (y >= h - capasT) matType = 'dirt';
                else if (y >= piedraStart) matType = 'stone';
                else continue;
                if (!brokenTerrain.has(`${wx},${y},${wz}`)) {
                    blocks.push({ x: wx, y: y, z: wz, matType });
                }
            }
        }
    }

    const blockSet = new Set();
    for (const b of blocks) blockSet.add(`${b.x},${b.y},${b.z}`);

    function isSolid(x, y, z) {
        const k = `${x},${y},${z}`;
        if (brokenTerrain.has(k)) return false;
        return blockSet.has(k);
    }

    const faceData = [
        { dir:[1,0,0],  verts:[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]] },
        { dir:[-1,0,0], verts:[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]] },
        { dir:[0,1,0],  verts:[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]] },
        { dir:[0,-1,0], verts:[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]] },
        { dir:[0,0,1],  verts:[[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,.5]] },
        { dir:[0,0,-1], verts:[[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,-.5,-.5]] },
    ];

    const blocksByMat = {};
    for (const block of blocks) {
        if (!blocksByMat[block.matType]) blocksByMat[block.matType] = [];
        blocksByMat[block.matType].push(block);
    }

    const meshes = [];

    for (const [matType, typeBlocks] of Object.entries(blocksByMat)) {
        const mat = materialPorNombre[matType];
        if (!mat) continue;

        const pos = [], uvs = [];
        const faceIdxs = [[], [], [], [], [], []];
        let vi = 0;

        for (const { x, y, z } of typeBlocks) {
            faceData.forEach(({ dir: [dx,dy,dz], verts }, fi) => {
                if (isSolid(x+dx, y+dy, z+dz)) return;
                verts.forEach(([vx,vy,vz]) => { pos.push(x+vx, y+vy, z+vz); });
                uvs.push(0,0, 0,1, 1,1, 1,0);
                faceIdxs[fi].push(vi, vi+1, vi+2, vi, vi+2, vi+3);
                vi += 4;
            });
        }

        if (pos.length === 0) continue;

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

        const allIdxs = [];
        let offset = 0;
        for (let fi = 0; fi < 6; fi++) {
            const count = faceIdxs[fi].length;
            if (count > 0) {
                geo.addGroup(offset, count, fi);
                allIdxs.push(...faceIdxs[fi]);
                offset += count;
            }
        }
        geo.setIndex(allIdxs);

        const mesh = new THREE.Mesh(geo, mat);
        mesh.frustumCulled = false;
        mesh.userData.isChunk = true;
        mesh.name = "chunk_mesh";
        scene.add(mesh);
        meshes.push(mesh);
    }

    const allBlockSet = new Set(blocks.map(b => `${b.x},${b.y},${b.z}`));
    activeChunks.set(key, { meshes, allBlocks: blocks, allBlockSet, posToInstance: new Map() });
}

function descargarChunk(key) {
    const chunk = activeChunks.get(key);
    if (!chunk) return;
    chunk.meshes?.forEach(m => { scene.remove(m); m.geometry.dispose(); });
    activeChunks.delete(key);
}

function romperBloqueChunk(hit, targetMesh) {
    const n = hit.face.normal;
    const bx = Math.round(hit.point.x - n.x * 0.5);
    const by = Math.round(hit.point.y - n.y * 0.5);
    const bz = Math.round(hit.point.z - n.z * 0.5);
    const key = `${Math.round(bx)},${Math.round(by)},${Math.round(bz)}`;

    if (brokenTerrain.has(key)) return;
    brokenTerrain.add(key);

    const cx = Math.floor(bx / CHUNK_SIZE);
    const cz = Math.floor(bz / CHUNK_SIZE);
    const ck = chunkKey(cx, cz);

    if (activeChunks.has(ck)) {
        const viejasMeshes = activeChunks.get(ck).meshes || [];
        cargarChunk(cx, cz, tipoMundoChunks, true);
        viejasMeshes.forEach(m => { scene.remove(m); m.geometry.dispose(); });
    }

    if (socket && socket.readyState === 1) {
        socket.send(JSON.stringify({
            type: 'block_break',
            x: bx, y: by, z: bz,
            mundo: tipoMundoActual,
            salaId: salaIdActual
        }));
    }

    setTimeout(() => {
        [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(([dx,dy,dz]) => {
            const vx = bx+dx, vy = by+dy, vz = bz+dz;
            if (esAgua(vx,vy,vz)) {
                const vn = waterNiveles.get(waterKey(vx,vy,vz)) ?? 8;
                fluirAgua(vx,vy,vz,vn);
            }
        });
    }, 100);
}

function getChunkMeshes() {
    const meshes = [];
    activeChunks.forEach(c => { if (c.meshes) meshes.push(...c.meshes); });
    return meshes;
}

let chunkQueue = [];
let chunkGenerating = false;
let chunksTotalesInicio = 0;
let chunksCargadosInicio = 0;
let cargandoMundo = false;
let chunksTerminados = false;
let posicionAplicada = false;

function verificarOcultarCarga() {
    if (!chunksTerminados || !posicionAplicada) return;
    setTimeout(() => { document.getElementById('pantalla-carga').style.display = 'none'; }, 400);
}

function procesarColaChunks() {
    if (chunkQueue.length === 0) {
        chunkGenerating = false;
        if (cargandoMundo) {
            cargandoMundo = false;
            chunksTerminados = true;
            const barraProgreso = document.getElementById('barra-progreso-inner');
            barraProgreso.style.transition = 'none';
            barraProgreso.style.width = '100%';
            verificarOcultarCarga();
        }
        return;
    }
    chunkGenerating = true;
    const { cx, cz, tipo } = chunkQueue.shift();
    const key = chunkKey(cx, cz);
    if (!activeChunks.has(key)) {
        cargarChunk(cx, cz, tipo);
    }
    if (cargandoMundo && chunksTotalesInicio > 0) {
        chunksCargadosInicio++;
        const pct = Math.min(99, Math.round((chunksCargadosInicio / chunksTotalesInicio) * 100));
        const barraProgreso = document.getElementById('barra-progreso-inner');
        barraProgreso.style.transition = 'width 0.1s steps(4)';
        barraProgreso.style.width = pct + '%';
    }
    setTimeout(procesarColaChunks, 0);
}

function actualizarChunks() {
    const pcx = Math.floor(camera.position.x / CHUNK_SIZE);
    const pcz = Math.floor(camera.position.z / CHUNK_SIZE);

    const pendientes = [];
    for (let dx = -RENDER_DISTANCE_CHUNKS; dx <= RENDER_DISTANCE_CHUNKS; dx++) {
        for (let dz = -RENDER_DISTANCE_CHUNKS; dz <= RENDER_DISTANCE_CHUNKS; dz++) {
            const cx = pcx + dx, cz = pcz + dz;
            if (!activeChunks.has(chunkKey(cx, cz))) {
                pendientes.push({ cx, cz, tipo: tipoMundoChunks, dist: dx*dx + dz*dz });
            }
        }
    }
    pendientes.sort((a, b) => a.dist - b.dist);
    chunkQueue.push(...pendientes);

    for (const key of activeChunks.keys()) {
        const [cx, cz] = key.split(',').map(Number);
        if (Math.abs(cx - pcx) > RENDER_DISTANCE_CHUNKS + 1 || Math.abs(cz - pcz) > RENDER_DISTANCE_CHUNKS + 1) {
            descargarChunk(key);
        }
    }

    if (!chunkGenerating) procesarColaChunks();
}

function generarMapa(tipo) {
    tipoMundoChunks = tipo;
    for (const key of activeChunks.keys()) descargarChunk(key);
    actualizarChunks();
    if (!modoMultijugador) return;
}

window.iniciarMundo = function(tipo, esMulti) {
    const tips = [
        "Los creepers temen a los ocelotes.",
        "Puedes cultivar árboles en cualquier bioma.",
        "El cristal de End resiste explosiones.",
        "Duerme para evitar que aparezcan mobs.",
        "La lana amortigua las caídas.",
        "Los bloques de oro atraen a los cerdos zombie.",
        "Puedes hacer una cama con 3 tablones y 3 lanas.",
        "El agua apaga el fuego.",
        "Las flechas de fuego encienden la TNT.",
        "Los esqueletos tienen miedo del sol."
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    const pantallaCarga = document.getElementById('pantalla-carga');
    const barraProgreso = document.getElementById('barra-progreso-inner');
    const tipTexto = document.getElementById('carga-tip');
    tipTexto.textContent = tip;
    pantallaCarga.style.display = 'flex';
    barraProgreso.style.width = '0%';
    barraProgreso.style.transition = 'width 0.1s steps(6)';
    barraProgreso.style.width = '0%';
    const totalD = (RENDER_DISTANCE_CHUNKS * 2 + 1) ** 2;
    chunksTotalesInicio = totalD;
    chunksCargadosInicio = 0;
    cargandoMundo = true;
    chunksTerminados = false;
    posicionAplicada = false;

    if (socket) { socket.close(); socket = null; }
    playerId = null;

    tipoMundoActual = tipo;
    modoMultijugador = !!esMulti;
    esPropietario = !esMulti;

    remotePlayers.forEach((j) => scene.remove(j.mesh));
    remotePlayers.clear();

    for (const key of activeChunks.keys()) descargarChunk(key);
    manualBlocks.forEach(b => scene.remove(b));
    manualBlocks.length = 0;
    leafBlocks.clear();
    leafChunkMeshes.forEach(m => { scene.remove(m); m.geometry.dispose(); });
    leafChunkMeshes.clear();
    brokenInstances.clear();
    brokenTerrain.clear();
    sandBlocks.length = 0;
    waterMeshes.forEach(m => scene.remove(m));
    waterMeshes.clear();
    waterPositions.clear();
    waterNiveles.clear();
    waterSources.clear();

    if (!modoMultijugador && tipo === 'plano') {
    plantarArbol(10, 1, 10);
}

    mundoIniciado = true;
    volarActivo = false;
    jumpPressed = false;
    sneakPressed = false;
    document.getElementById('pantalla-principal').classList.remove('activa');
    document.getElementById('pantalla-jugar').classList.remove('activa');

    if (modoMultijugador && salaIdActual) {
        let semilla = 42;
        const num = parseInt(salaIdActual.replace(/\D/g, ''));
        if (!isNaN(num)) semilla = num;
        noise = new SimplexNoise(semilla);
    } else {
        const semilla = (typeof mundoIdActual !== 'undefined' && mundoIdActual) ? parseInt(mundoIdActual) || 42 : 42;
        noise = new SimplexNoise(semilla);
    }
    generarMapa(tipo);

    if (!modoMultijugador && mundoIdActual) {
        salaIdActual = "mundo_" + mundoIdActual;
        socket = new WebSocket('wss://minecraft-server2-bnn6.onrender.com');
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'register_world',
                salaId: salaIdActual,
                mundo: tipoMundoActual,
                nombre: mundoNombreActual
            }));
        };
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'id') {
                playerId = data.id;
            } else if (data.type === 'player_join_request') {
                if (!modoMultijugador) {
                    modoMultijugador = true;
                    esPropietario = true;
                    mostrarMensaje('¡Un jugador se ha unido a tu mundo!');
                    socket.send(JSON.stringify({
                        type: 'join',
                        salaId: salaIdActual,
                        mundo: tipoMundoActual,
                        nombre: mundoNombreActual
                    }));
                    configurarSocketMultijugador();
                }
            } else if (data.type === 'players') {
                actualizarJugadoresRemotos(data.players);
            } else if (data.type === 'block_place' || data.type === 'block_break') {
                aplicarEventoBloque(data);
            }
        };
        socket.onerror = (err) => {};
    } else if (modoMultijugador) {
        conectarPartida();
    }

    if (!modoMultijugador) {
        setTimeout(() => cargarMundo(), 300);
    } else {
        const posGuardada = localStorage.getItem('posicion_multi_' + salaIdActual);
        if (posGuardada) {
            setTimeout(() => {
                const pos = JSON.parse(posGuardada);
                camera.position.set(pos.x, pos.y, pos.z);
                yaw = pos.yaw || 0;
                pitch = pos.pitch || 0;
                camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
                volarActivo = pos.volar || false;
                sneakActivo = pos.sneak || false;
                sneakBtn.classList.toggle('activo', sneakActivo);
            }, 400);
        }
    }

    const spawnX = 0;
    const spawnZ = 0;
    velocityY = 0;
    isJumping = false;

    const mundoKey = 'minecraft_mundo_' + tipo + '_' + (mundoIdActual || 'default');
    const tieneMundoGuardado = !modoMultijugador && !!localStorage.getItem(mundoKey);

    if (tieneMundoGuardado) {
        try {
            const savedData = JSON.parse(localStorage.getItem(mundoKey));
            if (savedData && savedData.posicion) {
                const pos = savedData.posicion;
                camera.position.set(pos.x, pos.y, pos.z);
                yaw = pos.yaw || 0;
                pitch = pos.pitch || 0;
                camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
                volarActivo = pos.volar || false;
            } else {
                camera.position.set(spawnX, 999, spawnZ);
            }
        } catch(e) {
            camera.position.set(spawnX, 999, spawnZ);
        }
    } else {
        camera.position.set(spawnX, 999, spawnZ);
        function esperarSpawn() {
            const spawnCX = Math.floor(spawnX / CHUNK_SIZE);
            const spawnCZ = Math.floor(spawnZ / CHUNK_SIZE);
            const ck = chunkKey(spawnCX, spawnCZ);
            const chunk = activeChunks.get(ck);
            const listo = chunk && chunk.meshes && chunk.meshes.length > 0 && scene.children.includes(chunk.meshes[0]);
            if (!listo) { setTimeout(esperarSpawn, 50); return; }
            const h = getAltura(spawnX, spawnZ, tipo);
const spawnY = (tipo === 'plano' ? 0 : h) + 2 + 1.62;
camera.position.set(spawnX, spawnY, spawnZ);
prevPhysicsPos.copy(camera.position);
physicsPos.copy(camera.position);
velocityY = 0;
isJumping = false;
posicionAplicada = true;
verificarOcultarCarga();
        }
        setTimeout(esperarSpawn, 300);
    }
};

const manualBlocks = [];
const brokenInstances = new Map();
const brokenTerrain = new Set();

const nombreMaterial = new Map([
    [materials,      'grass'],
    [stoneMaterial,  'stone'],
    [woodMaterial,   'wood'],
    [dirtMaterial,   'dirt'],
    [glassMaterial,  'glass'],
    [sandMaterial,   'sand'],
    [ironMaterial,   'iron'],
    [brickMaterial,  'brick'],
    [waterMaterial,  'water'],
    [oakLogMaterial,    'oaklog'],
    [oakLeavesMaterial, 'oak_leaves'],
    [matCRed,        'c_red'],
    [matCBlack,      'c_black'],
    [matCLGray,      'c_lgray'],
    [matCYellow,     'c_yellow'],
    [matCLBlue,      'c_lblue'],
    [matCOrange,     'c_orange'],
    [matCMagenta,    'c_magenta'],
    [matCLime,       'c_lime'],
    [matCBrown,      'c_brown'],
]);
const materialPorNombre = {
    'grass':    materials,
    'stone':    stoneMaterial,
    'wood':     woodMaterial,
    'dirt':     dirtMaterial,
    'glass':    glassMaterial,
    'sand':     sandMaterial,
    'iron':     ironMaterial,
    'brick':    brickMaterial,
    'water':       waterMaterial,
    'oaklog':      oakLogMaterial,
    'oak_leaves':  oakLeavesMaterial,
    'c_red':     matCRed,
    'c_black':   matCBlack,
    'c_lgray':   matCLGray,
    'c_yellow':  matCYellow,
    'c_lblue':   matCLBlue,
    'c_orange':  matCOrange,
    'c_magenta': matCMagenta,
    'c_lime':    matCLime,
    'c_brown':   matCBrown,
    'bucket_empty': null,
};
const sandBlocks = [];

const leafBlocks = new Map();
const leafChunkMeshes = new Map();

function leafChunkKey(cx, cz) { return `${cx},${cz}`; }

function reconstruirHojasChunk(cx, cz) {
    const key = leafChunkKey(cx, cz);
    const viejo = leafChunkMeshes.get(key);
    if (viejo) { scene.remove(viejo); viejo.geometry.dispose(); leafChunkMeshes.delete(key); }

    // Reunir todos los bloques de hojas de todos los chunks para consultar vecinos
    const todasHojas = new Set();
    leafBlocks.forEach(bloques => bloques.forEach(([lx, ly, lz]) => todasHojas.add(`${lx},${ly},${lz}`)));

    const bloques = leafBlocks.get(key);
    if (!bloques || bloques.length === 0) return;

    const faceData = [
        { dir:[1,0,0],  verts:[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]],   bright: 0.6 },
        { dir:[-1,0,0], verts:[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]], bright: 0.6 },
        { dir:[0,1,0],  verts:[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]],   bright: 1.0 },
        { dir:[0,-1,0], verts:[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]], bright: 0.5 },
        { dir:[0,0,1],  verts:[[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,.5]],   bright: 0.8 },
        { dir:[0,0,-1], verts:[[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,-.5,-.5]], bright: 0.8 },
    ];

    const pos = [], uvs = [], colors = [], idxArr = [];
    let vi = 0;

    const OFFSET = 0.001;
    for (const [lx, ly, lz] of bloques) {
        for (const { dir: [dx,dy,dz], verts, bright } of faceData) {
            verts.forEach(([vx,vy,vz]) => {
                pos.push(lx+vx+dx*OFFSET, ly+vy+dy*OFFSET, lz+vz+dz*OFFSET);
                colors.push(bright, bright, bright);
            });
            uvs.push(0,0, 0,1, 1,1, 1,0);
            idxArr.push(vi, vi+1, vi+2, vi, vi+2, vi+3);
            vi += 4;
        }
    }

    if (pos.length === 0) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(idxArr);

    const mat = new THREE.MeshBasicMaterial({
        map: texLeaves,
        vertexColors: true,
        alphaTest: 0.5,
        transparent: false,
        depthWrite: true,
        side: THREE.DoubleSide,
        color: new THREE.Color(0x48b518),
        polygonOffset: true,
        polygonOffsetFactor: -8,
        polygonOffsetUnits: -8
    });

    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.noCollision = false;
    mesh.frustumCulled = true;
    mesh.scale.set(0.999, 0.999, 0.999);
    scene.add(mesh);
    leafChunkMeshes.set(key, mesh);
}

function agregarHoja(x, y, z) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const key = leafChunkKey(cx, cz);
    if (!leafBlocks.has(key)) leafBlocks.set(key, []);
    leafBlocks.get(key).push([x, y, z]);
    reconstruirHojasChunk(cx, cz);
}

function reconstruirTodasLasHojas() {
    leafBlocks.forEach((_, key) => {
        const [cx, cz] = key.split(',').map(Number);
        reconstruirHojasChunk(cx, cz);
    });
}

function plantarArbol(x, y, z) {
    const altura = 4;
    for (let i = 0; i < altura; i++) {
        const t = crearMeshManual('oaklog');
        t.position.set(x, y + i, z);
        scene.add(t);
        manualBlocks.push(t);
    }
    const troncoTop = y + altura - 1;
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
            if (dx === 0 && dz === 0) continue;
            agregarHoja(x+dx, troncoTop,   z+dz);
            agregarHoja(x+dx, troncoTop-1, z+dz);
        }
    }
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            if (dx === 0 && dz === 0) continue;
            agregarHoja(x+dx, troncoTop+1, z+dz);
        }
    }
    agregarHoja(x, troncoTop+2, z);
}

// ===== SISTEMA DE AGUA =====
const waterPositions = new Set();
const waterSources = new Set();
const waterNiveles = new Map();
const waterMeshes = new Map();
const waterFlujo = new Map();
let waterGeneracion = 0;

function waterKey(x, y, z) { return `${Math.round(x)},${Math.round(y)},${Math.round(z)}`; }

function esAgua(x, y, z) { return waterPositions.has(waterKey(x, y, z)); }

function esSolido(x, y, z) {
    const k = waterKey(x, y, z);
    if (waterPositions.has(k)) return false;
    if (manualBlocks.some(b =>
        Math.round(b.position.x) === Math.round(x) &&
        Math.round(b.position.y) === Math.round(y) &&
        Math.round(b.position.z) === Math.round(z)
    )) return true;
    if (brokenTerrain.has(k)) return false;
    const cx = Math.floor(Math.round(x) / CHUNK_SIZE);
    const cz = Math.floor(Math.round(z) / CHUNK_SIZE);
    const chunk = activeChunks.get(chunkKey(cx, cz));
    return !!(chunk && chunk.allBlockSet && chunk.allBlockSet.has(k));
}

function reconstruirBloqueAgua(x, y, z) {
    const k = waterKey(x, y, z);
    if (waterMeshes.has(k)) {
        const viejo = waterMeshes.get(k);
        scene.remove(viejo);
        viejo.geometry.dispose();
        waterMeshes.delete(k);
    }
    if (!waterPositions.has(k)) return;

    const dirs = [
        [1,0,0], [-1,0,0],
        [0,1,0], [0,-1,0],
        [0,0,1], [0,0,-1]
    ];

    const posArr = [], normArr = [], uvArr = [], idxArr = [];
    let vi = 0;

    const nivel = waterNiveles.get(k) ?? 0;
    const topY = 0.5 - (nivel / 8);

    const tieneAguaEncima = esAgua(x, y+1, z);
    const nivelMinVecino = Math.min(
        waterNiveles.get(waterKey(x+1,y,z)) ?? 8,
        waterNiveles.get(waterKey(x-1,y,z)) ?? 8,
        waterNiveles.get(waterKey(x,y,z+1)) ?? 8,
        waterNiveles.get(waterKey(x,y,z-1)) ?? 8
    );
    const topYBase = (tieneAguaEncima || nivelMinVecino < nivel) ? 0.5 : topY;

    function cornerHeightFinal(cx, cz) {
        let best = nivel;
        for (const [vx,vz] of [[cx,cz],[cx-1,cz],[cx,cz-1],[cx-1,cz-1]]) {
            const vk = waterKey(vx,y,vz);
            if (waterPositions.has(vk)) {
                const vn = waterNiveles.get(vk) ?? 0;
                if (esAgua(vx,y+1,vz)) return 0.5;
                if (vn < best) best = vn;
            }
        }
        return 0.5 - (best / 8);
    }

    const h00 = cornerHeightFinal(x,   z  );
    const h10 = cornerHeightFinal(x+1, z  );
    const h01 = cornerHeightFinal(x,   z+1);
    const h11 = cornerHeightFinal(x+1, z+1);

    const caraVerts = [
        [[0.5,-.5,-.5],[0.5,h10,-.5],[0.5,h11,0.5],[0.5,-.5,0.5]],
        [[-.5,-.5,0.5],[-.5,h01,0.5],[-.5,h00,-.5],[-.5,-.5,-.5]],
        [[-.5,h01,0.5],[0.5,h11,0.5],[0.5,h10,-.5],[-.5,h00,-.5]],
        [[-.5,-.5,-.5],[0.5,-.5,-.5],[0.5,-.5,0.5],[-.5,-.5,0.5]],
        [[0.5,-.5,0.5],[0.5,h11,0.5],[-.5,h01,0.5],[-.5,-.5,0.5]],
        [[-.5,-.5,-.5],[-.5,h00,-.5],[0.5,h10,-.5],[0.5,-.5,-.5]],
    ];
    const caraNorms = [
        [1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]
    ];
    const flujo = waterFlujo.get(k) || { dx: 0, dz: 0 };
    let uvTop;
    if (flujo.dx === 1)       uvTop = [[0,0],[1,0],[1,1],[0,1]];
    else if (flujo.dx === -1) uvTop = [[1,1],[0,1],[0,0],[1,0]];
    else if (flujo.dz === 1)  uvTop = [[1,0],[1,1],[0,1],[0,0]];
    else if (flujo.dz === -1) uvTop = [[0,1],[0,0],[1,0],[1,1]];
    else                      uvTop = [[0,0],[1,0],[1,1],[0,1]];

    const caraUVs = [
        [[0,0],[0,1],[1,1],[1,0]],
        [[1,0],[1,1],[0,1],[0,0]],
        uvTop,
        [[0,0],[1,0],[1,1],[0,1]],
        [[1,0],[1,1],[0,1],[0,0]],
        [[0,0],[0,1],[1,1],[1,0]],
    ];

    const faceGroups = [];
    let idxCount = 0;
    dirs.forEach(([dx,dy,dz], i) => {
        const nx = x+dx, ny = y+dy, nz = z+dz;
        if (esAgua(nx,ny,nz)) return;
        if (esSolido(nx,ny,nz)) return;

        const verts = caraVerts[i];
        const norm = caraNorms[i];
        const faceUVs = caraUVs[i];
        verts.forEach(([vx,vy,vz], vi2) => {
            posArr.push(x+vx, y+vy, z+vz);
            normArr.push(...norm);
            uvArr.push(faceUVs[vi2][0], faceUVs[vi2][1]);
        });
        idxArr.push(vi, vi+1, vi+2, vi, vi+2, vi+3);
        faceGroups.push({ start: idxCount, matIdx: i });
        idxCount += 6;
        vi += 4;
    });

    if (idxArr.length === 0) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
    geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normArr, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvArr, 2));
    geo.setIndex(idxArr);
    faceGroups.forEach(({ start, matIdx }, idx) => {
        const count = idx < faceGroups.length - 1 ? faceGroups[idx+1].start - start : idxArr.length - start;
        geo.addGroup(start, count, matIdx);
    });

    const mesh = new THREE.Mesh(geo, waterMaterial);
    mesh.position.set(0,0,0);
    mesh.userData.isWater = true;
    scene.add(mesh);
    waterMeshes.set(k, mesh);
}

function contarFuentesVecinas(x, y, z) {
    let count = 0;
    [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]].forEach(([dx,dz]) => {
        const k = waterKey(x+dx, y, z+dz);
        if (waterPositions.has(k) && (waterNiveles.get(k) ?? 8) === 0) count++;
    });
    return count;
}

function agregarAgua(x, y, z, fluir = true, nivel = 0, dxFlujo = 0, dzFlujo = 0) {
    const k = waterKey(x, y, z);
    if (waterPositions.has(k) && (waterNiveles.get(k) ?? 8) <= nivel) return;

    if (nivel > 0 && contarFuentesVecinas(x, y, z) >= 2) {
        nivel = 0;
        dxFlujo = 0;
        dzFlujo = 0;
    }

    waterPositions.add(k);
    waterNiveles.set(k, nivel);
    waterFlujo.set(k, { dx: dxFlujo, dz: dzFlujo });

    reconstruirBloqueAgua(x, y, z);
    [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(([dx,dy,dz]) => {
        if (esAgua(x+dx, y+dy, z+dz)) {
            reconstruirBloqueAgua(x+dx, y+dy, z+dz);
            [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]].forEach(([dx2,_,dz2]) => {
                if (esAgua(x+dx+dx2, y+dy, z+dz+dz2)) reconstruirBloqueAgua(x+dx+dx2, y+dy, z+dz+dz2);
            });
        }
    });
    if (fluir) fluirAgua(x, y, z, nivel);
}

function buscarCaidaCercana(startX, startY, startZ) {
    let mejorDist = 6;
    let objetivos = [];
    for (let dx = -5; dx <= 5; dx++) {
        for (let dz = -5; dz <= 5; dz++) {
            const dist = Math.abs(dx) + Math.abs(dz);
            if (dist > 5) continue;
            const nx = startX + dx, nz = startZ + dz;
            if (!esSolido(nx, startY, nz) && !esSolido(nx, startY - 1, nz) && !esAgua(nx, startY - 1, nz)) {
                if (dist < mejorDist) { mejorDist = dist; objetivos = [[dx, dz]]; }
                else if (dist === mejorDist) { objetivos.push([dx, dz]); }
            }
        }
    }
    return objetivos;
}

function fluirAgua(x, y, z, nivel = 0) {
    const genActual = waterGeneracion;
    const yAbajo = y - 1;
    if (yAbajo < -64) return;

    if (!esSolido(x, yAbajo, z)) {
        setTimeout(() => {
            if (waterGeneracion !== genActual) return;
            agregarAgua(x, yAbajo, z, true, 1, 0, 0);
            if (socket?.readyState === 1) socket.send(JSON.stringify({ type: 'block_place', x, y: yAbajo, z, mat: 'water', nivel: 1, mundo: tipoMundoActual, salaId: salaIdActual }));
        }, 250);
        return;
    }

    if (nivel >= 7) return;
    const delay = 300 + nivel * 60;
    const caidas = buscarCaidaCercana(x, y, z);
    [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]].forEach(([dx, dy, dz]) => {
        const nx = x + dx, nz = z + dz;
        if (esSolido(nx, y, nz)) return;

        let fluirAqui = caidas.length === 0;
        if (caidas.length > 0) {
            fluirAqui = caidas.some(([cx, cz]) => {
                if (dx !== 0) return Math.sign(cx) === dx;
                if (dz !== 0) return Math.sign(cz) === dz;
                return false;
            });
        }

        if (fluirAqui) {
            const k = waterKey(nx, y, nz);
            const nivelExistente = waterNiveles.get(k) ?? 8;
            if (!esSolido(nx, y, nz) && nivelExistente > nivel + 1) {
                setTimeout(() => {
                    if (waterGeneracion !== genActual) return;
                    agregarAgua(nx, y, nz, true, nivel + 1, dx, dz);
                    if (socket?.readyState === 1) socket.send(JSON.stringify({ type: 'block_place', x: nx, y, z: nz, mat: 'water', nivel: nivel + 1, mundo: tipoMundoActual, salaId: salaIdActual }));
                }, delay);
            }
        }
    });
}

function quitarAgua(x, y, z) {
    const k = waterKey(x, y, z);
    if (!waterPositions.has(k)) return;

    waterGeneracion++;
    const genActual = waterGeneracion;

    waterPositions.delete(k);
    waterNiveles.delete(k);
    waterFlujo.delete(k);
    waterSources.delete(k);
    if (waterMeshes.has(k)) {
        const viejo = waterMeshes.get(k);
        scene.remove(viejo); viejo.geometry.dispose(); waterMeshes.delete(k);
    }
    [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(([dx,dy,dz]) =>
        reconstruirBloqueAgua(x+dx, y+dy, z+dz)
    );

    // BFS desde todas las fuentes para saber qué agua sobrevive
    const alcanzable = new Map();
    const cola = [];
    for (const sk of waterPositions) {
        if ((waterNiveles.get(sk) ?? 8) === 0) {
            alcanzable.set(sk, 0);
            cola.push({ key: sk, nivel: 0 });
        }
    }
    let head = 0;
    while (head < cola.length) {
        const { key: ck, nivel } = cola[head++];
        const [cx, cy, cz] = ck.split(',').map(Number);
        const abajoK = waterKey(cx, cy-1, cz);
        if (waterPositions.has(abajoK) && (!alcanzable.has(abajoK) || alcanzable.get(abajoK) > 1)) {
            alcanzable.set(abajoK, 1);
            cola.push({ key: abajoK, nivel: 1 });
        }
        if (nivel < 7) {
            [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dz]) => {
                const vk = waterKey(cx+dx, cy, cz+dz);
                if (waterPositions.has(vk)) {
                    const nv = nivel + 1;
                    if (!alcanzable.has(vk) || alcanzable.get(vk) > nv) {
                        alcanzable.set(vk, nv);
                        cola.push({ key: vk, nivel: nv });
                    }
                }
            });
        }
    }

    const paraEliminar = [];
    for (const wk of waterPositions) {
        if (!alcanzable.has(wk)) paraEliminar.push(wk);
    }

    if (paraEliminar.length === 0) {
        for (const [wk, nuevoNivel] of alcanzable) {
            if (!waterPositions.has(wk)) continue;
            waterNiveles.set(wk, nuevoNivel);
            reconstruirBloqueAgua(...wk.split(',').map(Number));
        }
        return;
    }

    // Animación de drenaje escalonada
    for (let i = paraEliminar.length-1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        [paraEliminar[i], paraEliminar[j]] = [paraEliminar[j], paraEliminar[i]];
    }
    const pendientesDrenajeMap = new Map();
    for (const bk of paraEliminar) pendientesDrenajeMap.set(bk, waterNiveles.get(bk) ?? 7);

    function drenajeStep() {
        if (waterGeneracion !== genActual) return;

        const restantes = [...pendientesDrenajeMap.keys()].filter(bk => waterPositions.has(bk));
        if (restantes.length === 0) {
            for (const [wk, nuevoNivel] of alcanzable) {
                if (!waterPositions.has(wk)) continue;
                waterNiveles.set(wk, nuevoNivel);
            }
            const aReconstruir = new Set();
            for (const [wk] of alcanzable) {
                if (!waterPositions.has(wk)) continue;
                aReconstruir.add(wk);
                const [bx,by,bz] = wk.split(',').map(Number);
                [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(([dx,dy,dz]) => {
                    const nk = waterKey(bx+dx,by+dy,bz+dz);
                    if (waterPositions.has(nk)) aReconstruir.add(nk);
                });
            }
            for (const wk of aReconstruir) reconstruirBloqueAgua(...wk.split(',').map(Number));
            return;
        }

        const noSiete    = restantes.filter(bk => (waterNiveles.get(bk) ?? 0) < 7);
        const enSiete    = restantes.filter(bk => (waterNiveles.get(bk) ?? 0) === 7);
        const todosEnSiete = noSiete.length === 0;
        const candidatos = todosEnSiete ? enSiete : noSiete;

        const proporcion = Math.max(0.4, 1 - candidatos.length / 20);
        const cantidad   = Math.max(1, Math.floor(candidatos.length * (proporcion + Math.random() * 0.3)));
        for (let i = candidatos.length-1; i > 0; i--) {
            const j = Math.floor(Math.random()*(i+1));
            [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]];
        }
        const lote = candidatos.slice(0, cantidad);

        for (const bk of lote) {
            if (!waterPositions.has(bk)) continue;
            const nivelActual = waterNiveles.get(bk) ?? 0;
            const nuevoNivel  = nivelActual + 1;
            if (nuevoNivel >= 8) {
                waterPositions.delete(bk); waterNiveles.delete(bk);
                waterFlujo.delete(bk);     waterSources.delete(bk);
                pendientesDrenajeMap.delete(bk);
                if (waterMeshes.has(bk)) {
                    const m = waterMeshes.get(bk);
                    scene.remove(m); m.geometry.dispose(); waterMeshes.delete(bk);
                }
                const [bx,by,bz] = bk.split(',').map(Number);
                [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(([dx,dy,dz]) =>
                    reconstruirBloqueAgua(bx+dx,by+dy,bz+dz)
                );
            } else {
                waterNiveles.set(bk, nuevoNivel);
                pendientesDrenajeMap.set(bk, nuevoNivel);
                const [bx,by,bz] = bk.split(',').map(Number);
                reconstruirBloqueAgua(bx,by,bz);
                [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]].forEach(([dx,,dz]) =>
                    reconstruirBloqueAgua(bx+dx,by,bz+dz)
                );
            }
        }

        const total = restantes.length;
        const delay = total <= 3 ? 80 : total <= 8 ? 130 : 200 + Math.floor(Math.random()*200);
        setTimeout(drenajeStep, delay);
    }

    setTimeout(drenajeStep, 150);
}

function guardarMundo() {
    if (typeof invSlots !== 'undefined') {
        const invData = {};
        Object.keys(invSlots).forEach(k => {
            invData[k] = { mat: invSlots[k].mat };
        });
        localStorage.setItem('invSlots_' + tipoMundoActual, JSON.stringify(invData));
    }
    if (!esPropietario) {
        localStorage.setItem('posicion_multi_' + salaIdActual, JSON.stringify({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            yaw, pitch, volar: volarActivo
        }));
        return;
    }
    const rotosData = Array.from(brokenTerrain).map(k => {
        const [x, y, z] = k.split(',').map(Number);
        return { x, y, z };
    });
    const aguaData = Array.from(waterPositions).map(k => {
        const [x, y, z] = k.split(',').map(Number);
        return { x, y, z, mat: 'water', rx: 0, ry: 0, rz: 0, nivel: waterNiveles.get(k) ?? 0 };
    });
    const hojasData = [];
    leafBlocks.forEach(bloques => bloques.forEach(([lx, ly, lz]) => {
        hojasData.push({ x: lx, y: ly, z: lz, mat: 'oak_leaves', rx: 0, ry: 0, rz: 0 });
    }));
    const manualesData = [
        ...manualBlocks.map(b => ({
            x: b.position.x,
            y: b.position.y,
            z: b.position.z,
            mat: b.userData.matType || nombreMaterial.get(b.material) || nombreMaterial.get(b.material?.[0]) || 'grass',
            rx: b.rotation.x,
            ry: b.rotation.y,
            rz: b.rotation.z
        })),
        ...hojasData,
        ...aguaData
    ];
    if (!mundoIdActual) return;
    const mundoKey = 'minecraft_mundo_' + tipoMundoActual + '_' + mundoIdActual;
    localStorage.setItem(mundoKey, JSON.stringify({
        rotos: rotosData,
        manuales: manualesData,
        posicion: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            yaw: yaw,
            pitch: pitch,
            volar: volarActivo,
            sneak: sneakActivo
        }
    }));
}

function cargarMundo() {
    if (modoMultijugador) return;
    const mundoKey = 'minecraft_mundo_' + tipoMundoActual + '_' + (mundoIdActual || 'default');
    const rawData = localStorage.getItem(mundoKey);
    if (!rawData) { return; }
    const data = JSON.parse(rawData);
    const { rotos, manuales, posicion } = data;

    manualBlocks.forEach(b => scene.remove(b));
    manualBlocks.length = 0;
    brokenInstances.clear();

    if (rotos && rotos.length > 0) {
        brokenTerrain.clear();
        rotos.forEach(({ x, y, z }) => brokenTerrain.add(`${x},${y},${z}`));
        for (const key of [...activeChunks.keys()]) {
            const [cx, cz] = key.split(',').map(Number);
            const viejasMeshes = activeChunks.get(key)?.meshes || [];
            cargarChunk(cx, cz, tipoMundoChunks, true);
            viejasMeshes.forEach(m => { scene.remove(m); m.geometry.dispose(); });
        }
    }

    if (manuales) {
        manuales.forEach(({ x, y, z, mat, rx, ry, rz, nivel }) => {
            if (mat === 'water') {
                if ((nivel ?? 0) === 0) waterSources.add(waterKey(x, y, z));
                agregarAgua(x, y, z, false, nivel ?? 0);
                return;
            }
            if (mat === 'oak_leaves') {
                agregarHoja(x, y, z);
                return;
            }
            const b = crearMeshManual(mat);
            b.position.set(x, y, z);
            if (rx) b.rotation.x = rx;
            if (ry) b.rotation.y = ry;
            if (rz) b.rotation.z = rz;
            scene.add(b);
            manualBlocks.push(b);
            if (mat === 'sand') {
                b.userData.isSand = true;
                b.userData.falling = true;
                sandBlocks.push(b);
            }
        });
        reconstruirTodasLasHojas();
    }

    if (posicion) {
        camera.position.set(posicion.x, posicion.y, posicion.z);
        yaw = posicion.yaw || 0;
        pitch = posicion.pitch || 0;
        camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
        velocityY = 0;
        isJumping = false;
        const _sx = posicion.x, _sy = posicion.y, _sz = posicion.z;
        const _volar = posicion.volar || false;
        sneakActivo = posicion.sneak || false;
        sneakBtn.classList.toggle('activo', sneakActivo);
        volarActivo = true;
        function esperarChunkGuardado() {
            camera.position.set(_sx, _sy, _sz);
            velocityY = 0;
            const cx = Math.floor(_sx / CHUNK_SIZE);
            const cz = Math.floor(_sz / CHUNK_SIZE);
            const chunk = activeChunks.get(chunkKey(cx, cz));
            if (!chunk || !chunk.meshes || chunk.meshes.length === 0 || !scene.children.includes(chunk.meshes[0])) {
                setTimeout(esperarChunkGuardado, 50);
                return;
            }
            volarActivo = _volar;
prevPhysicsPos.copy(camera.position);
physicsPos.copy(camera.position);
posicionAplicada = true;
verificarOcultarCarga();
        }
        esperarChunkGuardado();
    }

    const _salaSync = salaIdActual;
    const _mundoSync = tipoMundoActual;
    setTimeout(() => {
        if (modoMultijugador) return;
        if (!socket || socket.readyState !== 1) return;
        const d = JSON.parse(rawData);
        if (d.manuales) {
            d.manuales.forEach(b => {
                socket.send(JSON.stringify({
                    type: 'block_place',
                    x: b.x, y: b.y, z: b.z,
                    mat: b.mat,
                    mundo: _mundoSync,
                    salaId: _salaSync
                }));
            });
        }
    }, 2000);
}

setInterval(() => {
    if (!mundoIniciado) return;
    if (esPropietario) {
        guardarMundo();
    } else if (salaIdActual) {
        localStorage.setItem('posicion_multi_' + salaIdActual, JSON.stringify({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            yaw, pitch, volar: volarActivo
        }));
    }
}, 10000);

window.addEventListener('beforeunload', () => {
    if (!mundoIniciado) return;
    if (esPropietario) {
        guardarMundo();
    } else if (salaIdActual) {
        localStorage.setItem('posicion_multi_' + salaIdActual, JSON.stringify({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            yaw, pitch, volar: volarActivo
        }));
    }
});

function mostrarMensaje(texto) {
    const msg = document.createElement('div');
    msg.textContent = texto;
    msg.style.cssText = 'position:absolute;top:60px;right:10px;background:rgba(0,0,0,0.7);color:white;padding:8px 14px;border-radius:6px;font-family:sans-serif;font-size:14px;pointer-events:none;';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
}

// --- EFECTO DE SELECCIÓN ---
const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
    new THREE.LineBasicMaterial({ color: 0x000000 })
);
outline.visible = false;
outline.raycast = () => {};
scene.add(outline);

// 4. VARIABLES Y CONTROLES
camera.position.set(0, 10, 5);


let moveX = 0, moveZ = 0, yaw = 0, pitch = 0;
let currentSpeed = moveSpeed;
let sprintActivo = false;
let selectedSlot = 0;
let lastTouchX = null, lastTouchY = null, lookTouchId = null, moveTouchId = null;
let velocityY = 0, isJumping = false;
let volarActivo = false;
let localPlacingFrames = 0;
let lastJumpTap = 0;
let lastSneakTap = 0;


const raycaster = new THREE.Raycaster();
raycaster.near = 0.1;
raycaster.far = 5;
const pointer = new THREE.Vector2(0, 0);

const _rayCol1 = new THREE.Raycaster();
const _rayCol2 = new THREE.Raycaster();
const _rayCol3 = new THREE.Raycaster();
const _rayTecho = new THREE.Raycaster();
const _raySuelo2 = new THREE.Raycaster();

function actualizarPointer() {
    const crosshair = document.getElementById('crosshair');
    const rect = crosshair.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const canvas = renderer.domElement;
    const cr = canvas.getBoundingClientRect();
    pointer.x = ((cx - cr.left) / cr.width) * 2 - 1;
    pointer.y = -((cy - cr.top) / cr.height) * 2 + 1;
}

// ===== MULTIJUGADOR =====
let socket = null;
let playerId = null;
let multiBarraIntervalo = null;
let tipoMundoActual = 'plano';
let salaIdActual = null;
let mundoIdActual = null;
let mundoNombreActual = 'Mi mundo';
let modoMultijugador = false;
let esPropietario = false;
const remotePlayers = new Map();

function conectarPartida() {
    if (socket) { socket.close(); socket = null; }
    socket = new WebSocket('wss://minecraft-server2-bnn6.onrender.com');

    socket.onopen = () => {
        if (salaIdActual && modoMultijugador) {
            const skinGuardada = localStorage.getItem('skinSeleccionada') || 'kevin.png';
            socket.send(JSON.stringify({
                type: 'join',
                salaId: salaIdActual,
                mundo: tipoMundoActual,
                nombre: mundoNombreActual,
                skin: skinGuardada
            }));
        }
        let progresoMulti = 0;
        if (multiBarraIntervalo) clearInterval(multiBarraIntervalo);
        multiBarraIntervalo = setInterval(() => {
            progresoMulti += Math.random() * 6 + 2;
            if (progresoMulti >= 90) { progresoMulti = 90; clearInterval(multiBarraIntervalo); }
            const barraProgreso = document.getElementById('barra-progreso-inner');
            barraProgreso.style.transition = 'width 0.15s steps(3)';
            barraProgreso.style.width = progresoMulti + '%';
        }, 150);
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'id') { playerId = data.id; }
        else if (data.type === 'world_init') {
            if (data.eventos) { data.eventos.forEach(ev => aplicarEventoBloque(ev)); }
            clearInterval(multiBarraIntervalo);
            const barraProgreso = document.getElementById('barra-progreso-inner');
            barraProgreso.style.transition = 'width 0.2s steps(4)';
            barraProgreso.style.width = '100%';
            setTimeout(() => { document.getElementById('pantalla-carga').style.display = 'none'; }, 400);
        }
        else if (data.type === 'players') { actualizarJugadoresRemotos(data.players); }
        else if (data.type === 'block_place' || data.type === 'block_break') { aplicarEventoBloque(data); }
        else if (data.type === 'sala_cerrada') {
            mostrarMensaje('La sala fue cerrada por el dueño');
            mundoIniciado = false;
            remotePlayers.forEach((j) => scene.remove(j.mesh));
            remotePlayers.clear();
            if (socket) socket.close();
            const pantallaGuardado = document.getElementById('pantalla-guardado');
            pantallaGuardado.style.display = 'flex';
            setTimeout(() => {
                pantallaGuardado.style.display = 'none';
                document.getElementById('pantalla-principal').classList.add('activa');
                renderizarMundos();
            }, 1800);
        }
        else if (data.type === 'player_left') {
            const meshObj = remotePlayers.get(data.id);
            if (meshObj) { scene.remove(meshObj.mesh); remotePlayers.delete(data.id); }
        }
    };

    socket.onerror = (err) => {
        console.error('WebSocket error', err);
        mostrarMensaje('Error de conexión al servidor');
    };
}

function configurarSocketMultijugador() {
    if (!socket) return;
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'id') { playerId = data.id; }
        else if (data.type === 'world_init') {
            if (data.eventos) { data.eventos.forEach(ev => aplicarEventoBloque(ev)); }
        }
        else if (data.type === 'players') { actualizarJugadoresRemotos(data.players); }
        else if (data.type === 'block_place' || data.type === 'block_break') { aplicarEventoBloque(data); }
        else if (data.type === 'joined') {
            setTimeout(() => enviarEstadoJugador(), 100);
            const pantallaCarga = document.getElementById('pantalla-carga');
            if (pantallaCarga.style.display !== 'none') {
                document.getElementById('barra-progreso-inner').style.transition = 'none';
                document.getElementById('barra-progreso-inner').style.width = '100%';
                setTimeout(() => { pantallaCarga.style.display = 'none'; }, 400);
            }
        }
        else if (data.type === 'sala_cerrada') {
            mostrarMensaje('La sala fue cerrada por el dueño');
            mundoIniciado = false;
            remotePlayers.forEach((j) => scene.remove(j.mesh));
            remotePlayers.clear();
            if (socket) socket.close();
            document.getElementById('pantalla-principal').classList.add('activa');
            renderizarMundos();
        }
        else if (data.type === 'player_left') {
            const meshObj = remotePlayers.get(data.id);
            if (meshObj) { scene.remove(meshObj.mesh); remotePlayers.delete(data.id); }
        }
    };
}

const texSteve = loader.load('textures/steve.png');
texSteve.magFilter = THREE.NearestFilter;
texSteve.minFilter = THREE.NearestMipmapLinearFilter;
texSteve.colorSpace = THREE.SRGBColorSpace;
texSteve.generateMipmaps = true;

const texKevin = loader.load('textures/kevin.png');
const texKiore = loader.load('textures/kiore.png');
const texPalvox = loader.load('textures/palvox.png');
const texRainbow = loader.load('textures/rainbow.png');
const texSkinss = loader.load('textures/skinss.png');

[texKevin, texKiore, texPalvox, texRainbow, texSkinss].forEach(t => {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestMipmapLinearFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = true;
});

const texturasSkins = {
    'kevin.png': texKevin,
    'kiore.png': texKiore,
    'palvox.png': texPalvox,
    'rainbow.png': texRainbow,
    'skinss.png': texSkinss
};

function uvRect(x, y, w, h) {
    const u1 = x / 64, u2 = (x + w) / 64;
    const v1 = 1 - (y + h) / 64, v2 = 1 - y / 64;
    return [u1, v1, u2, v1, u1, v2, u2, v2];
}

function aplicarUVs(geom, pX, nX, pY, nY, pZ, nZ) {
    const caras = [pX, nX, pY, nY, pZ, nZ];
    const uvAttr = geom.attributes.uv;
    caras.forEach((uv, i) => {
        const b = i * 4;
        const [u1, v1, u2, v2] = uv;
        uvAttr.setXY(b + 0, u1, v2);
        uvAttr.setXY(b + 1, u2, v2);
        uvAttr.setXY(b + 2, u1, v1);
        uvAttr.setXY(b + 3, u2, v1);
    });
    uvAttr.needsUpdate = true;
}

function uvFlat(x, y, w, h) {
    const pad = 0.05;
    return [
        (x + pad) / 64,
        1 - (y + h - pad) / 64,
        (x + w - pad) / 64,
        1 - (y + pad) / 64
    ];
}

function crearSteve(texturaSkin = null) {
    const group = new THREE.Group();
    const texturaUsar = texturaSkin || texSteve;
    const mat = new THREE.MeshBasicMaterial({ map: texturaUsar, transparent: true, alphaTest: 0.1 });

    const upperPivot = new THREE.Group();
    upperPivot.position.set(0, 0.75, 0);
    group.add(upperPivot);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.75, 0);
    const gHead = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    aplicarUVs(gHead,
        uvFlat( 0,  8, 8, 8), uvFlat(16,  8, 8, 8),
        uvFlat( 8,  0, 8, 8), uvFlat(16,  0, 8, 8),
        uvFlat( 8,  8, 8, 8), uvFlat(24,  8, 8, 8)
    );
    const headMesh = new THREE.Mesh(gHead, mat.clone());
    headMesh.position.set(0, 0.25, 0);
    headPivot.add(headMesh);
    upperPivot.add(headPivot);

    const gBody = new THREE.BoxGeometry(0.5, 0.75, 0.25);
    aplicarUVs(gBody,
        uvFlat(16, 20, 4, 12), uvFlat(28, 20, 4, 12),
        uvFlat(20, 16, 8,  4), uvFlat(28, 16, 8,  4),
        uvFlat(20, 20, 8, 12), uvFlat(32, 20, 8, 12)
    );
    const bodyMesh = new THREE.Mesh(gBody, mat.clone());
    bodyMesh.position.set(0, 0.375, 0);
    upperPivot.add(bodyMesh);

    const armRPivot = new THREE.Group();
    armRPivot.position.set(-0.375, 0.75, 0);
    const gArmR = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    aplicarUVs(gArmR,
        uvFlat(40, 20, 4, 12), uvFlat(48, 20, 4, 12),
        uvFlat(44, 16, 4,  4), uvFlat(48, 16, 4,  4),
        uvFlat(44, 20, 4, 12), uvFlat(52, 20, 4, 12)
    );
    const armRMesh = new THREE.Mesh(gArmR, mat.clone());
    armRMesh.position.set(0, -0.375, 0);
    armRPivot.add(armRMesh);
    upperPivot.add(armRPivot);

    const armLPivot = new THREE.Group();
    armLPivot.position.set(0.375, 0.75, 0);
    const gArmL = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    aplicarUVs(gArmL,
        uvFlat(48, 20, 4, 12), uvFlat(40, 20, 4, 12),
        uvFlat(44, 16, 4,  4), uvFlat(48, 16, 4,  4),
        uvFlat(44, 20, 4, 12), uvFlat(52, 20, 4, 12)
    );
    const armLMesh = new THREE.Mesh(gArmL, mat.clone());
    armLMesh.position.set(0, -0.375, 0);
    armLPivot.add(armLMesh);
    upperPivot.add(armLPivot);

    const legRPivot = new THREE.Group();
    legRPivot.position.set(-0.125, 0.75, 0);
    const gLegR = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    aplicarUVs(gLegR,
        uvFlat( 0, 20, 4, 12), uvFlat( 8, 20, 4, 12),
        uvFlat( 4, 16, 4,  4), uvFlat( 8, 16, 4,  4),
        uvFlat( 4, 20, 4, 12), uvFlat(12, 20, 4, 12)
    );
    const legRMesh = new THREE.Mesh(gLegR, mat.clone());
    legRMesh.position.set(0, -0.375, 0);
    legRPivot.add(legRMesh);
    group.add(legRPivot);

    const legLPivot = new THREE.Group();
    legLPivot.position.set(0.125, 0.75, 0);
    const gLegL = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    aplicarUVs(gLegL,
        uvFlat( 8, 20, 4, 12), uvFlat( 0, 20, 4, 12),
        uvFlat( 4, 16, 4,  4), uvFlat( 8, 16, 4,  4),
        uvFlat( 4, 20, 4, 12), uvFlat(12, 20, 4, 12)
    );
    const legLMesh = new THREE.Mesh(gLegL, mat.clone());
    legLMesh.position.set(0, -0.375, 0);
    legLPivot.add(legLMesh);
    group.add(legLPivot);

    group.scale.set(0.9, 0.9, 0.9);
    return { group, upper: upperPivot, head: headPivot, armR: armRPivot, armL: armLPivot, legR: legRPivot, legL: legLPivot };
}

// ===== PREVIEW DE STEVE EN MENÚ PRINCIPAL =====
let ppRenderer = null;
let ppScene = null;
let ppCamera = null;
let ppSteve = null;
let ppAnimId = null;

function initStevePrevio() {
    const cv = document.getElementById('pp-steve-canvas');
    if (!cv) return;
    if (ppAnimId) cancelAnimationFrame(ppAnimId);
    if (ppRenderer) ppRenderer.dispose();

    let w = cv.clientWidth;
    let h = cv.clientHeight;
    if (w === 0 || h === 0) {
        w = window.innerWidth * 0.25;
        h = window.innerHeight * 0.8;
        cv.style.width = w + 'px';
        cv.style.height = h + 'px';
    }

    ppRenderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    ppRenderer.setSize(w, h);
    ppRenderer.setPixelRatio(window.devicePixelRatio);
    ppRenderer.setClearColor(0x000000, 0);

    ppScene = new THREE.Scene();
    ppCamera = new THREE.PerspectiveCamera(50, w / h, 0.01, 100);
    ppCamera.position.set(0, 0.8, 4.5);

    const ambLight = new THREE.AmbientLight(0xffffff, 1.3);
    ppScene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(2, 1.5, 1.5);
    ppScene.add(dirLight);

    const skinInicial = localStorage.getItem('skinSeleccionada') || 'kevin.png';
    ppSteve = crearSteve(texturasSkins[skinInicial] || texSteve);
    ppScene.add(ppSteve.group);
    ppSteve.group.scale.set(0.35, 0.35, 0.35);

    function animate() {
        ppAnimId = requestAnimationFrame(animate);
        ppSteve.group.rotation.y += 0.008;
        ppRenderer.render(ppScene, ppCamera);
    }
    animate();



    window.addEventListener('resize', () => {
        const nw = cv.clientWidth || window.innerWidth * 0.25;
        const nh = cv.clientHeight || window.innerHeight * 0.8;
        ppCamera.aspect = nw / nh;
        ppCamera.updateProjectionMatrix();
        ppRenderer.setSize(nw, nh);
    });
}

function actualizarJugadoresRemotos(playersData) {
    const currentIds = new Set(playersData.map(p => p.id));
    for (let [id, obj] of remotePlayers.entries()) {
        if (!currentIds.has(id)) { scene.remove(obj.mesh); remotePlayers.delete(id); }
    }
    playersData.forEach(p => {
        if (p.id === playerId) return;
        let entry = remotePlayers.get(p.id);
        if (!entry) {
            const skinRemota = p.skin || 'kevin.png';
            const texturaRemota = texturasSkins[skinRemota] || texSteve;
            const steve = crearSteve(texturaRemota);
            scene.add(steve.group);
            entry = {
                mesh: steve.group,
                upper: steve.upper,
                head: steve.head,
                armR: steve.armR,
                armL: steve.armL,
                legR: steve.legR,
                legL: steve.legL,
                moving: false,
                placingTimer: 0,
                wasPlacing: false,
                yOffset: 0,
                baseY: p.y - 1.62
            };
            remotePlayers.set(p.id, entry);
        }
        const sneakOffsetTarget = p.sneakOffset || 0;
        if (entry.sneakOffsetActual === undefined) entry.sneakOffsetActual = sneakOffsetTarget;
        if (!entry.wasSneaking && entry.sneaking) entry.sneakOffsetActual = sneakOffsetTarget;
        if (entry.wasSneaking && !entry.sneaking) entry.sneakOffsetActual = 0;
        entry.wasSneaking = entry.sneaking;
        entry.sneakOffsetActual += (sneakOffsetTarget - entry.sneakOffsetActual) * 0.35;
        entry.baseY = p.y - 1.62 + entry.sneakOffsetActual;
        entry.mesh.position.set(p.x, entry.baseY + (entry.yOffset || 0), p.z);
        entry.mesh.rotation.y = p.yaw + Math.PI;
        entry.headPitch = -Math.max(-Math.PI / 2, Math.min(Math.PI / 2, p.pitch || 0));
        entry.head.rotation.y = 0;
        entry.moving = !!p.moving;
        entry.sprinting = !!p.sprinting;
        entry.sneaking = !!p.sneaking;
        if (p.placing && !entry.wasPlacing) entry.placingTimer = 0.3;
        entry.wasPlacing = !!p.placing;
    });
}

// ===== FUNCIONES DE MENÚ =====
window.mostrarPantallaPrincipal = function() {
    document.getElementById('pantalla-jugar').classList.remove('activa');
    document.getElementById('pantalla-ajustes').classList.remove('activa');
    document.getElementById('pantalla-principal').classList.add('activa');
    setTimeout(() => initStevePrevio(), 900);
};

window.mostrarPantallaAjustes = function() {
    document.getElementById('pantalla-principal').classList.remove('activa');
    document.getElementById('pantalla-ajustes').classList.add('activa');
    cargarAjustes();
};

function cargarAjustes() {
    const aj = JSON.parse(localStorage.getItem('mc_ajustes') || '{}');
    document.getElementById('aj-sens').value = aj.sens || 6;
    aplicarAjustes();
}

window.aplicarAjustes = function() {
    const sens = parseInt(document.getElementById('aj-sens').value);
    window._sensitivity = sens * 0.001;
    localStorage.setItem('mc_ajustes', JSON.stringify({ sens }));
};

// ===== MODO EDICIÓN DE CONTROLES =====
let editSelId = null;
const editHistorial = [];
let editHistorialIdx = -1;

function capturarEstadoEdicion() {
    const estado = {};
    editElementos.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const opMatch = el.style.background?.match(/rgba\(0,0,0,([\d.]+)\)/);
        const opVal = opMatch ? Math.round(parseFloat(opMatch[1]) * 100) : 45;
        const borderW = parseFloat(getComputedStyle(el).borderLeftWidth || 0) + parseFloat(getComputedStyle(el).borderRightWidth || 0);
        const rect2 = el.getBoundingClientRect();
        const size = Math.round(rect2.width - borderW) || (id === 'joystick-container' ? 85 : 52);
        const opacity = document.getElementById('edit-sel-opacity')
            ? (editSelId === id ? parseInt(document.getElementById('edit-sel-opacity').value) : (opVal))
            : 45;
        estado[id] = { left: rect.left, top: rect.top, size, opacity };
    });
    editHistorial.splice(editHistorialIdx + 1);
    editHistorial.push(JSON.parse(JSON.stringify(estado)));
    editHistorialIdx = editHistorial.length - 1;
    actualizarBotonesUndoRedo();
}

function aplicarEstadoEdicion(estado) {
    Object.keys(estado).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const d = estado[id];
        el.style.left   = d.left + 'px';
        el.style.top    = d.top  + 'px';
        el.style.right  = 'auto';
        el.style.bottom = 'auto';
        el.style.width  = d.size + 'px';
        el.style.height = d.size + 'px';
        const op = (d.opacity / 100).toFixed(2);
        el.style.background  = `rgba(0,0,0,${op})`;
        el.style.borderColor = `rgba(180,180,180,${op})`;
    });
    if (editSelId && estado[editSelId]) {
        const d = estado[editSelId];
        document.getElementById('edit-sel-size').value    = d.size;
        document.getElementById('edit-sel-opacity').value = d.opacity;
    }
}

function actualizarBotonesUndoRedo() {
    const undo = document.getElementById('btn-undo');
    const redo = document.getElementById('btn-redo');
    if (!undo || !redo) return;
    undo.style.color = editHistorialIdx > 0 ? 'white' : '#555';
    redo.style.color = editHistorialIdx < editHistorial.length - 1 ? 'white' : '#555';
}

window.undoEdicion = function() {
    if (editHistorialIdx <= 0) return;
    const estadoAnterior = editHistorial[editHistorialIdx];
    editHistorialIdx--;
    const estadoNuevo = editHistorial[editHistorialIdx];
    aplicarEstadoEdicion(estadoNuevo);
    actualizarBotonesUndoRedo();
    let changedId = null;
    for (const id of Object.keys(estadoAnterior)) {
        const prev = estadoAnterior[id];
        const next = estadoNuevo[id];
        if (!next) continue;
        if (prev.size !== next.size || prev.opacity !== next.opacity ||
            Math.abs(prev.left - next.left) > 1 || Math.abs(prev.top - next.top) > 1) {
            changedId = id; break;
        }
    }
    setTimeout(() => seleccionarElementoEdicion(changedId || editSelId), 0);
};

window.redoEdicion = function() {
    if (editHistorialIdx >= editHistorial.length - 1) return;
    const estadoAnterior = editHistorial[editHistorialIdx];
    editHistorialIdx++;
    const estadoNuevo = editHistorial[editHistorialIdx];
    aplicarEstadoEdicion(estadoNuevo);
    actualizarBotonesUndoRedo();
    let changedId = null;
    for (const id of Object.keys(estadoAnterior)) {
        const prev = estadoAnterior[id];
        const next = estadoNuevo[id];
        if (!next) continue;
        if (prev.size !== next.size || prev.opacity !== next.opacity ||
            Math.abs(prev.left - next.left) > 1 || Math.abs(prev.top - next.top) > 1) {
            changedId = id; break;
        }
    }
    setTimeout(() => seleccionarElementoEdicion(changedId || editSelId), 0);
};

const editElementos = [
    { id: 'joystick-container', label: 'Joystick' },
    { id: 'jump-btn',   label: 'Saltar' },
    { id: 'place-btn',  label: 'Colocar' },
    { id: 'break-btn',  label: 'Atacar' },
    { id: 'sneak-btn',  label: 'Agachar' },
    { id: 'sprint-btn', label: 'Sprint' },
];

function seleccionarElementoEdicion(id) {
    editElementos.forEach(({ id: eid }) => {
        const el = document.getElementById(eid);
        if (el) el.style.outline = '';
    });
    editSelId = id;
    const el = document.getElementById(id);
    if (!el) return;
    el.style.outline = '3px solid #fff';
    const currentSize = Math.round(el.getBoundingClientRect().width);
    const opMatch = el.style.background?.match(/rgba\(0,0,0,([\d.]+)\)/);
    const currentOpacity = opMatch ? Math.round(parseFloat(opMatch[1]) * 100) : 45;
    document.getElementById('edit-sel-size').value    = currentSize;
    document.getElementById('edit-sel-opacity').value = currentOpacity;
    document.getElementById('edit-sel-nombre').textContent = editElementos.find(e => e.id === id)?.label || id;
    document.getElementById('edit-panel-sel').style.display = 'flex';
}

window.aplicarEdicionSeleccionado = function(guardar = false) {
    if (!editSelId) return;
    const el = document.getElementById(editSelId);
    if (!el) return;
    const size = parseInt(document.getElementById('edit-sel-size').value);
    const opacity = parseInt(document.getElementById('edit-sel-opacity').value);
    const op = (opacity / 100).toFixed(2);
    el.style.width  = size + 'px';
    el.style.height = size + 'px';
    el.style.background   = `rgba(0,0,0,${op})`;
    el.style.borderColor  = `rgba(180,180,180,${op})`;
    if (guardar) capturarEstadoEdicion();
};

window.entrarModoEdicionControles = function() {
    document.getElementById('pantalla-ajustes').classList.remove('activa');
    cargarPosicionesControles();
    editSelId = null;
    editHistorial.length = 0;
    editHistorialIdx = -1;
    document.getElementById('edit-panel-sel').style.display = 'none';
    setTimeout(() => { actualizarBotonesUndoRedo(); }, 100);
    editElementos.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) el.style.outline = '';
    });

    const overlay = document.getElementById('edit-controles-overlay');
    overlay.style.display = 'flex';

    editElementos.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.touchAction = 'none';
        el.dataset.editMode = '1';

        let startX, startY, origLeft, origTop;
        let hasMoved = false;

        el.addEventListener('touchstart', onEditTouchStart, { passive: false });
        el.addEventListener('touchmove',  onEditTouchMove,  { passive: false });
        el.addEventListener('touchend',   onEditTouchEnd,   { passive: false });

        function onEditTouchStart(e) {
            if (document.getElementById('edit-controles-overlay').style.display === 'none') return;
            e.preventDefault(); e.stopPropagation();
            hasMoved = false;
            const t = e.touches[0];
            startX = t.clientX; startY = t.clientY;
            const rect = el.getBoundingClientRect();
            origLeft = rect.left;
            origTop  = rect.top;
        }

        function onEditTouchMove(e) {
            if (document.getElementById('edit-controles-overlay').style.display === 'none') return;
            e.preventDefault(); e.stopPropagation();
            const t = e.touches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved = true;
            const newLeft = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  origLeft + dx));
            const newTop  = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, origTop  + dy));
            el.style.left   = newLeft + 'px';
            el.style.top    = newTop  + 'px';
            el.style.right  = 'auto';
            el.style.bottom = 'auto';
        }

        function onEditTouchEnd(e) {
            e.preventDefault(); e.stopPropagation();
            if (!hasMoved) seleccionarElementoEdicion(id);
            else capturarEstadoEdicion();
        }

        el._editListeners = { onEditTouchStart, onEditTouchMove, onEditTouchEnd };
    });
};

function guardarPosicionesControles() {
    const raw = localStorage.getItem('mc_controles_pos');
    const pos = raw ? JSON.parse(raw) : {};
    editElementos.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const borderW = parseFloat(getComputedStyle(el).borderLeftWidth || 0) + parseFloat(getComputedStyle(el).borderRightWidth || 0);
        const rect2 = el.getBoundingClientRect();
        const size = Math.round(rect2.width - borderW) || (id === 'joystick-container' ? 85 : 52);
        const opacity = document.getElementById('edit-sel-opacity')
            ? (editSelId === id ? parseInt(document.getElementById('edit-sel-opacity').value) : (pos[id]?.opacity || 45))
            : 45;
        pos[id] = { left: rect.left, top: rect.top, size, opacity };
    });
    localStorage.setItem('mc_controles_pos', JSON.stringify(pos));
}

function cargarPosicionesControles() {
    const raw = localStorage.getItem('mc_controles_pos');
    if (!raw) return;
    const pos = JSON.parse(raw);
    Object.keys(pos).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (pos[id].left !== undefined) {
            el.style.left   = pos[id].left + 'px';
            el.style.top    = pos[id].top  + 'px';
            el.style.right  = 'auto';
            el.style.bottom = 'auto';
        }
        if (pos[id].size) {
            el.style.width  = pos[id].size + 'px';
            el.style.height = pos[id].size + 'px';
        }
        if (pos[id].opacity !== undefined) {
            const op = (pos[id].opacity / 100).toFixed(2);
            el.style.background  = `rgba(0,0,0,${op})`;
            el.style.borderColor = `rgba(180,180,180,${op})`;
        }
    });
}

window.salirModoEdicionControles = function() {
    guardarPosicionesControles();
    document.getElementById('edit-controles-overlay').style.display = 'none';
    const ids = ['joystick-container','jump-btn','place-btn','break-btn','sneak-btn','sprint-btn'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !el._editListeners) return;
        const { onEditTouchStart, onEditTouchMove, onEditTouchEnd } = el._editListeners;
        el.removeEventListener('touchstart', onEditTouchStart);
        el.removeEventListener('touchmove',  onEditTouchMove);
        el.removeEventListener('touchend',   onEditTouchEnd);
        delete el._editListeners;
        delete el.dataset.editMode;
    });
    mostrarPantallaAjustes();
};

window.resetearPosicionesControles = function() {
    localStorage.removeItem('mc_controles_pos');
    editElementos.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.left = ''; el.style.top = ''; el.style.right = ''; el.style.bottom = '';
        el.style.width = ''; el.style.height = '';
        el.style.background = ''; el.style.borderColor = '';
        el.style.outline = '';
    });
    editSelId = null;
    document.getElementById('edit-panel-sel').style.display = 'none';
};

window.restaurarAjustes = function() {
    localStorage.removeItem('mc_ajustes');
    document.getElementById('aj-sens').value = 6;
    window._sensitivity = 0.006;
};

window.cerrarModal = function() {
    document.getElementById('modal-confirmacion').classList.remove('activo');
};

window.mostrarModal = function(texto, onAceptar) {
    document.getElementById('modal-texto').textContent = texto;
    document.getElementById('modal-confirmacion').classList.add('activo');
    document.getElementById('modal-btn-si').onclick = () => {
        cerrarModal();
        onAceptar();
    };
};

// ===== SISTEMA DE MUNDOS =====
let mundosGuardados = JSON.parse(localStorage.getItem('mundos_lista') || '[]');
localStorage.removeItem('minecraft_mundo_plano_default');
localStorage.removeItem('minecraft_mundo_normal_default');
localStorage.removeItem('posicion_multi_plano');
localStorage.removeItem('posicion_multi_normal');

let mundoEditandoId = null;
let tipoSeleccionado = 'plano';
let modoSeleccionado = 'creativo';

function guardarListaMundos() {
    localStorage.setItem('mundos_lista', JSON.stringify(mundosGuardados));
}

function renderizarMundos() {
    const lista = document.getElementById('lista-mundos');
    if (!lista) return;
    if (mundosGuardados.length === 0) {
        lista.innerHTML = '<div style="color:#aaa;font-family:Courier New;font-size:13px;text-align:center;padding:20px;">No hay mundos creados</div>';
        return;
    }
    lista.innerHTML = '';
    mundosGuardados.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = 'mundo-item';
        div.innerHTML = `
            <div class="mundo-item-preview">${m.tipo === 'plano' ? '🌿' : '⛰️'}</div>
            <div class="mundo-item-info" onclick="entrarMundo(${i})">
                <div class="mundo-item-nombre">${m.nombre}</div>
                <div class="mundo-item-tipo">${m.tipo === 'plano' ? 'Plano' : 'Normal'} · ${m.modo === 'supervivencia' ? '⚔️ Supervivencia' : '🎮 Creativo'}</div>
            </div>
            <div class="mundo-item-fecha" onclick="entrarMundo(${i})">${m.fecha}</div>
            <div class="mundo-item-editar" onclick="editarMundo(${i})">✏️</div>
            <div class="mundo-item-editar" style="background:#7a2020;" onclick="eliminarMundo(${i})">🗑️</div>
        `;
        lista.appendChild(div);
    });
}

window.abrirPanelMundo = function() {
    mundoEditandoId = null;
    document.getElementById('panel-mundo-titulo').textContent = 'CREAR MUNDO';
    document.getElementById('panel-mundo-nombre').value = '';
    document.getElementById('confirmar-mundo-btn').textContent = 'Crear mundo';
    document.getElementById('tipo-plano').style.display = '';
    document.getElementById('tipo-normal').style.display = '';
    seleccionarTipo('plano');
    modoSeleccionado = 'creativo';
    document.getElementById('modo-creativo').classList.add('activo');
    document.getElementById('modo-supervivencia').classList.remove('activo');
    document.getElementById('panel-mundo').classList.add('activo');
};

window.cerrarPanelMundo = function() {
    document.getElementById('panel-mundo').classList.remove('activo');
};

window.seleccionarTipo = function(tipo) {
    tipoSeleccionado = tipo;
    document.getElementById('tipo-plano').classList.toggle('activo', tipo === 'plano');
    document.getElementById('tipo-normal').classList.toggle('activo', tipo === 'normal');
};

window.seleccionarModo = function(modo) {
    if (modo === 'supervivencia') {
        mostrarMensaje('Supervivencia — Próximamente');
        return;
    }
    modoSeleccionado = modo;
    document.getElementById('modo-creativo').classList.toggle('activo', modo === 'creativo');
    document.getElementById('modo-supervivencia').classList.toggle('activo', modo === 'supervivencia');
};

window.confirmarMundo = function() {
    let nombre = document.getElementById('panel-mundo-nombre').value.trim() || 'Mi mundo';
    const fecha = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'2-digit' });
    if (mundoEditandoId !== null) {
        mundosGuardados[mundoEditandoId].nombre = nombre;
        mundosGuardados[mundoEditandoId].tipo = tipoSeleccionado;
    } else {
        const nombresExistentes = mundosGuardados.map(m => m.nombre);
        if (nombresExistentes.includes(nombre)) {
            const base = nombre;
            let contador = 2;
            while (nombresExistentes.includes(`${base} (${contador})`)) contador++;
            nombre = `${base} (${contador})`;
        }
        const id = Date.now().toString();
        const semilla = tipoSeleccionado === 'normal' ? Math.floor(Math.random() * 999999) + 1 : 42;
        mundosGuardados.unshift({ id, nombre, tipo: tipoSeleccionado, modo: modoSeleccionado, fecha, semilla });
    }
    guardarListaMundos();
    renderizarMundos();
    cerrarPanelMundo();
};

window.editarMundo = function(i) {
    mundoEditandoId = i;
    const m = mundosGuardados[i];
    document.getElementById('panel-mundo-titulo').textContent = 'EDITAR MUNDO';
    document.getElementById('panel-mundo-nombre').value = m.nombre;
    document.getElementById('confirmar-mundo-btn').textContent = 'Guardar cambios';
    document.getElementById('tipo-plano').style.display = 'none';
    document.getElementById('tipo-normal').style.display = 'none';
    document.getElementById('panel-mundo').classList.add('activo');
};

window.eliminarMundo = function(i) {
    mostrarModal('¿Eliminar "' + mundosGuardados[i].nombre + '"? Se perderán todos los cambios.', () => {
        const m = mundosGuardados[i];
        localStorage.removeItem('minecraft_mundo_' + m.tipo + '_' + m.id);
        mundosGuardados.splice(i, 1);
        guardarListaMundos();
        renderizarMundos();
    });
};

window.entrarMundo = function(i) {
    const m = mundosGuardados[i];
    if (mundoIniciado) guardarMundo();
    tipoMundoActual = m.tipo;
    mundoIdActual = m.id;
    mundoNombreActual = m.nombre;
    noise = new SimplexNoise(m.semilla || 42);
    manualBlocks.forEach(b => scene.remove(b));
    manualBlocks.length = 0;
    brokenInstances.clear();
    brokenTerrain.clear();
    sandBlocks.length = 0;
    iniciarMundo(m.tipo, false);
};
renderizarMundos();

window.resetearMundo = function(tipo) {
    mostrarModal(
        '¿Seguro que quieres restablecer el Mundo ' + (tipo === 'plano' ? 'Plano' : 'Normal') + '? Se perderán todos los cambios.',
        () => {
            localStorage.removeItem('minecraft_mundo_' + tipo);
            localStorage.removeItem('posicion_multi_' + tipo);
        }
    );
};

window.mostrarPantallaJugar = function() {
    document.getElementById('pantalla-principal').classList.remove('activa');
    document.getElementById('pantalla-jugar').classList.add('activa');
    cambiarTab('mundos');
    renderizarMundos();
};

window.cambiarTab = function(tab) {
    document.getElementById('contenido-mundos').classList.toggle('activa', tab === 'mundos');
    document.getElementById('contenido-multi').classList.toggle('activa', tab === 'multi');
    document.getElementById('tab-mundos').classList.toggle('activa', tab === 'mundos');
    document.getElementById('tab-multi').classList.toggle('activa', tab === 'multi');
    if (tab === 'multi') actualizarSalas();
};

window.actualizarSalas = function() {
    const lista = document.getElementById('lista-salas');
    const estado = document.getElementById('estado-servidor');
    lista.innerHTML = '<div class="sala-vacia">Buscando partidas...</div>';
    if (estado) { estado.textContent = '🟡 Conectando...'; estado.style.color = '#ff0'; }

    const wsTemp = new WebSocket('wss://minecraft-server2-bnn6.onrender.com');

    wsTemp.onopen = () => {
        if (estado) { estado.textContent = '🟢 Conectado'; estado.style.color = '#0f0'; }
        wsTemp.send(JSON.stringify({ type: 'get_salas' }));
    };

    wsTemp.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'salas') {
            lista.innerHTML = '';
            if (data.salas.length === 0) {
                lista.innerHTML = '<div class="sala-vacia">No hay partidas activas</div>';
            } else {
                data.salas.forEach(sala => {
                    const div = document.createElement('div');
                    div.className = 'sala-item';
                    div.textContent = `🎮 ${sala.nombre} — ${sala.jugadores} jugador(es)`;
                    div.onclick = () => {
                        wsTemp.close();
                        salaIdActual = sala.salaId;
                        mundoNombreActual = sala.nombre;
                        iniciarMundo(sala.mundo, true);
                    };
                    lista.appendChild(div);
                });
            }
            wsTemp.close();
        }
    };

    wsTemp.onerror = () => {
        lista.innerHTML = '<div class="sala-vacia">Error al conectar al servidor</div>';
        if (estado) { estado.textContent = '🔴 Sin conexión'; estado.style.color = '#f00'; }
    };

    wsTemp.onclose = () => {
        if (estado && estado.textContent.includes('Conectando')) {
            estado.textContent = '🔴 Sin conexión'; estado.style.color = '#f00';
        }
    };
};

function aplicarEventoBloque(data) {
    if (data.type === 'block_place') {
        const yaExiste = manualBlocks.some(b =>
            Math.abs(b.position.x - data.x) < 0.1 &&
            Math.abs(b.position.y - data.y) < 0.1 &&
            Math.abs(b.position.z - data.z) < 0.1
        );
        if (yaExiste) return;
        if (data.mat === 'water') waterSources.add(waterKey(data.x, data.y, data.z));
        if (data.mat === 'oak_leaves') {
            agregarHoja(data.x, data.y, data.z);
        } else {
            const b = crearMeshManual(data.mat);
            b.position.set(data.x, data.y, data.z);
            scene.add(b);
            manualBlocks.push(b);
            if (data.mat === 'sand') {
                b.userData.isSand = true;
                b.userData.falling = true;
                sandBlocks.push(b);
            }
        }
    } else if (data.type === 'block_break') {
        const bx = Math.round(data.x);
        const by = Math.round(data.y);
        const bz = Math.round(data.z);
        let idx = -1;
        for (let i = 0; i < manualBlocks.length; i++) {
            const b = manualBlocks[i];
            if (Math.abs(b.position.x - bx) < 0.1 &&
                Math.abs(b.position.y - by) < 0.1 &&
                Math.abs(b.position.z - bz) < 0.1) {
                idx = i; break;
            }
        }
        if (idx !== -1) {
            const bloque = manualBlocks[idx];
            scene.remove(bloque);
            manualBlocks.splice(idx, 1);
            const sandIdx = sandBlocks.findIndex(sb => sb === bloque);
            if (sandIdx !== -1) sandBlocks.splice(sandIdx, 1);
        } else {
            const key = `${bx},${by},${bz}`;
            if (!brokenTerrain.has(key)) {
                brokenTerrain.add(key);
                const cx = Math.floor(bx / CHUNK_SIZE);
                const cz = Math.floor(bz / CHUNK_SIZE);
                const ck = chunkKey(cx, cz);
                if (activeChunks.has(ck)) {
                    descargarChunk(ck);
                    cargarChunk(cx, cz, tipoMundoChunks);
                }
            }
        }
    }
}

function enviarEstadoJugador() {
    if (!socket || socket.readyState !== 1 || !playerId) return;
    const skinGuardada = localStorage.getItem('skinSeleccionada') || 'kevin.png';
    socket.send(JSON.stringify({
        type: 'state',
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        yaw,
        pitch,
        moving: (Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05),
        sprinting: sprintActivo && (Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05),
        placing: localPlacingFrames > 0,
        sneaking: sneakActivo,
        sneakOffset: sneakOffsetActual,
        mundo: tipoMundoActual,
        nombre: mundoNombreActual,
        esMulti: true,
        salaId: salaIdActual,
        skin: skinGuardada
    }));
    if (localPlacingFrames > 0) localPlacingFrames--;
}

// 5. EVENTOS
const knob = document.getElementById('joystick-knob');
const container = document.getElementById('joystick-container');
let joyRect = container.getBoundingClientRect();

function actualizarJoyRect() {
    joyRect = container.getBoundingClientRect();
}

window.addEventListener('touchstart', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        actualizarJoyRect();
        const isJoy = (t.clientX > joyRect.left && t.clientX < joyRect.right && t.clientY > joyRect.top && t.clientY < joyRect.bottom);
        if (isJoy && moveTouchId === null) moveTouchId = t.identifier;
        else if (lookTouchId === null) {
            const isBtn = t.target.closest('.action-button') || t.target.closest('.hotbar-slot') || t.target.closest('#sprint-btn');
            if (!isBtn) {
                lookTouchId = t.identifier;
                lastTouchX = t.clientX;
                lastTouchY = t.clientY;
            }
        }
    }
});

window.addEventListener('touchmove', (e) => {
    if (e.target.closest('#edit-controles-overlay')) return;
    if (e.target.closest('#pantalla-ajustes')) return;
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === moveTouchId) {
            actualizarJoyRect();
            let dx = t.clientX - (joyRect.left + joyRect.width / 2), dy = t.clientY - (joyRect.top + joyRect.height / 2);
            let lx = Math.max(-50, Math.min(50, dx)), ly = Math.max(-50, Math.min(50, dy));
            moveX = lx / 35; moveZ = ly / 35;
            currentSpeed = sprintActivo ? sprintSpeed : moveSpeed;
            knob.style.transform = `translate(${lx}px, ${ly}px)`;
        }
        if (t.identifier === lookTouchId) {
            const sens = window._sensitivity || sensitivity;
            yaw -= (t.clientX - lastTouchX) * sens;
            pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch - (t.clientY - lastTouchY) * sens));
            camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
            lastTouchX = t.clientX; lastTouchY = t.clientY;
        }
    }
}, { passive: false });

window.addEventListener('touchend', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === moveTouchId) {
            moveTouchId = null; moveX = 0; moveZ = 0;
            knob.style.transform = `translate(0,0)`;
            sprintActivo = false;
            currentSpeed = moveSpeed;
            document.getElementById('sprint-btn').classList.remove('activo');
        }
        if (t.identifier === lookTouchId) lookTouchId = null;
    }
});


let _cacheMeshesActivos = [];
let _cacheMeshesSolidos = [];
let _cacheMeshesFrame = -1;

function getMeshesActivos() {
    if (_cacheMeshesFrame === hitFrame) return _cacheMeshesActivos;
    const cercanos = manualBlocks.filter(b =>
        Math.abs(b.position.x - camera.position.x) <= RENDER_DISTANCE &&
        Math.abs(b.position.z - camera.position.z) <= RENDER_DISTANCE
    );
    const pcx = Math.floor(camera.position.x / CHUNK_SIZE);
    const pcz = Math.floor(camera.position.z / CHUNK_SIZE);
    const hojasArr = [...leafChunkMeshes.entries()]
        .filter(([k]) => {
            const [cx, cz] = k.split(',').map(Number);
            return Math.abs(cx - pcx) <= 2 && Math.abs(cz - pcz) <= 2;
        })
        .map(([, m]) => m);
    _cacheMeshesActivos = [...getChunkMeshes(), ...cercanos, ...waterMeshes.values(), ...hojasArr];
    const hojasColision = [...leafChunkMeshes.values()];
    _cacheMeshesSolidos = [...getChunkMeshes(), ...cercanos.filter(b => !b.userData.isWater && !b.userData.noCollision), ...hojasColision];
    _cacheMeshesFrame = hitFrame;
    return _cacheMeshesActivos;
}
function getMeshesSolidos() {
    if (_cacheMeshesFrame === hitFrame) return _cacheMeshesSolidos;
    getMeshesActivos();
    return _cacheMeshesSolidos;
}

function getSelectedMat() {
    if (typeof invSlots === 'undefined') return materials;
    const slot = invSlots[selectedSlot];
    if (!slot || !slot.mat) return null;
    if (!(slot.mat in materialPorNombre)) return null;
    return materialPorNombre[slot.mat];
}

function realizarAccion(tipo) {
    actualizarPointer();
    raycaster.setFromCamera(pointer, camera);
    const rayPoner = new THREE.Raycaster();
    rayPoner.near = 0;
    rayPoner.far = 5;
    rayPoner.setFromCamera(pointer, camera);

    const objetosBuscados = getMeshesActivos();
    const hitsRomper = raycaster.intersectObjects(objetosBuscados).filter(h => {
        if (h.object instanceof THREE.InstancedMesh) {
            const rotos = brokenInstances.get(h.object);
            return !(rotos && rotos.has(h.instanceId));
        }
        return true;
    });

    const hitsPoner = rayPoner.intersectObjects(objetosBuscados).filter(h =>
        !(h.object instanceof THREE.InstancedMesh && brokenInstances.get(h.object)?.has(h.instanceId))
    );

    const hits = tipo === 'poner' ? hitsPoner : hitsRomper;

    if (hits.length > 0 && hits[0].distance <= 4.5) {
        const target = hits[0].object;

        if (tipo === 'romper') {
            const esChunk = target.userData.isChunk || target.name === "chunk_mesh" || getChunkMeshes().includes(target);
            if (target.userData.isWater) {
                return;
            } else if (esChunk) {
                romperBloqueChunk(hits[0], target);
            } else {
                const bx = Math.round(target.position.x);
                const by = Math.round(target.position.y);
                const bz = Math.round(target.position.z);
                if ([...leafChunkMeshes.values()].includes(target)) {
                    const hit0 = hits[0];
                    const n = hit0.face.normal;
                    const bx = Math.round(hit0.point.x - n.x * 0.5);
                    const by = Math.round(hit0.point.y - n.y * 0.5);
                    const bz = Math.round(hit0.point.z - n.z * 0.5);
                    leafBlocks.forEach((bloques, key) => {
                        const idx = bloques.findIndex(([lx,ly,lz]) => lx===bx && ly===by && lz===bz);
                        if (idx !== -1) {
                            bloques.splice(idx, 1);
                            const [cx, cz] = key.split(',').map(Number);
                            reconstruirHojasChunk(cx, cz);
                        }
                    });
                } else {
                    scene.remove(target);
                    const idx = manualBlocks.indexOf(target);
                    if (idx !== -1) manualBlocks.splice(idx, 1);
                }
                if (socket && socket.readyState === 1) {
                    socket.send(JSON.stringify({ type: 'block_break', x: target.position.x, y: target.position.y, z: target.position.z, mundo: tipoMundoActual, salaId: salaIdActual }));
                }
                setTimeout(() => {
                    [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(([dx,dy,dz]) => {
                        const vx = bx+dx, vy = by+dy, vz = bz+dz;
                        if (esAgua(vx,vy,vz)) {
                            const vn = waterNiveles.get(waterKey(vx,vy,vz)) ?? 8;
                            if (vn === 0) fluirAgua(vx,vy,vz,0);
                            else fluirAgua(vx,vy,vz,vn);
                        }
                    });
                }, 100);
            }
        } else if (tipo === 'poner') {
            if (target.userData.isWater) {
                const hp = hits[0].point;
                let mejorK = null, mejorDist = 999, mejorNivel = 8;
                waterPositions.forEach(k => {
                    const [wx,wy,wz] = k.split(',').map(Number);
                    const d = Math.abs(wx - hp.x) + Math.abs(wy - hp.y) + Math.abs(wz - hp.z);
                    if (d < mejorDist) { mejorDist = d; mejorK = k; mejorNivel = waterNiveles.get(k) ?? 8; }
                });
                if (mejorK) {
                    const [wx,wy,wz] = mejorK.split(',').map(Number);
                    const matSeleccionada = invSlots[selectedSlot]?.mat;
                    if (matSeleccionada === 'bucket_empty') {
                        if (mejorNivel !== 0) return;
                        quitarAgua(wx, wy, wz);
                        return;
                    } else {
                        const matActual = getSelectedMat();
                        if (matActual && matSeleccionada !== 'water') {
                            if (mejorNivel === 0) {
                                waterGeneracion++;
                                const todasAgua = [...waterPositions];
                                todasAgua.sort((a, b) => (waterNiveles.get(b) ?? 0) - (waterNiveles.get(a) ?? 0));
                                const fuenteK = waterKey(wx, wy, wz);
                                waterPositions.delete(fuenteK);
                                waterNiveles.delete(fuenteK);
                                waterFlujo.delete(fuenteK);
                                reconstruirBloqueAgua(wx, wy, wz);
                                todasAgua.filter(wk => wk !== fuenteK).forEach((wk, i) => {
                                    setTimeout(() => {
                                        if (!waterPositions.has(wk)) return;
                                        const [ax,ay,az] = wk.split(',').map(Number);
                                        waterPositions.delete(wk);
                                        waterNiveles.delete(wk);
                                        waterFlujo.delete(wk);
                                        reconstruirBloqueAgua(ax,ay,az);
                                    }, i * 17);
                                });
                            } else {
                                quitarAgua(wx, wy, wz);
                            }
                            const b = crearMeshManual(matSeleccionada);
                            b.position.set(wx, wy, wz);
                            scene.add(b);
                            manualBlocks.push(b);
                            if (socket && socket.readyState === 1) {
                                socket.send(JSON.stringify({ type: 'block_place', x: wx, y: wy, z: wz, mat: matSeleccionada || 'grass', mundo: tipoMundoActual, salaId: salaIdActual }));
                            }
                        }
                    }
                }
                return;
            }
            let instancePos = new THREE.Vector3();
            if (target instanceof THREE.InstancedMesh) {
                const matrix = new THREE.Matrix4();
                target.getMatrixAt(hits[0].instanceId, matrix);
                instancePos.setFromMatrixPosition(matrix);
            } else if (target.userData.isChunk || [...leafChunkMeshes.values()].includes(target)) {
                const n = hits[0].face.normal;
                instancePos.set(Math.round(hits[0].point.x - n.x * 0.5), Math.round(hits[0].point.y - n.y * 0.5), Math.round(hits[0].point.z - n.z * 0.5));
            } else { instancePos.copy(target.position); }

            const worldNormal = hits[0].face.normal.clone().transformDirection(hits[0].object.matrixWorld);
            let faceNormal = new THREE.Vector3(Math.round(worldNormal.x), Math.round(worldNormal.y), Math.round(worldNormal.z));
            const pos = new THREE.Vector3().copy(instancePos).add(faceNormal);

            const jugadorMin = new THREE.Vector3(camera.position.x - 0.28, camera.position.y - 1.55, camera.position.z - 0.28);
            const jugadorMax = new THREE.Vector3(camera.position.x + 0.28, camera.position.y + 0.1, camera.position.z + 0.28);
            const bloqueMin = new THREE.Vector3(pos.x - 0.5, pos.y - 0.5, pos.z - 0.5);
            const bloqueMax = new THREE.Vector3(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);

            const feetY = camera.position.y - 1.62;
            const esPillarJump = isJumping && velocityY > 0 && pos.y <= feetY;
            const colisionJugador = !esPillarJump && (pos.x + 0.5 > jugadorMin.x && pos.x - 0.5 < jugadorMax.x && pos.y + 0.5 > jugadorMin.y && pos.y - 0.5 < jugadorMax.y && pos.z + 0.5 > jugadorMin.z && pos.z - 0.5 < jugadorMax.z);

            if (!colisionJugador) {
                const matActual = getSelectedMat();
                if (!matActual && invSlots[selectedSlot]?.mat !== 'water') return;
                if (invSlots[selectedSlot]?.mat === 'water') {
                    waterSources.add(waterKey(pos.x, pos.y, pos.z));
                    agregarAgua(pos.x, pos.y, pos.z);
                    if (socket && socket.readyState === 1) {
                        socket.send(JSON.stringify({ type: 'block_place', x: pos.x, y: pos.y, z: pos.z, mat: 'water', mundo: tipoMundoActual, salaId: salaIdActual }));
                    }
                    return;
                }
                const b = crearMeshManual(invSlots[selectedSlot]?.mat);
                b.position.copy(pos);
                scene.add(b);
                manualBlocks.push(b);
                if (socket && socket.readyState === 1) {
                    socket.send(JSON.stringify({ type: 'block_place', x: pos.x, y: pos.y, z: pos.z, mat: invSlots[selectedSlot]?.mat || 'grass', mundo: tipoMundoActual, salaId: salaIdActual }));
                }
            }
        }
    }
}

let sneakActivo = false;
let sneakOffsetActual = 0;
let sneakTargetY = null;

const sneakBtn = document.getElementById('sneak-btn');
sneakBtn.addEventListener('touchstart', (e) => {
    if (document.getElementById('edit-controles-overlay').style.display !== 'none') return;
    e.preventDefault();
    sneakPressed = true;
    const ahoraSn = performance.now();
    if (ahoraSn - lastSneakTap < 300) {
        if (volarActivo) { volarActivo = false; velocityY = 0; lastSneakTap = 0; return; }
    }
    lastSneakTap = ahoraSn;
    if (volarActivo) return;
    sneakActivo = !sneakActivo;
    sneakBtn.classList.toggle('activo', sneakActivo);
    if (sneakActivo) {
        sprintActivo = false;
        currentSpeed = moveSpeed;
        document.getElementById('sprint-btn').classList.remove('activo');
    }
});
sneakBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    sneakPressed = false;
});

let jumpPressed = false;
let sneakPressed = false;
document.getElementById('jump-btn').addEventListener('touchstart', (e) => {
    if (document.getElementById('edit-controles-overlay').style.display !== 'none') return;
    e.preventDefault();
    jumpPressed = true;
    const ahora = performance.now();
    if (ahora - lastJumpTap < 300) {
        if (!volarActivo) { volarActivo = true; velocityY = 0; }
        lastJumpTap = 0;
        return;
    }
    lastJumpTap = ahora;
    if (!volarActivo && !isJumping) {
        velocityY = jumpForce;
        isJumping = true;
    }
});
document.getElementById('jump-btn').addEventListener('touchend', (e) => {
    e.preventDefault();
    jumpPressed = false;
});

document.getElementById('break-btn').addEventListener('touchstart', (e) => {
    if (document.getElementById('edit-controles-overlay').style.display !== 'none') return;
    e.preventDefault(); localPlacingFrames = 5; realizarAccion('romper');
});
document.getElementById('place-btn').addEventListener('touchstart', (e) => {
    if (document.getElementById('edit-controles-overlay').style.display !== 'none') return;
    e.preventDefault(); localPlacingFrames = 5; realizarAccion('poner');
});

document.getElementById('sprint-btn').addEventListener('touchstart', (e) => {
    if (document.getElementById('edit-controles-overlay').style.display !== 'none') return;
    if (sneakActivo) return;
    sprintActivo = !sprintActivo;
    currentSpeed = sprintActivo ? sprintSpeed : moveSpeed;
    document.getElementById('sprint-btn').classList.toggle('activo', sprintActivo);
});

function volverAlMenu() {
    guardarMundo();
    volarActivo = false;
    jumpPressed = false;
    sneakPressed = false;
    mundoIniciado = false;
    remotePlayers.forEach((j) => scene.remove(j.mesh));
    remotePlayers.clear();
    if (socket) { socket.close(); socket = null; }

    const pantallaGuardado = document.getElementById('pantalla-guardado');
    pantallaGuardado.style.display = 'flex';
    setTimeout(() => {
        pantallaGuardado.style.display = 'none';
        document.getElementById('pantalla-principal').classList.add('activa');
        renderizarMundos();
    }, 1800);
}

const btnVolver = document.getElementById('btn-volver');
if (btnVolver) {
    btnVolver.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        volverAlMenu();
    });
    btnVolver.addEventListener('click', (e) => {
        if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
        volverAlMenu();
    });
}

// ===== INVENTARIO =====
window.invSlots = {};
const invSlots = window.invSlots;
const initHotbar = [
    { mat: 'grass' }, { mat: 'stone' }, { mat: 'wood' },
    { mat: 'dirt'  }, { mat: 'glass' }, { mat: 'sand'  },
    { mat: 'iron'  }, { mat: 'oaklog'}, { mat: 'brick' },
    { mat: 'water' },
];
initHotbar.forEach((item, i) => { invSlots[i] = item; });
const concretosInv = [
    { mat: 'c_red' }, { mat: 'c_black' }, { mat: 'c_lgray' },
    { mat: 'c_yellow' }, { mat: 'c_lblue' }, { mat: 'c_orange' },
    { mat: 'c_magenta' }, { mat: 'c_lime' }, { mat: 'c_brown' },
];
concretosInv.forEach((item, i) => { invSlots[9 + i] = item; });
for (let i = 18; i < 36; i++) invSlots[i] = { mat: null };
invSlots[18] = { mat: 'oak_leaves' };
invSlots[19] = { mat: 'water' };
invSlots[20] = { mat: 'bucket_empty' };

// ===== ICONOS ISOMÉTRICOS =====
const iconosBloques = new Map();
const defIconos = {
    grass:      ['textures/grass_carried.png',        'textures/grass_side_carried.png'],
    dirt:       ['textures/dirt.png',                 'textures/dirt.png'],
    stone:      ['textures/stone.png',                'textures/stone.png'],
    wood:       ['textures/planks_oak.png',           'textures/planks_oak.png'],
    glass:      ['textures/glass.png',                'textures/glass.png'],
    sand:       ['textures/sand.png',                 'textures/sand.png'],
    iron:       ['textures/iron_block.png',           'textures/iron_block.png'],
    brick:      ['textures/brick.png',                'textures/brick.png'],
    oaklog:     ['textures/log_oak_top.png',          'textures/log_oak.png'],
    oak_leaves: ['textures/leaves_oak.png',           'textures/leaves_oak.png'],
    water:      ['textures/bucket_water.png',         null],
    bucket_empty: ['textures/bucket_empty.png',       null],
    c_red:      ['textures/concrete_red.png',         'textures/concrete_red.png'],
    c_black:    ['textures/concrete_black.png',       'textures/concrete_black.png'],
    c_lgray:    ['textures/concrete_silver.png',      'textures/concrete_silver.png'],
    c_yellow:   ['textures/concrete_yellow.png',      'textures/concrete_yellow.png'],
    c_lblue:    ['textures/concrete_light_blue.png',  'textures/concrete_light_blue.png'],
    c_orange:   ['textures/concrete_orange.png',      'textures/concrete_orange.png'],
    c_magenta:  ['textures/concrete_magenta.png',     'textures/concrete_magenta.png'],
    c_lime:     ['textures/concrete_lime.png',        'textures/concrete_lime.png'],
    c_brown:    ['textures/concrete_brown.png',       'textures/concrete_brown.png'],
};

function cargarImgIcono(url) {
    return new Promise(res => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = url;
    });
}

function dibujarIcono(imgTop, imgSide, size = 32, tinte = null) {
    const cv = document.createElement('canvas');
    cv.width = size; cv.height = size;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const s = size;
    function face(img, a, b, c, d, e, f, bright) {
        if (!img) return;
        const w = img.naturalWidth || img.width || ATLAS_TILE;
        const h = img.naturalHeight || img.height || ATLAS_TILE;
        ctx.save();
        ctx.setTransform(a/w, b/w, c/h, d/h, e, f);
        ctx.filter = bright < 1 ? `brightness(${bright})` : 'none';
        ctx.drawImage(img, 0, 0, w, h);
        ctx.filter = 'none';
        ctx.restore();
    }
    face(imgTop,  s/2, -s/4,  s/2, s/4, 0,   s/4, 1.0);
    face(imgSide, s/2,  s/4,  0,   s/2, 0,   s/4, 0.8);
    face(imgSide, s/2, -s/4,  0,   s/2, s/2, s/2, 0.6);
    if (tinte) {
        const tmp = document.createElement('canvas');
        tmp.width = size; tmp.height = size;
        const tctx = tmp.getContext('2d');
        tctx.drawImage(cv, 0, 0);
        tctx.globalCompositeOperation = 'multiply';
        tctx.fillStyle = tinte;
        tctx.fillRect(0, 0, size, size);
        tctx.globalCompositeOperation = 'destination-in';
        tctx.drawImage(cv, 0, 0);
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(tmp, 0, 0);
    }
    return cv;
}

function generarIconos() {
    const promesas = [];
    for (const [mat, [urlTop, urlSide]] of Object.entries(defIconos)) {
        if (urlSide === null) {
            promesas.push(cargarImgIcono(urlTop).then(img => {
                if (img) iconosBloques.set(mat, urlTop);
            }));
        } else {
            promesas.push(Promise.all([cargarImgIcono(urlTop), cargarImgIcono(urlSide)]).then(([imgTop, imgSide]) => {
                if (!imgTop || !imgSide) return;
                const tinte = mat === 'oak_leaves' ? '#48b518' : null;
                const cv = dibujarIcono(imgTop, imgSide, 80, tinte);
                iconosBloques.set(mat, cv.toDataURL());
            }));
        }
    }
    Promise.all(promesas).then(() => { syncHotbarUI(); renderInvSlots(); });
}
generarIconos();

const invLayoutGuardado = localStorage.getItem('invSlots_layout');
if (invLayoutGuardado) {
    const saved = JSON.parse(invLayoutGuardado);
    Object.keys(saved).forEach(k => { if (saved[k].mat !== undefined) invSlots[k] = saved[k]; });
}
setTimeout(() => syncHotbarUI(), 600);

let invItemAgarrado = null;

function getMatObj(matNombre) {
    return materialPorNombre[matNombre] || null;
}

function syncHotbarUI() {
    for (let i = 0; i < 9; i++) {
        const sl = document.getElementById('slot-' + i);
        if (!sl) continue;
        sl.innerHTML = '';
        const url = iconosBloques.get(invSlots[i]?.mat);
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = 'width:72%;height:72%;image-rendering:pixelated;';
            sl.appendChild(img);
        }
    }
}

function renderInvSlots() {
    document.querySelectorAll('.inv-s').forEach(el => {
        const idx = parseInt(el.dataset.idx);
        el.innerHTML = '';
        const url = iconosBloques.get(invSlots[idx]?.mat);
        if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = 'width:75%;height:75%;image-rendering:pixelated;';
            el.appendChild(img);
        }
        el.classList.remove('activo', 'seleccionado');
        if (idx === selectedSlot) el.classList.add('seleccionado');
    });
}

window.abrirInv = function() {
    renderInvSlots();
    document.getElementById('inv-overlay').classList.add('activo');
};

document.getElementById('inv-caja').addEventListener('touchstart', e => e.stopPropagation());
document.getElementById('inv-caja').addEventListener('touchmove', e => e.stopPropagation());
document.getElementById('inv-caja').addEventListener('touchend', e => e.stopPropagation());
document.getElementById('inv-overlay').addEventListener('touchstart', e => { e.stopPropagation(); });

window.cerrarInv = function() {
    document.getElementById('inv-overlay').classList.remove('activo');
    invItemAgarrado = null;
    document.querySelectorAll('.inv-s').forEach(s => s.classList.remove('agarrado'));
};

document.querySelectorAll('.inv-s').forEach(el => {
    el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx);
        if (invItemAgarrado === null) {
            if (!invSlots[idx].mat && invSlots[idx].html === '') return;
            invItemAgarrado = { idx, ...invSlots[idx] };
            document.querySelectorAll('.inv-s').forEach(s => s.classList.remove('agarrado'));
            el.classList.add('agarrado');
        } else {
            const destSlot = { ...invSlots[idx] };
            invSlots[idx] = { mat: invItemAgarrado.mat };
            invSlots[invItemAgarrado.idx] = destSlot;
            invItemAgarrado = null;
            document.querySelectorAll('.inv-s').forEach(s => s.classList.remove('agarrado'));
            syncHotbarUI();
            renderInvSlots();
            const invData = {};
            Object.keys(invSlots).forEach(k => { invData[k] = { mat: invSlots[k].mat }; });
            localStorage.setItem('invSlots_layout', JSON.stringify(invData));
            const slotActivo = invSlots[selectedSlot];
            let selectedMat = slotActivo.mat ? (getMatObj(slotActivo.mat) || materials) : null;
        }
    });
});

const slotsUI = document.querySelectorAll('.hotbar-slot');
slotsUI.forEach(slot => {
    slot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        slotsUI.forEach(s => {
            s.style.border = "4px solid rgba(139, 139, 139, 0.5)";
            s.style.boxShadow = "none";
        });
        slot.style.border = "4px solid white";
        slot.style.boxShadow = "0 0 5px white";
        selectedSlot = parseInt(slot.id.split('-')[1]);
    });
});

// 6. BUCLE DE ANIMACIÓN
let lastTime = performance.now();
let physicsAccumulator = 0;

const physicsPos = new THREE.Vector3();
const prevPhysicsPos = new THREE.Vector3();
let frames = 0;
let prevTime = performance.now();
const fpsDisplay = document.getElementById('fps-counter');
let cachedSelectionHits = [];

let clock = new THREE.Clock();

const tempMatrix = new THREE.Matrix4();
const tempDir = new THREE.Vector3();
const tempOriginFeet = new THREE.Vector3();
const tempOriginHead = new THREE.Vector3();
const rayFeet = new THREE.Raycaster();
const rayHead = new THREE.Raycaster();
let hitFrame = 0;

let mundoIniciado = false;
const waterOverlayEl = document.getElementById('water-overlay');
let spawnY = 2.12;

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
clock.getDelta();
const elapsed = now - lastTime;
lastTime = now;
if (mundoIniciado && posicionAplicada) {
    physicsAccumulator += Math.min(elapsed, 100);
    let ticks = 0;
    while (physicsAccumulator >= PHYSICS_STEP && ticks < 3) {
        prevPhysicsPos.copy(camera.position);
        physicsTick();
        physicsPos.copy(camera.position);
        physicsAccumulator -= PHYSICS_STEP;
        ticks++;
    }
    const alpha = physicsAccumulator / PHYSICS_STEP;
    camera.position.lerpVectors(prevPhysicsPos, physicsPos, alpha);
}

    frames++;
    if (now >= prevTime + 500) {
        const fps = Math.round((frames * 1000) / (now - prevTime));
        fpsDisplay.innerText = `FPS: ${fps}`;
        fpsDisplay.style.color = fps < 30 ? '#f00' : (fps < 50 ? '#ff0' : '#0f0');
        frames = 0;
        prevTime = now;

        const px = Math.floor(camera.position.x);
        const py = Math.floor(camera.position.y - 1.62);
        const pz = Math.floor(camera.position.z);
        document.getElementById('coord-xyz').textContent = `X: ${px}  Y: ${py}  Z: ${pz}`;
    }

    

    if (!mundoIniciado) {
        renderer.render(scene, camera);
        return;
    }

    enviarEstadoJugador();

    const eyeWX = Math.round(camera.position.x);
    const eyeWY = Math.round(camera.position.y);
    const eyeWZ = Math.round(camera.position.z);
    const bajoAgua = waterPositions.has(waterKey(eyeWX, eyeWY, eyeWZ));
    if (bajoAgua) {
        waterOverlayEl.style.display = 'block';
        scene.fog.color.setHex(0x041a3a);
        scene.fog.near = 10;
        scene.fog.far = 28;
        scene.background.setHex(0x041a3a);
    } else {
        waterOverlayEl.style.display = 'none';
        scene.fog.color.setHex(0xa0e6ff);
        scene.fog.near = 55;
        scene.fog.far = 65;
        scene.background.setHex(0xa0e6ff);
    }

    const tAnim = performance.now() / 1000;
    remotePlayers.forEach((entry) => {
        if (!entry.head || !entry.upper) return;
        const colocando = entry.placingTimer > 0;
        if (entry.yOffset === undefined) entry.yOffset = 0;

        const tiltTarget = entry.sneaking ? 0.28 : entry.sprinting ? -0.2618 : 0;
        entry.upper.rotation.x += (tiltTarget - entry.upper.rotation.x) * 0.2;
        entry.head.rotation.x = (entry.headPitch || 0) - entry.upper.rotation.x;
        entry.head.rotation.y = 0;

        entry.armR.rotation.z = 0;
        entry.armL.rotation.z = 0;

        if (colocando) {
            entry.placingTimer -= delta / 30;
            const prog = Math.max(0, entry.placingTimer / 0.3);
            entry.armR.rotation.x = Math.sin((1 - prog) * Math.PI) * -1.2;
        }

        const sneakBase = 0;

        if (entry.moving) {
            const freq  = entry.sneaking ? 6 : entry.sprinting ? 12 : 8;
            const amp   = entry.sneaking ? 0.25 : entry.sprinting ? 0.67 : 0.52;
            const swing = Math.sin(tAnim * freq) * amp;
            entry.legR.rotation.x = sneakBase + swing;
            entry.legL.rotation.x = sneakBase - swing;
            if (!colocando) entry.armR.rotation.x = sneakBase - swing;
            entry.armL.rotation.x = sneakBase + swing;
        } else if (!colocando) {
            entry.legR.rotation.x += (sneakBase - entry.legR.rotation.x) * 0.2;
            entry.legL.rotation.x += (sneakBase - entry.legL.rotation.x) * 0.2;
            entry.armR.rotation.x += (sneakBase - entry.armR.rotation.x) * 0.2;
            entry.armL.rotation.x += (sneakBase - entry.armL.rotation.x) * 0.2;
        }
    });

    hitFrame++;

    actualizarPointer();
    raycaster.setFromCamera(pointer, camera);
    cachedSelectionHits = raycaster.intersectObjects(getMeshesActivos());

    const selectionHits = cachedSelectionHits || [];
    const hit = selectionHits
        .filter(h => {
            if (h.object instanceof THREE.InstancedMesh) {
                const rotos = brokenInstances.get(h.object);
                return !(rotos && rotos.has(h.instanceId));
            }
            return true;
        })
        .sort((a, b) => a.distance - b.distance)[0];

    if (!hit) { outline.visible = false; }

    if (hit && hit.distance <= 4.5) {
        outline.visible = true;
        if (hit.object instanceof THREE.InstancedMesh) {
            hit.object.getMatrixAt(hit.instanceId, tempMatrix);
            outline.position.setFromMatrixPosition(tempMatrix);
            outline.rotation.set(0, 0, 0);
        } else if (hit.object.userData.isChunk) {
            const n = hit.face.normal;
            outline.position.set(
                Math.round(hit.point.x - n.x * 0.5),
                Math.round(hit.point.y - n.y * 0.5),
                Math.round(hit.point.z - n.z * 0.5)
            );
            outline.rotation.set(0, 0, 0);
        } else if ([...leafChunkMeshes.values()].includes(hit.object)) {
            const n = hit.face.normal;
            outline.position.set(
                Math.round(hit.point.x - n.x * 0.5),
                Math.round(hit.point.y - n.y * 0.5),
                Math.round(hit.point.z - n.z * 0.5)
            );
            outline.rotation.set(0, 0, 0);
        } else {
            outline.position.copy(hit.object.position);
            outline.rotation.copy(hit.object.rotation);
        }
    } else {
        outline.visible = false;
    }

    if (!animate.frameCount) animate.frameCount = 0;
animate.frameCount++;
if (animate.frameCount % 30 === 0) {
    actualizarChunks();
}
    renderer.render(scene, camera);
}

function physicsTick() {
    const delta = 1.0;

    const sneakOffsetTarget = sneakActivo ? SNEAK_OFFSET : 0;
    sneakOffsetActual += (sneakOffsetTarget - sneakOffsetActual) * 0.35;

    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    fwd.y = 0; rgt.y = 0; fwd.normalize(); rgt.normalize();
    const joyMag = Math.sqrt(moveX * moveX + moveZ * moveZ);
const joyScale = joyMag > 1.0 ? joyMag : 1.0;
const joyNormX = joyMag > 0 ? moveX / joyScale : 0;
const joyNormZ = joyMag > 0 ? moveZ / joyScale : 0;
    const flySpeed = 0.30, flySprintSpeed = 0.55;
    const speedToUse = volarActivo
        ? (sprintActivo ? flySprintSpeed : flySpeed)
        : (sprintActivo ? sprintSpeed : sneakActivo ? 0.07 : moveSpeed);

    const step = new THREE.Vector3()
        .addScaledVector(fwd, -joyNormZ * speedToUse)
        .addScaledVector(rgt, joyNormX * speedToUse);

    if (sneakActivo && step.length() > 0) {
        const fwd2 = new THREE.Vector3(step.x, 0, step.z).normalize();
        const nextX = camera.position.x + fwd2.x * 0.38;
        const nextZ = camera.position.z + fwd2.z * 0.38;
        const piesY = camera.position.y - 1.62;
        const origenActual = new THREE.Vector3(camera.position.x, piesY + 0.5, camera.position.z);
        const origenSiguiente = new THREE.Vector3(nextX, piesY + 0.5, nextZ);
        const meshes = getMeshesSolidos();
        const filtroSneak = h => !(h.object instanceof THREE.InstancedMesh && brokenInstances.get(h.object)?.has(h.instanceId));
        const currentFloor = new THREE.Raycaster(
            origenActual, new THREE.Vector3(0, -1, 0), 0, 1.5
        ).intersectObjects(meshes).filter(filtroSneak);
        const nextFloor = new THREE.Raycaster(
            origenSiguiente, new THREE.Vector3(0, -1, 0), 0, 1.5
        ).intersectObjects(meshes).filter(filtroSneak);
        const currentY = currentFloor.length > 0 ? currentFloor[0].point.y : -999;
        const nextY = nextFloor.length > 0 ? nextFloor[0].point.y : -999;
        if (nextFloor.length === 0 || currentY - nextY > 0.5) {
            step.set(0, 0, 0);
        }
    }

    if (step.length() > 0) {
        const pR = sneakActivo ? 0.16 : 0.30;
        const activosMeshes = getMeshesSolidos();
        const filtro = h => !(h.object instanceof THREE.InstancedMesh && brokenInstances.get(h.object)?.has(h.instanceId));

        const checkCollision = (dir) => {
            const d = dir.clone().normalize();
            const cabezaOffset = sneakActivo ? -0.2 : 0.1;
            const eyeHForCollision = sneakActivo ? 1.62 - SNEAK_OFFSET : 1.62;
            const origenPies    = new THREE.Vector3(camera.position.x, camera.position.y - eyeHForCollision + 0.22, camera.position.z);
            const origenCintura = new THREE.Vector3(camera.position.x, camera.position.y - 0.5, camera.position.z);
            const origenCabeza  = new THREE.Vector3(camera.position.x, camera.position.y + cabezaOffset, camera.position.z);
            _rayCol1.set(origenPies,    d); _rayCol1.near = 0; _rayCol1.far = pR;
            _rayCol2.set(origenCintura, d); _rayCol2.near = 0; _rayCol2.far = pR;
            _rayCol3.set(origenCabeza,  d); _rayCol3.near = 0; _rayCol3.far = pR;
            const h1 = _rayCol1.intersectObjects(activosMeshes).filter(filtro);
            const h2 = _rayCol2.intersectObjects(activosMeshes).filter(filtro);
            const h3 = _rayCol3.intersectObjects(activosMeshes).filter(filtro);
            return h1.length > 0 || h2.length > 0 || h3.length > 0;
        };

        const tryStep = (axis) => {
            const dir = axis === 'x' ? new THREE.Vector3(step.x, 0, 0) : new THREE.Vector3(0, 0, step.z);
            if (!checkCollision(dir)) {
                if (axis === 'x') camera.position.x += step.x;
                else camera.position.z += step.z;
                return;
            }
            if (!isJumping) {
                const dirN = dir.clone().normalize();
                const origenPiesArriba = new THREE.Vector3(camera.position.x + dirN.x * pR, camera.position.y - 1.4 + 1.0, camera.position.z + dirN.z * pR);
                const origenCabArriba  = new THREE.Vector3(camera.position.x + dirN.x * pR, camera.position.y + 0.4, camera.position.z + dirN.z * pR);
                const destinoX = camera.position.x + dirN.x * pR;
                const destinoZ = camera.position.z + dirN.z * pR;
                const cabezaDestino = new THREE.Vector3(destinoX, camera.position.y + 0.2, destinoZ);
                const techoRay  = new THREE.Raycaster(cabezaDestino, new THREE.Vector3(0, 1, 0), 0, 0.3);
                const hTecho    = techoRay.intersectObjects(activosMeshes).filter(filtro);
                const bloqueEncima = new THREE.Vector3(destinoX, camera.position.y - 0.5, destinoZ);
                const techoRay2 = new THREE.Raycaster(bloqueEncima, new THREE.Vector3(0, 1, 0), 0, 1.5);
                const hTecho2   = techoRay2.intersectObjects(activosMeshes).filter(filtro);
                const hArriba1  = new THREE.Raycaster(origenPiesArriba, dirN, 0, pR).intersectObjects(activosMeshes).filter(filtro);
                const hArriba2  = new THREE.Raycaster(origenCabArriba,  dirN, 0, pR).intersectObjects(activosMeshes).filter(filtro);
                const origenSuelo = new THREE.Vector3(camera.position.x + dirN.x * pR, camera.position.y, camera.position.z + dirN.z * pR);
                const hSuelo    = new THREE.Raycaster(origenSuelo, new THREE.Vector3(0, -1, 0), 0, 2.5).intersectObjects(activosMeshes).filter(filtro);
                const techoActual = new THREE.Raycaster(new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z), new THREE.Vector3(0, 1, 0), 0, 0.4);
                const hTechoActual = techoActual.intersectObjects(activosMeshes).filter(filtro);
                const enSuelo = !isJumping && velocityY <= 0;
                if (enSuelo && !sneakActivo && hArriba1.length === 0 && hArriba2.length === 0 && hTecho.length === 0 && hTecho2.length === 0 && hTechoActual.length === 0 && hSuelo.length > 0) {
                    velocityY = jumpForce;
                    isJumping = true;
                    if (axis === 'x') camera.position.x += step.x;
                    else camera.position.z += step.z;
                }
            }
        };

        tryStep('x');
        tryStep('z');
    }

    if (volarActivo) {
        if (jumpPressed) {
            velocityY = 0.28;
        } else if (sneakPressed) {
            velocityY = -0.28;
        } else {
            velocityY *= 0.8;
        }
    } else {
        if (jumpPressed && !isJumping) {
            velocityY = jumpForce;
            isJumping = true;
        }
        velocityY += gravity;
        if (velocityY < -4.5) velocityY = -4.5;
    }

    if (velocityY > 0) {
        const ceilRay = new THREE.Raycaster(
            camera.position,
            new THREE.Vector3(0, 1, 0),
            0,
            HEAD_CLEARANCE + velocityY
        );
        const ceilHits = ceilRay.intersectObjects(getMeshesSolidos()).filter(h =>
            !(h.object instanceof THREE.InstancedMesh && brokenInstances.get(h.object)?.has(h.instanceId))
        );
        if (ceilHits.length > 0) {
            camera.position.y += Math.max(0, ceilHits[0].distance - HEAD_CLEARANCE);
            velocityY = 0;
        }
    }

    camera.position.y += velocityY;

    const floorDist = Math.max(2.5, Math.abs(velocityY) + 2);
    const floorRay = new THREE.Raycaster(camera.position, new THREE.Vector3(0, -1, 0), 0, floorDist);
    const bloquesCercanos = manualBlocks.filter(b =>
        Math.abs(b.position.x - camera.position.x) <= 2 &&
        Math.abs(b.position.z - camera.position.z) <= 2
    );
    const floorHits = floorRay.intersectObjects([...getChunkMeshes(), ...bloquesCercanos]).filter(h =>
        !(h.object instanceof THREE.InstancedMesh && brokenInstances.get(h.object)?.has(h.instanceId))
    );

    if ((!volarActivo || velocityY < 0) && floorHits.length > 0) {
        const surfaceY = floorHits[0].point.y;
        const physFeetY = camera.position.y - 1.62 + (sneakActivo ? SNEAK_OFFSET : 0);
        if (velocityY <= 0 && physFeetY <= surfaceY + 0.1) {
            camera.position.y = surfaceY + 1.62 - sneakOffsetActual;
            velocityY = 0;
            isJumping = false;
        }
    }

    if ((!volarActivo || velocityY < 0) && floorHits.length > 0 && camera.position.y - 1.62 + (sneakActivo ? SNEAK_OFFSET : 0) < floorHits[0].point.y) {
        camera.position.y = floorHits[0].point.y + 1.62 - sneakOffsetActual;
    } else if (!volarActivo && camera.position.y - 1.62 < -64) {
        camera.position.y = -64 + 1.62;
        velocityY = 0;
        isJumping = false;
    }

    for (let i = sandBlocks.length - 1; i >= 0; i--) {
        const sb = sandBlocks[i];
        if (!sb.userData.falling) continue;
        const obstaculos = manualBlocks.filter(b =>
            b !== sb &&
            Math.abs(b.position.x - sb.position.x) <= 2 &&
            Math.abs(b.position.z - sb.position.z) <= 2
        );
        const downRay = new THREE.Raycaster(
            new THREE.Vector3(sb.position.x, sb.position.y + 2, sb.position.z),
            new THREE.Vector3(0, -1, 0),
            0, 100
        );
        const hits = downRay.intersectObjects([...getChunkMeshes(), ...obstaculos]).filter(h =>
            !(h.object instanceof THREE.InstancedMesh && brokenInstances.get(h.object)?.has(h.instanceId))
        );
        const targetY = hits.length > 0 ? hits[0].point.y + 0.5 : -20;
        if (sb.position.y > targetY + 0.01) {
            sb.position.y -= 0.15;
            if (sb.position.y < targetY) sb.position.y = targetY;
        } else {
            sb.userData.falling = false;
        }
        if (sb.position.y < -15) {
            scene.remove(sb);
            const mi = manualBlocks.indexOf(sb);
            if (mi !== -1) manualBlocks.splice(mi, 1);
            sandBlocks.splice(i, 1);
        }
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    joyRect = container.getBoundingClientRect();
});

cargarPosicionesControles();
animate();

window.addEventListener('load', () => {
    setTimeout(() => {
        if (document.getElementById('pantalla-principal').classList.contains('activa')) {
            initStevePrevio();
        }
    }, 500);
});

// ===== VESTIDOR =====
const skinOptions = [
    { nombre: 'Kevin', archivo: 'kevin.png' },
    { nombre: 'Kiore', archivo: 'kiore.png' },
    { nombre: 'Palvox', archivo: 'palvox.png' },
    { nombre: 'Rainbow', archivo: 'rainbow.png' },
    { nombre: 'Skinss', archivo: 'skinss.png' }
];
let skinSeleccionada = 'kevin.png';
let vestRenderer = null;
let vestScene = null;
let vestCamera = null;
let vestSteve = null;
let vestAnimId = null;

window.abrirVestidor = function() {
    skinSeleccionada = localStorage.getItem('skinSeleccionada') || 'kevin.png';
    document.getElementById('pantalla-principal').classList.remove('activa');
    document.getElementById('pantalla-vestidor').classList.add('activa');
    renderer.domElement.style.display = 'none';
    renderizarListaSkins();
    setTimeout(() => initSteveVestidor(), 200);
};

window.cerrarVestidor = function() {
    document.getElementById('pantalla-vestidor').classList.remove('activa');
    document.getElementById('pantalla-principal').classList.add('activa');
    renderer.domElement.style.display = 'block';
    if (vestAnimId) cancelAnimationFrame(vestAnimId);
    if (vestRenderer) vestRenderer.dispose();
};

function renderizarListaSkins() {
    const lista = document.getElementById('vest-lista-skins');
    lista.innerHTML = '';
    skinOptions.forEach(skin => {
        const div = document.createElement('div');
        div.className = 'vest-skin-item';
        if (skin.archivo === skinSeleccionada) div.classList.add('seleccionado');
        div.textContent = skin.nombre;
        div.onclick = () => seleccionarSkin(skin.archivo);
        lista.appendChild(div);
    });
}

function seleccionarSkin(archivo) {
    skinSeleccionada = archivo;
    renderizarListaSkins();
    recargarSteveVestidor();
}

function initSteveVestidor() {
    if (vestAnimId) cancelAnimationFrame(vestAnimId);
    if (vestRenderer) { vestRenderer.dispose(); vestRenderer = null; }

    const contenedor = document.getElementById('vest-derecha');
    if (!contenedor) return;

    const viejo = document.getElementById('vest-steve-canvas');
    if (viejo) viejo.remove();

    const w = Math.floor(contenedor.clientWidth || window.innerWidth * 0.45);
    const h = Math.floor(contenedor.clientHeight || window.innerHeight * 0.7);

    const cv = document.createElement('canvas');
    cv.id = 'vest-steve-canvas';
    cv.width = w;
    cv.height = h;
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    cv.style.display = 'block';
    contenedor.appendChild(cv);

    vestRenderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    vestRenderer.setSize(w, h);
    vestRenderer.setPixelRatio(window.devicePixelRatio);
    vestRenderer.setClearColor(0x000000, 0);

    vestScene = new THREE.Scene();
    vestCamera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
    vestCamera.position.set(0, 0.8, 3.2);
    vestCamera.lookAt(0, 1, 0);

    vestScene.add(new THREE.AmbientLight(0xffffff, 1.3));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(2, 1.5, 1.5);
    vestScene.add(dirLight);

    const textura = texturasSkins[skinSeleccionada];
    vestSteve = crearSteve(textura);
    vestScene.add(vestSteve.group);
    vestSteve.group.scale.set(1.0, 1.0, 1.0);

    function animVest() {
        vestAnimId = requestAnimationFrame(animVest);
        vestSteve.group.rotation.y += 0.008;
        vestRenderer.render(vestScene, vestCamera);
    }
    animVest();
}

window.recargarSteveVestidor = function() {
    if (!vestSteve) return;
    vestScene.remove(vestSteve.group);
    const textura = texturasSkins[skinSeleccionada];
    vestSteve = crearSteve(textura);
    vestScene.add(vestSteve.group);
    vestSteve.group.scale.set(1.0, 1.0, 1.0);
};

window.confirmarSkinVestidor = function() {
    localStorage.setItem('skinSeleccionada', skinSeleccionada);
    if (ppSteve && ppScene) {
        ppScene.remove(ppSteve.group);
        const textura = texturasSkins[skinSeleccionada] || texSteve;
        ppSteve = crearSteve(textura);
        ppScene.add(ppSteve.group);
        ppSteve.group.scale.set(0.35, 0.35, 0.35);
    }
    cerrarVestidor();
};
