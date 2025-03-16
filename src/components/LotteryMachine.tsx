import React, { useState, useRef, useEffect, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useSphere, useBox } from '@react-three/cannon';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Button } from '@mui/material';

const BALL_COUNT = 30;
const BALL_RADIUS = 0.3;
const CAGE_RADIUS = 3;

const Ball = ({ number, position, ballRef, color='blue', textColor='white', radius = BALL_RADIUS, cageRadius=CAGE_RADIUS }) => {
  const [ref, api] = useSphere(() => ({ mass: 1, position, args: [radius] }));
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
    
    if (distance > cageRadius - radius - 0.1) {
		// Ball is outside or at the edge of the cage, push it back in
		// const scale = (cageRadius - radius - 0.1) / distance;
		const scale = (cageRadius - radius) / distance;
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

const Cage = ({radius = CAGE_RADIUS, color = 'white'}) => {
  // Create an invisible boundary at the cage radius
  const [boundaryRef] = useBox(() => ({
    args: [radius * 2, radius * 2, radius * 2],
    position: [0, 0, 0],
    type: 'Static',
    isTrigger: true,
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
					wireframe
				/>
			</mesh>
		</>
  );
};

const LotteryMachine = ({ ballCount = BALL_COUNT, cageRadius = CAGE_RADIUS, ballRadius = BALL_RADIUS }) => {
	const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
	const balls = useRef(
		Array(ballCount)
			.fill(null)
			.map(() => React.createRef())
	);
	const renderRef = useRef(0);

	const shuffleBalls = () => {
		setSelectedNumber(null);
    console.log('Shuffling balls...', balls.current);

		// Apply random forces to all balls to simulate mixing
		balls.current.forEach((ball) => {
			if (ball && ball.api) {
				const force = [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10];
        console.log('Applying force to ball', force);
				ball.api.applyForce(force, [0, 0, 0]);
			}
		});

		setTimeout(() => {
			const winner = Math.floor(Math.random() * ballCount) + 1;
			setSelectedNumber(winner);
		}, 5000);
	};
	useEffect(() => {
		renderRef.current++;
	});

  useEffect(() => {
		setTimeout(() => {
      shuffleBalls();
    }, 15000);
  }, []);
	console.log('LotteryMachine', renderRef.current);

	return (
		<Box className="relative">
			<>
				<Canvas
					shadows
					camera={{ position: [0, 5, 10], fov: 50 }}
					gl={{ preserveDrawingBuffer: true }}
					className="absolute top-0 left-0"
				>
					<ambientLight intensity={0.5} />
					<directionalLight
						position={[5, 5, 5]}
						intensity={1}
						castShadow
					/>
					<Physics gravity={[0, -9.81, 0]}>
						<Cage />
						{Array.from({ length: ballCount }).map((_, i) => {
							// Ensure initial positions are well within the cage
							const angle1 = Math.random() * Math.PI * 2;
							const angle2 = Math.random() * Math.PI;
							const radius = Math.random() * (cageRadius - ballRadius - 0.5);

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
									cageRadius={cageRadius}
									radius={ballRadius}
								/>
							);
						})}
					</Physics>
					<OrbitControls />
				</Canvas>
			</>
			<Button
				onClick={shuffleBalls}
				className="absolute top-8 left-8"
				variant="contained"
				color="primary"
			>
				Start
			</Button>
			{selectedNumber && <div className="absolute top-8 left-8">Winner: {selectedNumber}</div>}
		</Box>
	);
};

export default memo(LotteryMachine);
