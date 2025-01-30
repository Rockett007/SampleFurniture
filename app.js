console.log("its working");

const vertexShader = `
attribute vec2 position;
varying vec2 vUv;

void main() {
    vUv = position * 0.5 + 0.5;
    vUv.y = 1.0 - vUv.y;
    gl_Position = vec4(position, 0, 1);
    // gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Fragment shader
const fragmentShader = `
precision highp float;
uniform sampler2D uImage;
// uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;

precision highp int;
uniform sampler2D tWater;
uniform sampler2D tFlow;
uniform vec4 res;

void main() {
    vec2 uv = vUv;
    
    // Calculate distance from mouse position
    float dist = distance(uv, uMouse);
    
    // Softer distortion effect
    float wave = sin(dist * 10.0) * 0.01;
    float distortionStrength = smoothstep(0.1, 0.5, dist);
    vec2 distortedUv = uv + vec2(wave) * distortionStrength;
    
    gl_FragColor = texture2D(uImage, distortedUv);
}
`;

class LiquidDistortion {
  constructor(el) {
    this.el = el;
    this.canvas = el.querySelector('canvas');
    this.img = el.querySelector('img');
    this.mouse = { x: 0.5, y: 0.5 };
    this.prevMouse = { x: 0.5, y: 0.5 };
    // this.mouse = { x: 0.9, y: 0.9 };
    // this.prevMouse = { x: 0.9, y: 0.9 };
    this.isHovering = false;
    
    // Ensure WebGL context is created first
    this.gl = this.canvas.getContext('webgl');
    
    // Only proceed if WebGL is supported
    if (!this.gl) {
        console.error('WebGL not supported');
        return;
    }
    
    this.setupWebGL();
    this.loadImage();
    this.addEventListeners();
    this.render();
    // this.isHovering = false;
}

setupWebGL() {
//   try {
   
//     if (!this.gl) {
//         console.error('WebGL not supported');
//         return;
//     }
// } catch (error) {
//     console.error('WebGL initialization error:', error);
// }
// function checkShaderCompilation(gl, shader) {
//   if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//       console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
//   }
// }

    // this.gl = this.canvas.getContext('webgl');
    const gl = this.gl;

    // Create shaders
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertexShader);
    gl.compileShader(vertShader);
    // checkShaderCompilation(gl, vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragmentShader);
    gl.compileShader(fragShader);
    // checkShaderCompilation(gl, fragShader);

    // Create program
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertShader);
    gl.attachShader(this.program, fragShader);
    gl.linkProgram(this.program);

    // Create buffer
    // const vertices = new Float32Array([-1, -1, 3, -1, -1, 3, 3, 3]);
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Set attributes and uniforms
    const position = gl.getAttribLocation(this.program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    this.uImage = gl.getUniformLocation(this.program, 'uImage');
    this.uMouse = gl.getUniformLocation(this.program, 'uMouse');
    // this.uTime = gl.getUniformLocation(this.program, 'uTime');
    // Error checking
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) {
        console.error('WebGL not supported');
        return;
    }
}

loadImage() {

  this.texture = this.gl.createTexture();
  const gl = this.gl;
  
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
      new Uint8Array([0, 0, 0, 255]));

  if (this.img.complete) {
      this.createTexture();
  } else {
      this.img.onload = () => this.createTexture();
  }
}

createTexture() {
  const gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
} 

addEventListeners() {
//   this.el.addEventListener('mouseenter', () => {
//       this.isHovering = true;
//   });

    this.el.addEventListener('mousemove', (e) => {
        const rect = this.el.getBoundingClientRect();
        this.mouse.x = (e.clientX - rect.left) / rect.width;
        this.mouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
        this.isHovering = true;
    });

    this.el.addEventListener('mouseleave', () => {
        this.isHovering = false;
        // this.mouse.x = 0.5;
        // this.mouse.y = 0.5;
    });

    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
}

resize() {
    this.canvas.width = this.el.offsetWidth;
    this.canvas.height = this.el.offsetHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
}

render() {
  if (!this.texture) {
    console.warn('Texture not yet loaded');
    requestAnimationFrame(this.render.bind(this));
    return;
}
  const gl = this.gl;
  
  // Smooth mouse movement
  this.prevMouse.x += (this.mouse.x - this.prevMouse.x) * 0.1;
  this.prevMouse.y += (this.mouse.y - this.prevMouse.y) * 0.1;

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(this.program);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.uniform1i(this.uImage, 0);

  if (this.isHovering) {
    //   gl.uniform1f(this.uTime, performance.now() / 1000);
      gl.uniform2f(this.uMouse, this.prevMouse.x, this.prevMouse.y);
  } else {
      // When not hovering, reset time and mouse position
    //   gl.uniform1f(this.uTime, 0);
      gl.uniform2f(this.uMouse, 0.5, 0.5);
  }

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  requestAnimationFrame(this.render.bind(this));
}
}
// Initialize effect for all images
document.querySelectorAll('.flex_img').forEach(el => {
new LiquidDistortion(el);
});

















// import * as THREE from '../three';
// console.log(THREE.REVISION);
// console.log("three");


// const canvas = document.getElementById('webglCanvas');
// const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
// renderer.setPixelRatio(window.devicePixelRatio);

// const scene = new THREE.Scene();
// const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
// camera.position.z = 1;

// // Shader code
// const vertexShader = `
//   varying vec2 vUv;

