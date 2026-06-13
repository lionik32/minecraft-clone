import * as THREE from 'three';
import { ATLAS_COLS, ATLAS_TILE, ATLAS_W, ATLAS_H, B_TOP, B_NS, B_EW, B_BOTTOM } from '../config/constants.js'; 

export const atlasArchivos = [
    'textures/dirt.png', 'textures/stone.png', 'textures/planks_oak.png', 'textures/sand.png', 'textures/iron_block.png',
    'textures/brick.png', 'textures/log_oak_top.png', 'textures/log_oak.png', 'textures/glass.png', 'textures/grass_carried.png',
    'textures/grass_side_carried.png', 'textures/concrete_red.png', 'textures/concrete_black.png', 'textures/concrete_silver.png', 'textures/concrete_yellow.png',
    'textures/concrete_light_blue.png', 'textures/concrete_orange.png', 'textures/concrete_magenta.png', 'textures/concrete_lime.png', 'textures/concrete_brown.png'
];

export const ATLAS_IDX = {};
atlasArchivos.forEach((nombre, i) => { ATLAS_IDX[nombre] = i; });

export function atlasUV(idx) {
    const col = idx % ATLAS_COLS;
    const row = Math.floor(idx / ATLAS_COLS);
    const pad = 0.45 / ATLAS_TILE;
    return {
        u0: (col * ATLAS_TILE + pad) / ATLAS_W,
        u1: ((col + 1) * ATLAS_TILE - pad) / ATLAS_W,
        v0: 1 - ((row + 1) * ATLAS_TILE - pad) / ATLAS_H,
        v1: 1 - (row * ATLAS_TILE + pad) / ATLAS_H
    };
}

export let atlasTexture = null;
export let atlasListo = false;

export function cargarAtlas() {
    return new Promise((resolve) => {
        const cv = document.createElement('canvas');
        cv.width = ATLAS_W;
        cv.height = ATLAS_H;
        const ctx = cv.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        let cargadas = 0;
        atlasArchivos.forEach((archivo, i) => {
            const img = new Image();
            img.onload = () => {
                const col = i % ATLAS_COLS;
                const row = Math.floor(i / ATLAS_COLS);
                ctx.drawImage(img, 0, 0, 16, 16, col * ATLAS_TILE, row * ATLAS_TILE, ATLAS_TILE, ATLAS_TILE);
                cargadas++;
                if (cargadas === atlasArchivos.length) {
                    atlasTexture = new THREE.CanvasTexture(cv);
                    atlasTexture.magFilter = THREE.NearestFilter;
                    atlasTexture.minFilter = THREE.NearestMipmapLinearFilter;
                    atlasTexture.colorSpace = THREE.SRGBColorSpace;
                    atlasTexture.generateMipmaps = true;
                    atlasTexture.wrapS = THREE.ClampToEdgeWrapping;
                    atlasTexture.wrapT = THREE.ClampToEdgeWrapping;
                    atlasListo = true;
                    resolve(atlasTexture);
                }
            };
            img.onerror = () => {
                cargadas++;
                if (cargadas === atlasArchivos.length) resolve(atlasTexture);
            };
            img.src = archivo;
        });
    });
}

export const loader = new THREE.TextureLoader();

export const texSide = loader.load('textures/grass_side_carried.png');
export const texTop = loader.load('textures/grass_carried.png');
export const texBottom = loader.load('textures/dirt.png');
export const texStone = loader.load('textures/stone.png');
export const texWood = loader.load('textures/planks_oak.png');

[texSide, texTop, texBottom, texStone, texWood].forEach(t => {
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = false;
});

export const atlasMaterial = new THREE.MeshBasicMaterial({
    map: null,
    side: THREE.FrontSide,
    vertexColors: true
});

export function actualizarAtlasMaterial(tex) {
    atlasMaterial.map = tex;
    atlasMaterial.needsUpdate = true;
}

export function crearMateriales(texTop, texSide, texBottom) {
    return [
        new THREE.MeshBasicMaterial({ map: texSide,   color: new THREE.Color(B_EW, B_EW, B_EW),       side: THREE.FrontSide }),
        new THREE.MeshBasicMaterial({ map: texSide,   color: new THREE.Color(B_EW, B_EW, B_EW),       side: THREE.FrontSide }),
        new THREE.MeshBasicMaterial({ map: texTop,    color: new THREE.Color(B_TOP, B_TOP, B_TOP),     side: THREE.FrontSide }),
        new THREE.MeshBasicMaterial({ map: texBottom, color: new THREE.Color(B_BOTTOM, B_BOTTOM, B_BOTTOM), side: THREE.FrontSide }),
        new THREE.MeshBasicMaterial({ map: texSide,   color: new THREE.Color(B_NS, B_NS, B_NS),        side: THREE.FrontSide }),
        new THREE.MeshBasicMaterial({ map: texSide,   color: new THREE.Color(B_NS, B_NS, B_NS),        side: THREE.FrontSide }),
    ];
}

export function crearMaterialesUniformes(tex) {
    return crearMateriales(tex, tex, tex);
}

export const materials    = crearMateriales(texTop, texSide, texBottom);
export const stoneMaterial = crearMaterialesUniformes(texStone);
export const woodMaterial  = crearMaterialesUniformes(texWood);

export const texSand = loader.load('textures/sand.png');
texSand.magFilter = texSand.minFilter = THREE.NearestFilter;
texSand.colorSpace = THREE.SRGBColorSpace;
texSand.generateMipmaps = false;
export const sandMaterial = crearMaterialesUniformes(texSand);