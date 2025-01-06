import nodeResolve from "@rollup/plugin-node-resolve";
import { base64 } from "./util/import-base-64.js";
import terser from '@rollup/plugin-terser';

const globals = {
    'three': 'THREE',
    '@spz-loader/core': '@spz-loader/core'
};

export default [
    {
        input: './src/index.js',
        treeshake: false,
        external: [
            'three',
            '@spz-loader/core'
        ],
        output: [
            {
                name: 'Gaussian Splats 3D',
                extend: true,
                format: 'umd',
                file: './build/gaussian-splats-3d.umd.cjs',
                globals: globals,
                sourcemap: true
            },
            {
                name: 'Gaussian Splats 3D',
                extend: true,
                format: 'umd',
                file: './build/gaussian-splats-3d.umd.min.cjs',
                globals: globals,
                sourcemap: true,
                plugins: [terser()]
            }
        ],
        plugins: [
            base64({ include: "**/*.wasm" })
        ]
    },
    {
        input: './src/index.js',
        treeshake: false,
        external: [
            'three',
            '@spz-loader/core'
        ],
        output: [
            {
                name: 'Gaussian Splats 3D',
                format: 'esm',
                file: './build/gaussian-splats-3d.module.js',
                sourcemap: true
            },
            {
                name: 'Gaussian Splats 3D',
                format: 'esm',
                file: './build/gaussian-splats-3d.module.min.js',
                sourcemap: true,
                plugins: [terser()]
            }
        ],
        plugins: [
            base64({ 
                include: "**/*.wasm",
                sourceMap: false
            }),
            nodeResolve()
        ]
    }
];