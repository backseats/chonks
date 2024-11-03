import { RefObject } from "react";
import * as THREE from 'three';
import { DoubleSide } from "three";
const geom = new THREE.BoxGeometry(1, 1, 1)

export function parseZColorMap(colorMap: string, group: RefObject<THREE.Group>, addBox: Function) {
    for (let i = 0; i < colorMap.length; i += 12) {
        const x = parseInt(colorMap.slice(i, i + 2), 16);
        const y = parseInt(colorMap.slice(i + 2, i + 4), 16);
        const z = parseInt(colorMap.slice(i + 4, i + 6), 16);
        const r = parseInt(colorMap.slice(i + 6, i + 8), 16);
        const g = parseInt(colorMap.slice(i + 8, i + 10), 16);
        const b = parseInt(colorMap.slice(i + 10, i + 12), 16);

        const color = (r << 16) + (g << 8) + b;

        const adjustedX = x - 14.5;
        const adjustedY = 30 - (y + 14.5);
        const adjustedZ = z - 5.5;

        addBox(group, color, adjustedX, adjustedY, adjustedZ);
    }
}

export function convertToByteArray(pixelsArray: [number, number, number, string][]) {
    let byteArray = '';

    pixelsArray.forEach(pixel => {
        const [x, y, z, color] = pixel;

        const xHex = x.toString(16).padStart(2, '0');
        const yHex = y.toString(16).padStart(2, '0');
        const zHex = z.toString(16).padStart(2, '0');

        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        const rHex = r.toString(16).padStart(2, '0');
        const gHex = g.toString(16).padStart(2, '0');
        const bHex = b.toString(16).padStart(2, '0');

        byteArray += xHex + yHex + zHex + rHex + gHex + bHex;
    });

    return byteArray;
}

export function addBox(group: RefObject<THREE.Group>, color: number, x: number, y: number, z: number) {
    // Check for existing mesh at position
    if (group.current) {
        const existingMesh = group.current.children.find(child => 
            child.position.x === x && 
            child.position.y === y && 
            child.position.z === z
        );
        
        // Remove existing mesh if found
        if (existingMesh) {
            group.current.remove(existingMesh);
            // Dispose of geometry and material to prevent memory leaks
            if (existingMesh instanceof THREE.Mesh) {
                existingMesh.geometry.dispose();
                (existingMesh.material as THREE.Material).dispose();
            }
        }
    }

    // Create and add new mesh
    let mesh = new THREE.Mesh(
        geom, 
        new THREE.MeshStandardMaterial({ 
            color: color, 
            side: DoubleSide, 
            opacity: 0.5, 
            transparent: false 
        })
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(x, y, z);
    
    if (group.current) {
        group.current.add(mesh);
    }
    return mesh;
}
