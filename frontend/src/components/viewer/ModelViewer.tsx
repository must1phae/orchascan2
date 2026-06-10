"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#84f054" wireframe />
    </mesh>
  );
}

interface ModelViewerProps {
  modelUrl: string;
}

export default function ModelViewer({ modelUrl }: ModelViewerProps) {
  return (
    <div className="viewer-container">
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 45, near: 0.1, far: 1000, position: [3, 2, 5] }}
        style={{ background: "#0a0f0d" }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Stage
            environment="city"
            intensity={0.5}
            adjustCamera={1.5}
          >
            <Model url={modelUrl} />
          </Stage>
        </Suspense>
        <OrbitControls
          makeDefault
          autoRotate
          autoRotateSpeed={1}
          enablePan
          enableZoom
          enableRotate
          minDistance={1}
          maxDistance={20}
        />
      </Canvas>

      {/* Controls hint overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "var(--space-md)",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "0.4rem 1rem",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(10px)",
          borderRadius: "var(--radius-full)",
          fontSize: "var(--fs-xs)",
          color: "var(--color-text-muted)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        🖱️ Clic + glisser pour tourner · Molette pour zoomer
      </div>
    </div>
  );
}
