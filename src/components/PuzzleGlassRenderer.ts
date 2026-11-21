import {
  BackSide,
  BoxGeometry,
  Color,
  ExtrudeGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RectAreaLight,
  Scene,
  ShaderChunk,
  Shape,
  WebGLRenderer,
} from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import type { TemperatureMode } from '@/types/ondo';

const GLASS_TINT: Record<TemperatureMode, string> = {
  fun: '#ffd1c5',
  balanced: '#b3ebe8',
  serious: '#c8bbfa',
};
const GLASS_EDGE: Record<TemperatureMode, string> = {
  fun: '#e2a7bd',
  balanced: '#82c9d9',
  serious: '#9e91e3',
};
const REVEAL_DURATION = 560;
const REVEAL_INTERVAL = 180;
const START_ANGLE = -Math.PI * 0.52;

type GlassPiece = {
  canvas: HTMLCanvasElement;
  artwork: HTMLElement;
  fallback: SVGSVGElement;
  path: string;
  mode: TemperatureMode;
  assembled: boolean;
  animate: boolean;
  onRender: () => void;
};

type RenderJob = GlassPiece & {
  context: CanvasRenderingContext2D;
  start: number;
  fadeStarted: boolean;
};

function extrudePuzzle(path: string, assembled: boolean) {
  const tokens = path.split(' ');
  const shape = new Shape();
  let index = 0;
  const x = () => Number(tokens[index++]) / 100 - 0.5;
  const y = () => 0.5 - Number(tokens[index++]) / 100;

  while (index < tokens.length) {
    const command = tokens[index++];
    if (command === 'M') shape.moveTo(x(), y());
    if (command === 'L') shape.lineTo(x(), y());
    if (command === 'C') shape.bezierCurveTo(x(), y(), x(), y(), x(), y());
    if (command === 'Z') shape.closePath();
  }

  const outline = shape.getPoints(16);
  if (outline[0].equals(outline.at(-1)!)) outline.pop();
  const rounded = new Shape();
  outline.forEach((corner, index) => {
    const previous = outline[(index + outline.length - 1) % outline.length];
    const next = outline[(index + 1) % outline.length];
    const inwards = previous.clone().sub(corner);
    const outwards = next.clone().sub(corner);
    const isCorner = inwards.angleTo(outwards) < Math.PI * 0.86;
    const radius = isCorner ? Math.min(assembled ? 0.029 : 0.058, inwards.length() * 0.43, outwards.length() * 0.43) : 0;
    const start = corner.clone().add(inwards.setLength(radius));
    const end = corner.clone().add(outwards.setLength(radius));
    if (index === 0) rounded.moveTo(start.x, start.y);
    else rounded.lineTo(start.x, start.y);
    if (radius) rounded.quadraticCurveTo(corner.x, corner.y, end.x, end.y);
  });
  rounded.closePath();

  const depth = assembled ? 0.16 : 0.24;
  return new ExtrudeGeometry(rounded, {
    depth,
    bevelSize: assembled ? 0.026 : 0.049,
    bevelThickness: assembled ? 0.03 : 0.058,
    bevelOffset: assembled ? -0.03 : -0.015,
    bevelSegments: 7,
    curveSegments: 6,
  }).translate(0, 0, -depth / 2);
}

function createGlass(mode: TemperatureMode, edge = false) {
  const glass = new MeshPhysicalMaterial({
    color: new Color(GLASS_TINT[mode]).lerp(new Color('#ffffff'), edge ? 0.76 : 0.92),
    roughness: edge ? 0.085 : 0.06,
    transmission: edge ? 0.91 : 0.98,
    thickness: edge ? 0.64 : 0.29,
    ior: 1.49,
    attenuationColor: edge ? GLASS_EDGE[mode] : GLASS_TINT[mode],
    attenuationDistance: edge ? 1.18 : 0.97,
    dispersion: 0.15,
    clearcoat: 0.48,
    clearcoatRoughness: 0.06,
  });
  glass.onBeforeCompile = (shader) => {
    const transmission = ShaderChunk.transmission_pars_fragment
      .replace('vec4 transmittedLight;', 'vec4 transmittedLight = vec4(0.0);')
      .replace(
        'return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );',
        `// Sample a soft studio light field at the ray's refracted exit point.
        vec2 uv = fragCoord - vec2(0.5);
        float lightAxis = dot(uv, vec2(0.79, -0.61));
        float window = 1.0 - smoothstep(-0.20, 0.10, lightAxis);
        float highlight = 1.0 - smoothstep(0.009, 0.073, abs(lightAxis + 0.08));
        float bounce = 1.0 - smoothstep(0.04, 0.19, abs(lightAxis - 0.25));
        vec3 throughGlass = mix(vec3(0.43, 0.54, 0.70), vec3(1.00, 1.09, 1.16), window);
        throughGlass += highlight * vec3(0.31, 0.36, 0.46);
        throughGlass += bounce * vec3(0.20, 0.25, 0.34);
        vec4 original = textureBicubic(transmissionSamplerMap, fragCoord, lod);
        return vec4(mix(original.rgb, throughGlass, 0.93), 0.65);`,
      );
    shader.fragmentShader = shader.fragmentShader.replace('#include <transmission_pars_fragment>', transmission);
  };
  return glass;
}

