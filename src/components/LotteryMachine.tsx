import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useSphere, useBox } from '@react-three/cannon';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

const BALL_COUNT = 30;
const BALL_RADIUS = 0.3;
const CAGE_RADIUS = 3;

const Ball = ({ number, position, ballRef }) => {
  const [ref, api] = useSphere(() => ({ mass: 1, position, args: [BALL_RADIUS] }));
  const renderRef = useRef(0);
  const pos = useRef([0, 0, 0]);
  
  // Store current position in ref
  useEffect(() => {
    api.position.subscribe((p) => (pos.current = p));
    
    // Store the api in the ref for external access
    if (ballRef) {
      ballRef.current = { api };
    }
  }, [api, ballRef]);

  // Keep ball inside cage
  useFrame(() => {
    const [x, y, z] = pos.current;
    const distance = Math.sqrt(x * x + y * y + z * z);
    
    if (distance > CAGE_RADIUS - BALL_RADIUS - 0.1) {
      // Ball is outside or at the edge of the cage, push it back in
      const scale = (CAGE_RADIUS - BALL_RADIUS - 0.2) / distance;
      api.position.set(x * scale, y * scale, z * scale);
      
      // Add a small random velocity inward
      const vx = -x * 0.5 + (Math.random() - 0.5) * 2;
      const vy = -y * 0.5 + (Math.random() - 0.5) * 2;
      const vz = -z * 0.5 + (Math.random() - 0.5) * 2;
      api.velocity.set(vx, vy, vz);
    }
  });
  
  useEffect(() => {
    renderRef.current++;
  });
  
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
      <meshStandardMaterial color="orange" />
      <Text position={[0, 0, BALL_RADIUS]}>{number}</Text>
    </mesh>
  );
};

const Cage = () => {
  // Create an invisible boundary at the cage radius
  const [boundaryRef] = useBox(() => ({
    args: [CAGE_RADIUS * 2, CAGE_RADIUS * 2, CAGE_RADIUS * 2],
    position: [0, 0, 0],
    type: 'static',
    isTrigger: true,
  }));
  
  return (
    <>
      <mesh ref={boundaryRef} visible={false} />
      <mesh>
        <sphereGeometry args={[CAGE_RADIUS, 64, 64]} />
        <meshStandardMaterial color="white" opacity={0.2} transparent wireframe />
      </mesh>
    </>
  );
};

const LotteryMachine = () => {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const balls = useRef(Array(BALL_COUNT).fill(null).map(() => React.createRef()));
  const renderRef = useRef(0)

  const shuffleBalls = () => {
    setSelectedNumber(null);
    
    // Apply random forces to all balls to simulate mixing
    balls.current.forEach(ball => {
      if (ball && ball.api) {
        const force = [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ];
        ball.api.applyForce(force, [0, 0, 0]);
      }
    });
    
    setTimeout(() => {
      const winner = Math.floor(Math.random() * BALL_COUNT) + 1;
      setSelectedNumber(winner);
    }, 5000);
  };
  useEffect(() => {
renderRef.current++;
  });
  console.log('LotteryMachine', renderRef.current);

  return (
    <>
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <Physics gravity={[0, -9.81, 0]}>
          <Cage />
          {Array.from({ length: BALL_COUNT }).map((_, i) => {
            // Ensure initial positions are well within the cage
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = Math.random() * Math.PI;
            const radius = Math.random() * (CAGE_RADIUS - BALL_RADIUS - 0.5);
            
            // Convert spherical coordinates to Cartesian
            const x = radius * Math.sin(angle2) * Math.cos(angle1);
            const y = radius * Math.sin(angle2) * Math.sin(angle1);
            const z = radius * Math.cos(angle2);
            
            return (
              <Ball 
                key={i} 
                number={i + 1} 
                position={[x, y, z]} 
                ballRef={balls.current[i]}
              />
            );
          })}
        </Physics>
        <OrbitControls />
      </Canvas>
      <button onClick={shuffleBalls} style={{ position: 'absolute', top: 20, left: 20 }}>Start</button>
      {selectedNumber && <div style={{ position: 'absolute', top: 50, left: 20 }}>Winner: {selectedNumber}</div>}
    </>
  );
};

export default LotteryMachine;
