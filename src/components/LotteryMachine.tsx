import React, { useState, useRef, useEffect, memo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useSphere, useBox } from '@react-three/cannon';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Button, CircularProgress } from '@mui/material';

const BALL_COUNT = 30;
const BALL_RADIUS = 0.3;
const CAGE_RADIUS = 3;

const Ball = ({ number, position, ballRef, color='red', textColor='white', radius = BALL_RADIUS, cageRadius=CAGE_RADIUS, inCage = true, velocity = [0, 0, 0] }) => {
  
  const [ref, api] = useSphere(() => ({ mass: 1, position, args: [radius] }));

  const pos = useRef([0, 0, 0]);
  
  // Store current position in ref
  useEffect(() => {
    api.position.subscribe((p) => {
      pos.current = p;
      ballRef.current = { ...ballRef.current, position: p };
  });
  api.velocity.subscribe((v) => {
		ballRef.current = { ...ballRef.current, velocity: v };
  });
    
    // Store the api in the ref for external access
    if (ballRef) {
      ballRef.current = { dom: ref.current, api };
    }
  }, [api, ballRef]);

  // Keep ball inside cage
  useFrame(() => {
    const [x, y, z] = pos.current;
    const distance = Math.sqrt(x * x + y * y + z * z);
    
    if (distance > cageRadius - radius - 0.1) {
		// Ball is outside or at the edge of the cage, push it back in
		// const scale = (cageRadius - radius - 0.1) / distance;
		const scale = (cageRadius - radius) / distance;
		api.position.set(x * scale, y * scale, z * scale);

		// Add a small random velocity inward
		const vx = -x * 0.5 + (Math.random() - 0.5) * cageRadius;
		const vy = -y * 0.5 + (Math.random() - 0.5) * cageRadius;
		const vz = -z * 0.5 + (Math.random() - 0.5) * cageRadius;
		api.velocity.set(vx, vy, vz);
	}
  });
  
  return (
		<mesh ref={ref}>
			<sphereGeometry args={[radius, 32, 32]} />
			<meshStandardMaterial color={color} />
			<Text
				position={[0, 0, radius]}
				fontSize={radius * 0.7}
				color={textColor}
				anchorX="center"
				anchorY="middle"
			>
				{number}
			</Text>
		</mesh>
  );
};

const Cage = ({ radius = CAGE_RADIUS, color = 'white', wireframe = true }) => {
	// Create an invisible boundary at the cage radius
	const [boundaryRef] = useBox(() => ({
		args: [radius * 2, radius * 2, radius * 2],
		position: [0, 0, 0],
		type: 'Static',
		isTrigger: true
	}));

	return (
		<>
			<mesh
				ref={boundaryRef}
				visible={false}
			/>
			<mesh>
				<sphereGeometry args={[radius, 64, 64]} />
				<meshStandardMaterial
					color={color}
					opacity={0.2}
					transparent
					wireframe={wireframe}
				/>
			</mesh>
		</>
	);
};

const LotteryMachine = ({ ballCount = BALL_COUNT, cageRadius = CAGE_RADIUS, ballRadius = BALL_RADIUS }: { ballCount?: number; cageRadius?: number; ballRadius?: number; }) => {
	const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
	const [shuffling, setShuffling] = useState(false);
	const ballsRef = useRef(Array(ballCount).fill(null).map(() => React.createRef<{ api: { applyForce: (force: [number, number, number], point: [number, number, number]) => void; position: [number, number, number]; } }>()));


	const shuffleBalls = (duration = 10000) => {
		setSelectedNumber(null);
		setShuffling(true);
		console.log('Shuffling balls...', ballsRef.current);

		const startTime = Date.now();
		
		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const speedFactor = Math.sin(progress * Math.PI);
			
			ballsRef.current.forEach((ball) => {
				if (ball.current?.api) {
					const force = [
						(Math.random() - ballRadius) * 100 * speedFactor,
						(Math.random() - ballRadius) * 100 * speedFactor,
						(Math.random() - ballRadius) * 100 * speedFactor
					];
					ball.current.api.applyForce(force, ball.current.position);
				} else {
					console.warn('Ball reference or API not found for:', ball);
				}
			});
			
			if (progress < 1) {
        setTimeout(() => {
				requestAnimationFrame(animate);
        }, 100);
			} else {
				setShuffling(false);
				const winner = Math.floor(Math.random() * ballCount) + 1;
				setSelectedNumber(winner);
			}
		};
		
		requestAnimationFrame(animate);
	};

  

	

	const canvasRef = useRef<HTMLCanvasElement>(null);

	const handleContextLost = (event: WebGLContextEvent) => {
		event.preventDefault();
		console.warn('WebGL context lost.');
	};

	const handleContextRestored = () => {
		console.log('WebGL context restored.');
	};

  


	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		canvas.addEventListener('webglcontextlost', handleContextLost);
		canvas.addEventListener('webglcontextrestored', handleContextRestored);
		return () => {
			canvas.removeEventListener('webglcontextlost', handleContextLost);
			canvas.removeEventListener('webglcontextrestored', handleContextRestored);
		};
	}, []);

	return (
		<Box className="relative w-full h-full">
			<Suspense
				fallback={
					<CircularProgress
						size={24}
						className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
					/>
				}
			>
				<Canvas
					shadows
					camera={{ position: [0, 5, 10], fov: 50 }}
					ref={canvasRef}
				>
					<ambientLight intensity={0.5} />
					<directionalLight position={[5, 5, 5]} intensity={1} castShadow />
					<Physics gravity={[0, -9.81, 0]}>
						<Cage />
						{Array.from({ length: ballCount }).map((_, i) => {
							const angle1 = Math.random() * Math.PI * 2;
							const angle2 = Math.random() * Math.PI;
							const radius = Math.random() * (cageRadius - ballRadius - 0.5);
							const x = radius * Math.sin(angle2) * Math.cos(angle1);
							const y = radius * Math.sin(angle2) * Math.sin(angle1);
							const z = radius * Math.cos(angle2);
							return (
								<Ball
									key={i}
									number={i + 1}
									position={[x, y, z]}
									ballRef={ballsRef.current[i]}
									cageRadius={cageRadius}
									radius={ballRadius}
								/>
							);
						})}
					</Physics>
					<OrbitControls />
				</Canvas>
			</Suspense>
			<Box className="absolute top-0 left-0 z-50 flex w-full gap-8 p-4">
				<Button
					onClick={() => shuffleBalls(10000)}
					variant="contained"
					color="primary"
				>
					Start
				</Button>
				{selectedNumber && <div>Winner: {selectedNumber}</div>}
			</Box>
		</Box>
	);
};

export default memo(LotteryMachine);