function createStudio() {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setClearColor(0xffffff, 0);
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 0.88;

  const room = new Scene();
  const enclosure = new Mesh(new BoxGeometry(12, 12, 12), new MeshBasicMaterial({
    color: '#505b73',
    side: BackSide,
  }));
  room.add(enclosure);

  const panels = [
    { x: -2.0, y: 2.0, z: 4, width: 2.4, height: 4.5, color: '#f5f6ff', brightness: 3.8 },
    { x: 2.3, y: -1.4, z: 3.4, width: 0.45, height: 3.5, color: '#e7f5ff', brightness: 5.1 },
    { x: 3.8, y: 1.3, z: 0.2, width: 0.65, height: 4, color: '#fffaf6', brightness: 2.7 },
    { x: 0, y: -3, z: -2, width: 3.2, height: 1.4, color: '#d7e0ff', brightness: 1.5 },
  ];
  for (const { x, y, z, width, height, color, brightness } of panels) {
    const panel = new Mesh(
      new PlaneGeometry(width, height),
      new MeshBasicMaterial({ color: new Color(color).multiplyScalar(brightness) }),
    );
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    room.add(panel);
  }
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.025);
  room.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
      (object.material as MeshBasicMaterial).dispose();
    }
  });
  pmrem.dispose();

  RectAreaLightUniformsLib.init();
  const scene = new Scene();
  const reflection = new RectAreaLight('#f8fbff', 3.4, 1.05, 0.18);
  reflection.position.set(-0.32, 0.72, 1.8);
  reflection.lookAt(-0.1, 0.2, 0);
  scene.add(reflection);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.15;
  const camera = new OrthographicCamera(-0.82, 0.82, 0.82, -0.82, 0.1, 20);
  camera.position.set(0, 0, 5);
  const productCamera = new PerspectiveCamera(26, 1, 0.1, 20);
  productCamera.position.set(0, 0, 3.6);
  const mesh = new Mesh();
  mesh.rotation.order = 'YXZ';
  scene.add(mesh);

  const geometries = new Map<string, ExtrudeGeometry>();
  const materials = new Map<TemperatureMode, MeshPhysicalMaterial[]>();

  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
  });

  return {
    draw(job: RenderJob, angle: number) {
      if (renderer.getContext().isContextLost()) return false;

      const key = `${job.assembled}:${job.path}`;
      let geometry = geometries.get(key);
      if (!geometry) {
        geometry = extrudePuzzle(job.path, job.assembled);
        geometries.set(key, geometry);
      }

      let material = materials.get(job.mode);
      if (!material) {
        material = [createGlass(job.mode), createGlass(job.mode, true)];
        materials.set(job.mode, material);
      }

      mesh.geometry = geometry;
      mesh.material = material;
      mesh.rotation.set(job.assembled ? 0 : -0.43, angle + (job.assembled ? 0 : 0.12), job.assembled ? 0 : -0.15);
      mesh.position.z = job.assembled ? 0 : 0.03;
      renderer.render(scene, job.assembled ? camera : productCamera);
      job.context.clearRect(0, 0, job.canvas.width, job.canvas.height);
      job.context.drawImage(renderer.domElement, 0, 0, job.canvas.width, job.canvas.height);
      return true;
    },
    resize(size: number) {
      if (renderer.domElement.width !== size) renderer.setSize(size, size, false);
    },
  };
}

let studio: ReturnType<typeof createStudio> | null | undefined;
const pending = new Set<RenderJob>();
const running = new Set<RenderJob>();
let frame = 0;

function queueFrame() {
  if (!frame) frame = requestAnimationFrame(renderFrame);
}

function renderFrame(now: number) {
  frame = 0;
  if (!studio) return;

  const newcomers = [...pending].sort((a, b) =>
    a.canvas.compareDocumentPosition(b.canvas) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
  pending.clear();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let revealIndex = 0;
  for (const job of newcomers) {
    if (job.animate && !reducedMotion) {
      job.start = now + REVEAL_INTERVAL * revealIndex++;
      job.artwork.style.opacity = '0';
      job.fallback.style.visibility = 'hidden';
    }
    running.add(job);
  }

  const due = [...running].filter((job) => job.start <= now);
  if (due.length) studio.resize(Math.max(...due.map((job) => job.canvas.width)));

  for (const job of due) {
    const progress = !job.animate || reducedMotion ? 1 : Math.min((now - job.start) / REVEAL_DURATION, 1);
    const turn = 1 - (1 - progress) ** 3;
    let rendered = false;
    try {
      rendered = studio.draw(job, START_ANGLE * (1 - turn));
    } catch {
      // Keep the static render if this device cannot draw the transmissive material.
    }
    if (!rendered) {
      job.fallback.style.visibility = 'visible';
      job.artwork.style.opacity = '0';
      running.delete(job);
      continue;
    }

    job.fallback.style.visibility = 'hidden';
    job.artwork.style.opacity = String(Math.min(progress / 0.32, 1));
    job.artwork.dataset.puzzleRenderer = 'webgl';
    job.artwork.style.setProperty('--puzzle-label-opacity', String(Math.max(0, (progress - 0.65) / 0.35)));
    if (!job.fadeStarted && progress > 0) {
      job.fadeStarted = true;
      job.onRender();
    }
    if (progress === 1) running.delete(job);
  }

  if (running.size || pending.size) queueFrame();
}

export function mountGlassPuzzle(piece: GlassPiece) {
  if (studio === undefined) {
    try {
      studio = createStudio();
    } catch {
      studio = null;
    }
  }

  const context = piece.canvas.getContext('2d');
  if (!studio || !context) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixels = Math.ceil(piece.canvas.getBoundingClientRect().width * ratio);
  if (!pixels) return;

  piece.canvas.width = pixels;
  piece.canvas.height = pixels;

  const job: RenderJob = { ...piece, context, start: Number.NEGATIVE_INFINITY, fadeStarted: false };
  pending.add(job);
  queueFrame();

  return () => {
    pending.delete(job);
    running.delete(job);
  };
}
