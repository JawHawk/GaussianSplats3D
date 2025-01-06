import { Constants } from "../../Constants";
import {
  delayedExecute,
  fetchWithProgress,
  nativePromiseWithExtractedComponents,
} from "../../Util";
import { InternalLoadType } from "../InternalLoadType";
import { LoaderStatus } from "../LoaderStatus";
import { SplatBuffer } from "../SplatBuffer";
import { SplatBufferGenerator } from "../SplatBufferGenerator";
import { SpzParser } from "./SpzParser";
import * as THREE from "three";

function finalize(
  splatData,
  optimizeSplatData,
  minimumAlpha,
  compressionLevel,
  sectionSize,
  sceneCenter,
  blockSize,
  bucketSize
) {
  if (optimizeSplatData) {
    console.log("optimize", splatData);
    const splatBufferGenerator = SplatBufferGenerator.getStandardGenerator(
      minimumAlpha,
      compressionLevel,
      sectionSize,
      sceneCenter,
      blockSize,
      bucketSize
    );
    return splatBufferGenerator.generateFromUncompressedSplatArray(splatData);
  } else {
    return SplatBuffer.generateFromUncompressedSplatArrays(
      [splatData],
      minimumAlpha,
      0,
      new THREE.Vector3()
    );
  }
}

export class SpzLoader {
  static loadFromURL(
    fileName,
    onProgress,
    loadDirectoToSplatBuffer,
    onProgressiveLoadSectionProgress,
    minimumAlpha,
    compressionLevel,
    optimizeSplatData = true,
    headers,
    sectionSize,
    sceneCenter,
    blockSize,
    bucketSize
  ) {
    let internalLoadType = InternalLoadType.DirectToSplatArray;
    let directLoadBufferIn;

    const loadPromise = nativePromiseWithExtractedComponents();

    let numBytesLoaded = 0;
    let chunks = [];

    const localOnProgress = (percent, percentStr, chunk, fileSize) => {
      const loadComplete = percent >= 100;
      console.log("percent", chunks.length);
      if (chunk) {
        chunks.push(chunk);
      }

      if (internalLoadType === InternalLoadType.DownloadBeforeProcessing) {
        if (loadComplete) {
          loadPromise.resolve(chunks);
        }
        return;
      }

      if (!directLoadBufferIn) {
        directLoadBufferIn = new ArrayBuffer(fileSize);
        if (internalLoadType === InternalLoadType.DirectToSplatBuffer) {
          // Can't have progressive load for Spz
        } 
      }

      if (chunk) {
        numBytesLoaded += chunk.byteLength;

      }

      if (loadComplete) {
        loadPromise.resolve(new Blob(chunks).arrayBuffer());
      }

      if (onProgress) onProgress(percent, percentStr, LoaderStatus.Downloading);
    };

    if (onProgress) onProgress(0, "0%", LoaderStatus.Downloading);
    return fetchWithProgress(fileName, localOnProgress, false, headers).then(
      () => {
        if (onProgress) onProgress(0, "0%", LoaderStatus.Processing);
        return loadPromise.promise.then((splatData) => {
            // console.log(internalLoadType, InternalLoadType, "done");
          if (onProgress) onProgress(100, "100%", LoaderStatus.Done);
          if (internalLoadType === InternalLoadType.DownloadBeforeProcessing) {
            return new Blob(chunks).arrayBuffer().then((splatData) => {
                return SpzLoader.loadFromFileData(splatData, minimumAlpha, compressionLevel, optimizeSplatData,
                                                    sectionSize, sceneCenter, blockSize, bucketSize);
            });
          } else if (
            internalLoadType === InternalLoadType.DirectToSplatBuffer
          ) {
            // Can't have progressive load for Spz
          } else {
            return delayedExecute(async () => {
              const splatArray =
                await SpzParser.parseStandardSpzToUncompressedSplatArray(
                  splatData
                );
              return finalize(
                splatArray,
                optimizeSplatData,
                minimumAlpha,
                compressionLevel,
                sectionSize,
                sceneCenter,
                blockSize,
                bucketSize
              );
            });
          }
        });
      }
    );
  }

  static loadFromFileData(
    splatFileData,
    minimumAlpha,
    compressionLevel,
    optimizeSplatData,
    sectionSize,
    sceneCenter,
    blockSize,
    bucketSize
  ) {
    return delayedExecute(async () => {
      const splatArray =
        await SpzParser.parseStandardSpzToUncompressedSplatArray(splatFileData);
      console.log(splatArray);
      return finalize(
        splatArray,
        optimizeSplatData,
        minimumAlpha,
        compressionLevel,
        sectionSize,
        sceneCenter,
        blockSize,
        bucketSize
      );
    });
  }
}
