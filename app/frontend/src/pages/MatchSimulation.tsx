import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Paper, Typography, Grid } from '@mui/material';
import * as THREE from 'three';
import { RootState } from '../store';
import { updatePlayerState } from '../store/slices/matchSlice';

const MatchSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const matchState = useSelector((state: RootState) => state.match);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1f2326);
    sceneRef.current = scene;

    // Set up camera
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 20, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x2b2e33,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    scene.add(ground);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 20, 0);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && canvasRef.current) {
        canvasRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Update player positions
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing player meshes
    sceneRef.current.children = sceneRef.current.children.filter(
      child => !(child instanceof THREE.Mesh && child.userData.isPlayer)
    );

    // Add player meshes
    Object.entries(matchState.players).forEach(([id, player]) => {
      const geometry = new THREE.ConeGeometry(0.5, 1.5, 8);
      const material = new THREE.MeshPhongMaterial({
        color: player.health > 0 ? 0x00ff00 : 0xff0000,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(player.position.x, player.position.y, player.position.z);
      mesh.rotation.y = player.rotation;
      mesh.userData.isPlayer = true;
      mesh.userData.playerId = id;
      sceneRef.current.add(mesh);
    });
  }, [matchState.players]);

  return (
    <Grid container spacing={2} sx={{ height: '100vh', pt: 2, px: 2 }}>
      <Grid item xs={12} md={9}>
        <Paper
          ref={canvasRef}
          sx={{
            width: '100%',
            height: 'calc(100vh - 100px)',
            overflow: 'hidden',
          }}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Match Information
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography>
              Score: {matchState.score.attackers} - {matchState.score.defenders}
            </Typography>
            <Typography>
              Round: {matchState.round.roundNumber}
            </Typography>
            <Typography>
              Time: {Math.ceil(matchState.round.timeRemaining)}s
            </Typography>
          </Box>
          <Typography variant="h6" gutterBottom>
            Players
          </Typography>
          {Object.entries(matchState.players).map(([id, player]) => (
            <Box key={id} sx={{ mb: 1 }}>
              <Typography>
                Player {id}: {player.health}HP
              </Typography>
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default MatchSimulation; 