//   void main() {
//     vUv = uv;
//     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//   }
// `;

// const fragmentShader = `
//   varying vec2 vUv;

//   uniform sampler2D uTexture;
//   uniform float uTime;
//   uniform vec2 uResolution;

//   void main() {
//     vec2 uv = vUv;
//     float wave = sin(uv.y * 10.0 + uTime) * 0.02;
//     uv.x += wave;

//     vec4 color = texture2D(uTexture, uv);
//     gl_FragColor = color;
//   }
// `;

// const material = new THREE.ShaderMaterial({
//   uniforms: {
//     uTexture: { value: null },
//     uTime: { value: 0.0 },
//     uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
//   },
//   vertexShader,
//   fragmentShader,
//   transparent: true
// });

// const planeGeometry = new THREE.PlaneGeometry(2, 2);
// const mesh = new THREE.Mesh(planeGeometry, material);
// scene.add(mesh);

// const clock = new THREE.Clock();

// // Handle resizing
// function resize() {
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
// }

// window.addEventListener('resize', resize);
// resize();

// let currentImage = null;
// let isHovering = false;

// const textureLoader = new THREE.TextureLoader();

// function onHoverEnter(e) {
//   const imageSrc = e.target.closest('.img').dataset.image;
//   textureLoader.load(imageSrc, texture => {
//     material.uniforms.uTexture.value = texture;
//     currentImage = texture;
//     isHovering = true;
//   });
//   gsap.to(canvas.style, { opacity: 1, duration: 0.5 });
// }

// function onHoverLeave() {
//   isHovering = false;
//   gsap.to(canvas.style, { opacity: 0, duration: 0.5 });
// }

// document.querySelectorAll('.img').forEach(container => {
//   container.addEventListener('mouseenter', onHoverEnter);
//   container.addEventListener('mouseleave', onHoverLeave);
// });

// function animate() {
//   if (isHovering) {
//     material.uniforms.uTime.value += clock.getDelta();
//     renderer.render(scene, camera);
//   }
//   requestAnimationFrame(animate);
// }

// animate();


// import {
//     Renderer,
//     Vec2,
//     Vec4,
//     Geometry,
//     Texture,
//     Program,
//     Mesh,
//     Flowmap,
// } from "/src/index.js";

// console.log("Javescript is running!!!");



// async function loadShader(url) {
//     const response = await fetch(url);
//     return response.text();     
// }

// const vertexShader  = await loadShader("./shaders/vertexShader.glsl");
// const fragmentShader = await loadShader("./shaders/fragmentShader.glsl");



// document.querySelectorAll(".img").forEach((imgElement) => {
//     const renderer = new Renderer({ dpr: 2 });
//     const gl = renderer.gl;
//     const canvas = document.createElement("canvas");
//     // imgElement.appendChild(canvas);
//     imgElement.appendChild(gl.canvas);

