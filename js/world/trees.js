import * as THREE from 'three';
import { leavesMaterial } from '../render/textures.js';
import { CHUNK_SIZE } from '../config/constants.js';

let _scene, _manualBlocks, _activeChunks, _chunkKey, _brokenTerrain, _crearMeshManual;

export function initTrees(ctx) {
    _scene          = ctx.scene;
    _manualBlocks   = ctx.manualBlocks;
    _activeChunks   = ctx.activeChunks;
    _chunkKey       = ctx.chunkKey;
    _brokenTerrain  = ctx.brokenTerrain;
    _crearMeshManual = ctx.crearMeshManual;
}

function crearMeshHojas(x, y, z) {
    const faceData = [
        { dir:[1,0,0],  verts:[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]] },
        { dir:[-1,0,0], verts:[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]] },
        { dir:[0,1,0],  verts:[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]] },
        { dir:[0,-1,0], verts:[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]] },
        { dir:[0,0,1],  verts:[[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,.5]] },
        { dir:[0,0,-1], verts:[[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,-.5,-.5]] },
    ];

    function vecinoTipo(nx, ny, nz) {
        for (const b of _manualBlocks) {
            if (Math.round(b.position.x) === nx &&
                Math.round(b.position.y) === ny &&
                Math.round(b.position.z) === nz) {
                return b.userData.matType || 'solid';
            }
        }
        const k = `${nx},${ny},${nz}`;
        if (_brokenTerrain.has(k)) return 'air';
        const cx = Math.floor(nx / CHUNK_SIZE);
        const cz = Math.floor(nz / CHUNK_SIZE);
        const chunk = _activeChunks.get(_chunkKey(cx, cz));
        if (chunk && chunk.allBlockSet && chunk.allBlockSet.has(k)) return 'solid';
        return 'air';
    }

    const posArr = [], uvs = [], idxArr = [];
    let vi = 0;

    faceData.forEach(({ dir: [dx, dy, dz], verts }, fi) => {
        const nx = x + dx, ny = y + dy, nz = z + dz;
        const tipo = vecinoTipo(nx, ny, nz);
        if (tipo !== 'air' && tipo !== 'oak_leaves') return;
        if (tipo === 'oak_leaves' && fi % 2 !== 0) return;
        verts.forEach(([vx, vy, vz]) => posArr.push(vx, vy, vz));
        uvs.push(0,0, 0,1, 1,1, 1,0);
        idxArr.push(vi, vi+1, vi+2, vi, vi+2, vi+3);
        vi += 4;
    });

    if (posArr.length === 0) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idxArr);

    const mesh = new THREE.Mesh(geo, leavesMaterial[0]);
    mesh.position.set(x, y, z);
    mesh.userData.matType = 'oak_leaves';
    mesh.frustumCulled = false;
    return mesh;
}

export function generarArbol(baseX, baseY, baseZ) {
    const h = 4 + Math.floor(Math.random() * 3);
    const topY = baseY + h;

    // Tronco
    for (let y = baseY; y <= topY; y++) {
        const m = _crearMeshManual('oaklog');
        m.position.set(baseX, y, baseZ);
        _scene.add(m);
        _manualBlocks.push(m);
    }

    // Posiciones de hojas
    const hojasPos = [];

    // Capas bajas: 5x5 sin esquinas diagonales
    for (const dy of [-2, -1]) {
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
                if (dx === 0 && dz === 0) continue;
                hojasPos.push([baseX + dx, topY + dy, baseZ + dz]);
            }
        }
    }

    // Capas altas: 3x3 completo
    for (const dy of [0, 1]) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dz === 0 && dy === 0) continue;
                hojasPos.push([baseX + dx, topY + dy, baseZ + dz]);
            }
        }
    }

    // Registrar posiciones primero para que el face culling funcione
    const marcadores = hojasPos.map(([x, y, z]) => {
        const m = _crearMeshManual('oak_leaves');
        m.position.set(x, y, z);
        _manualBlocks.push(m);
        return { m, x, y, z };
    });

    // Reemplazar marcadores con meshes reales con face culling correcto
    marcadores.forEach(({ m, x, y, z }) => {
        const idx = _manualBlocks.indexOf(m);
        const nuevo = crearMeshHojas(x, y, z);
        if (nuevo) {
            _scene.add(nuevo);
            if (idx !== -1) _manualBlocks[idx] = nuevo;
        } else {
            if (idx !== -1) _manualBlocks.splice(idx, 1);
        }
    });
}