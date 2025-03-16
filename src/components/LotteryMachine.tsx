import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useSphere } from '@react-three/cannon';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

const BALL_COUNT = 30;
const BALL_RADIUS = 0.3;
const CAGE_RADIUS = 3;

const Ball = ({ number, position }) => {
  const [ref] = useSphere(() => ({ mass: 1, position, args: [BALL_RADIUS] }));
const renderRef = useRef(0);
  useEffect(() => {
		renderRef.current++;
  });
  console.log('Ball', renderRef.current);
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
      <meshStandardMaterial color="orange" />
      <Text position={[0, 0, BALL_RADIUS]}>{number}</Text>
    </mesh>
  );
};

const Cage = () => {
  return (
    <mesh>
      <sphereGeometry args={[CAGE_RADIUS, 64, 64]} />
      <meshStandardMaterial color="white" opacity={0.2} transparent wireframe />
    </mesh>
  );
};

const LotteryMachine = () => {
  const [selectedNumber, setSelectedNumber] = useState(null);
  const balls = useRef([]);
  const renderRef = useRef(0)

  const shuffleBalls = () => {
    setSelectedNumber(null);
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
          {Array.from({ length: BALL_COUNT }).map((_, i) => (
            <Ball key={i} number={i + 1} position={[Math.random() * 2 - 1, Math.random() * 2, Math.random() * 2 - 1]} />
          ))}
        </Physics>
        <OrbitControls />
      </Canvas>
      <button onClick={shuffleBalls} style={{ position: 'absolute', top: 20, left: 20 }}>Start</button>
      {selectedNumber && <div style={{ position: 'absolute', top: 50, left: 20 }}>Winner: {selectedNumber}</div>}
    </>
  );
};

export default LotteryMachine;
