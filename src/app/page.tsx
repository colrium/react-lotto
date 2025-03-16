"use client";

import { Box, Typography, Container, Paper } from "@mui/material";
import dynamic from "next/dynamic";

// Use dynamic import to avoid SSR issues with Three.js
const LotteryMachine = dynamic(
  () => import("../components/LotteryMachine"),
  { ssr: false }
);

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ height: "100vh", py: 4 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: 4,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: "bold",
              background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
              backgroundClip: "text",
              textFillColor: "transparent",
              mb: 1,
            }}
          >
            3D Lottery Machine
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            A high-performance physics-based lottery simulation
          </Typography>
        </Box>

        <Paper
          elevation={6}
          sx={{
            flex: 1,
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ width: "100%", height: "100%" }}>
            <LotteryMachine />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
