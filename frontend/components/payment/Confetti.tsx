import { useState } from "react";
import { motion } from "framer-motion";

const colors = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
];

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
  duration: number;
  isRound: boolean;
}

export default function Confetti() {
  const [pieces] = useState<ConfettiPiece[]>(() => {
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        duration: 3 + Math.random() * 2,
        isRound: Math.random() > 0.5,
      });
    }
    return newPieces;
  });

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: `${piece.x}vw`,
            y: -20,
            rotate: 0,
            scale: piece.scale,
          }}
          animate={{
            y: "110vh",
            rotate: piece.rotation + 720,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "linear",
          }}
          className="absolute w-3 h-3"
          style={{
            backgroundColor: piece.color,
            borderRadius: piece.isRound ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}
