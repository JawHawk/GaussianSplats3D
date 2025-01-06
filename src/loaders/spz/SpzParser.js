import * as THREE from 'three';
import { UncompressedSplatArray } from '../UncompressedSplatArray.js';
import * as SpzLoaderCore from '@spz-loader/core';

export class SpzParser {

    static clamp(val, min, max) {
        return Math.max(Math.min(val, max), min);
    }

    static async parseStandardSpzToUncompressedSplatArray(inBuffer) {
        inBuffer = new Uint8Array(inBuffer);
        const splat = await SpzLoaderCore.loadSpz(inBuffer);
        const splatCount = splat.numPoints;

        const splatArray = new UncompressedSplatArray();
        for (let i = 0; i < splatCount; i++) {
            const ind = i*3;
            const rotInd = i*4;

            const inCenter = [splat.positions[ind], splat.positions[ind+1], splat.positions[ind+2]];
            const inScale = [splat.scales[ind], splat.scales[ind+1], splat.scales[ind+2]];
            const float32Color = new Float32Array([splat.colors[ind], splat.colors[ind+1], splat.colors[ind+2]]);
            const inColor = Uint8Array.from(float32Color, value => this.clamp(Math.round(value*255), 0, 255));

            const float32Rotation = new Float32Array([splat.rotations[rotInd], splat.rotations[rotInd+1], splat.rotations[rotInd+2], splat.rotations[rotInd+3]]);
            const inRotation = Uint8Array.from(float32Rotation, value => Math.round((value / (2 * Math.PI)) * 255));
            // const quat = new THREE.Quaternion((inRotation[1] - 128) / 128, (inRotation[2] - 128) / 128,
            //                                   (inRotation[3] - 128) / 128, (inRotation[0] - 128) / 128);
            const quat = new THREE.Quaternion(float32Rotation[0], float32Rotation[1], float32Rotation[2], float32Rotation[3]);
            quat.normalize();

            splatArray.addSplatFromComonents(inCenter[0], inCenter[1], inCenter[2], inScale[0], inScale[1], inScale[2],
                                             quat.w, quat.x, quat.y, quat.z, inColor[0], inColor[1], inColor[2], (1 / (1 + Math.exp(-splat.alphas[i]))) * 255);
                                             
        }

        return splatArray;
    }
}