//     const img = imgElement.querySelector("img");
//     const _size = [img.naturalWidth, img.naturalHeight];

//     let aspect = 1;
//     const mouse = new Vec2(-1);
//     const velocity = new Vec2();

//     function resize() {
//         const rect = imgElement.getBoundingClientRect();
//          gl.canvas.width = rect.width * 2.0;
//          gl.canvas.height = rect.height * 2.0;
//          gl.canvas.style.width = `${rect.width}px`;
//          gl.canvas.style.height = `${rect.height}px`;

//          const imageAspect = _size[0] / _size[1];
//          const canvasAspect = rect.width / rect.height;
//          let a1, a2;
//          if (canvasAspect > imageAspect) {
//             a1 = imageAspect / canvasAspect;
//             a2 = 1.0;   
//          } else {
//             a1 = 1.0
//             a2 = canvasAspect / imageAspect;
//          }

//          Mesh.program.uniform.res.value = new Vec4(rect.width, rect.height, a1, a2);

//          renderer.setSize(rect.width, rect.height);
//          aspect = rect.width / rect.height;
//     }
//     const flowmap = new Flowmap(gl, {
//         falloff: 0.3,
//         dissipation: 0.92,
//         alpha: 0.5,
//     });

//     const geometry = new Geometry(gl, {
//         position: {
//             size: 2,
//             data: new Float32Array([-1, -1, 3, -1, -1, 3]),
//         },
//         uv: {size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
//     });

//     const texture = new Texture(gl, {
//         minFiler: gl.LINEAR,
//         magFilter: gl.LINEAR,
//     });
//     texture.image = imgElement.querySelector("img");

//     const program = new Program(gl, {
//         vertex: vertexShader,
//         fragment: fragmentShader,
//         uniforms: {
//             uTime: { value: 0 },
//             tWater: { value: texture },
//             res:{ 
//                 value: new Vec4(window.innerWidth, window.innerHeight, 1, 1), 
//             },
//              tFlow: flowmap.uniform,
//         },
//     });

//     const mesh = new Mesh(gl, {geometry, program });

//     window.addEventListener("resize", resize, false);
//     resize();

//     const isTouchCapable = "ontouchstart" in window;
//     if (isTouchCapable) {
//         imgElement.addEventListener("touchstart", updateMouse, false);
//         imgElement.addEventListener("touchstart", updateMouse, {
//             passive: false,
//         });
//     } else {
//         imgElement.addEventListener("mousemove", updateMouse, false);
//     }

//     let lastTime
//     const lastMouse = new Vec2();

//     function updateMouse(e) {
//         e.preventDefault();

//         const rect = new imgElement.getBoundingClientRect();
//         let x, y;

//         if (e.changedTouches && e.changedTouches.length) {
//            x = e.changedTouches[0].pageX - rect.left; 
//         } else {
//             x = e.clientX - rect.left;
//             y = e.clientY - rect.top;
//         }

//         mouse.set(x / rect.width, 1.0 - y / rect.height);

//         if (!lastTime) {
//             lastTime = performance.now();
//             lastMouse.set(x, y);
//         }

//         const deltaX = x - lastMouse.x;
//         const deltaY = y - lastMouse.y;

//         lastMouse.set(x, y);

//         const time = performance.now();
//         const delta = Math.max( 10.4, time - lastTime);

//         lastTime = time;
//         velocity.x = deltaX / deltaY; 
//         velocity.y = deltaY / delta;
//         velocity.needsUpdate = true; 
//     }

//     function update(t) {
//         requestAnimationFrame(update);

//         if (!velocity.needsUpdate) {
//             mouse.set(-1);
//             velocity.set(0);
//         }
//         velocity.needsUpdate = false;

//         flowmap.mouse.copy(mouse);
//         flowmap.velocity.lerp(velocity, velocity.len ? 0.15 : 0.1);
//         flowmap.update();

//         program.uniforms.uTime.value = t * 0.01;
//         renderer.render({ scene: mesh });
//     }

//     requestAnimationFrame(update);
// });

