import * as THREE from 'three';
import { B_TOP, B_NS, B_EW, B_BOTTOM, CHUNK_SIZE } from '../config/constants.js';
import { loader } from '../render/textures.js';
import { scene, manualBlocks, crearMeshManual } from '../../game.js';

export function crearMaterialesHojas(tex) {
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
export const texLeaves = loader.load('textures/leaves_oak.png');
texLeaves.magFilter = texLeaves.minFilter = THREE.NearestFilter;
texLeaves.colorSpace = THREE.SRGBColorSpace;
texLeaves.generateMipmaps = false;
export const oakLeavesMaterial = crearMaterialesHojas(texLeaves);
oakLeavesMaterial.forEach(m => { m.color.set(0x48b518); });

export const leafBlocks = new Map();
export const leafChunkMeshes = new Map();

export function leafChunkKey(cx, cz) { return `${cx},${cz}`; }

export function reconstruirHojasChunk(cx, cz) {
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

export function agregarHoja(x, y, z) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const key = leafChunkKey(cx, cz);
    if (!leafBlocks.has(key)) leafBlocks.set(key, []);
    leafBlocks.get(key).push([x, y, z]);
    reconstruirHojasChunk(cx, cz);
}

export function reconstruirTodasLasHojas() {
    leafBlocks.forEach((_, key) => {
        const [cx, cz] = key.split(',').map(Number);
        reconstruirHojasChunk(cx, cz);
    });
}

export function plantarArbol(x, y, z) {
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