import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import { motion } from 'framer-motion';

const App: React.FC = () => {
  const [squares, setSquares] = useState<any[]>([]);
  const [score, setScore] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(100);
  const [shooting, setShooting] = useState<boolean>(false);
  const [shootingPosition, setShootingPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [scoreCallout, setScoreCallout] = useState<{
    visible: boolean;
    x: number;
    y: number;
    score: number;
    health: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    score: 0,
    health: 0,
  });

  useEffect(() => {
    // Generate squares at intervals
    const squareInterval = setInterval(() => {
      setSquares((prevSquares) => [...prevSquares, createSquare()]);
    }, 1000);

    // Move squares in a random pattern
    const moveInterval = setInterval(() => {
      setSquares((prevSquares) =>
        prevSquares.map((square) => ({
          ...square,
          x: square.x + (Math.random() - 0.75) * 5,
          y: square.y + (Math.random() - -1.5) * 5,
        }))
      );
    }, 100);

    return () => {
      clearInterval(squareInterval);
      clearInterval(moveInterval);
    };
  }, []);

  // decrease energy over time
  useEffect(() => {
    const energyInterval = setInterval(() => {
      setEnergy((prevEnergy) => Math.max(0, prevEnergy - 1));
    }, 1000);

    return () => {
      clearInterval(energyInterval);
    };
  }, []);

  const createSquare = () => {
    const size = Math.random() * 50 + 20; // Random size between 20 and 70
    return {
      id: Date.now(),
      size,
      health: Math.floor(size / 10),
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      destroyed: false, // Track if square is destroyed
    };
  };

  const handleShoot = (event: React.MouseEvent<HTMLDivElement>) => {
    if (energy > 0) {
      setEnergy((prevEnergy) => prevEnergy - 10);
      const stage = event.currentTarget; // The stage where the click event occurred
      const rect = stage.getBoundingClientRect(); // Get the position of the stage

      const x = event.clientX - rect.left; // Adjust for stage's left offset
      const y = event.clientY - rect.top; // Adjust for stage's top offset and circle radius

      console.log('ClientX:', event.clientX);
      console.log('ClientY:', event.clientY);
      console.log('Stage Rect:', rect);
      console.log('Calculated X:', x);
      console.log('Calculated Y:', y);

      setShootingPosition({ x, y });
      setShooting(true);

      // Check for collision with squares
      setSquares((prevSquares) =>
        prevSquares.map((square) => {
          if (isCollision(square, { x, y })) {
            if (square.destroyed) return square; // Skip if square is already destroyed
            square.health -= 1; // Reduce health
            if (square.health <= 0) {
              square.destroyed = true;
            }
            const pointsGained = square.size;
            setScore((prevScore) => prevScore + pointsGained);
            /// Calculate capped energy based on square size
            const baseEnergyReward = Math.max(
              0,
              4 - Math.floor(square.size / 20)
            ); // smaller squares give more energy
            const cappedEnergyReward = Math.min(baseEnergyReward, 4); // Ensure the max energy returned is 4
            setEnergy((prevEnergy) =>
              Math.max(0, prevEnergy + cappedEnergyReward)
            ); // Avoid negative energy
            // Show score callout
            setScoreCallout({
              visible: true,
              x: shootingPosition.x,
              y: shootingPosition.y,
              score: pointsGained,
              health: square.size / 2,
            });
            setTimeout(
              () => setScoreCallout({ ...scoreCallout, visible: false }),
              1000
            ); // Hide after 1 second
          }
          return square;
        })
      );

      // Reset shooting animation after a delay
      setTimeout(() => setShooting(false), 100); // Adjust duration as needed
    }
  };

  const isCollision = (square: any, { x, y }: { x: number; y: number }) => {
    return (
      x >= square.x &&
      x <= square.x + square.size &&
      y >= square.y &&
      y <= square.y + square.size
    );
  };

  return (
    <div
      onClick={handleShoot}
      className='bg-black text-white text-center overflow-hidden cursor-crosshair'
    >
      {/* <h1>Score: {score}</h1>
      <h2>Energy: {energy}</h2> */}
      {/* floating stats */}
      <div className='fixed top-0 right-0 p-4'>
        <h1>Score: {Math.round(score).toFixed()}</h1>
        <h2>Energy: {energy >= 0 ? Math.round(energy).toFixed() : 0}</h2>
      </div>
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          {squares.map((square) => (
            <>
              <Rect
                key={square.id}
                x={square.x}
                y={square.y}
                width={square.size}
                height={square.size}
                fill={square.destroyed ? 'red' : 'blue'}
                scaleX={square.destroyed ? 0 : 1} // Scale up if destroyed
                scaleY={square.destroyed ? 0 : 1}
                onAnimationEnd={() => {
                  if (square.destroyed) {
                    setSquares((prevSquares) =>
                      prevSquares.filter((s) => s.id !== square.id)
                    );
                  }
                }}
              />
              {/* sqare health bar */}
              <Rect
                x={square.x}
                y={square.y - 10}
                width={square.destroyed ? 0 : square.size}
                height={5}
                fill='green'
                scaleX={
                  square.destroyed ? 0 : square.health / (square.size / 2)
                } // Scale health bar based on health
              />
            </>
          ))}
          {shooting && (
            <Circle
              x={shootingPosition.x}
              y={shootingPosition.y}
              radius={10}
              fill='yellow'
              opacity={0.5}
              animate={{ scale: [1, 1.5, 1] }} // Scale animation for the shooting effect
              transition={{ duration: 0.5 }} // Duration for the animation
            />
          )}
        </Layer>
      </Stage>
      {/* game over dialog */}
      {energy <= 0 && (
        <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center'>
          <div className='bg-white p-4 rounded-lg'>
            <h1 className='text-black text-2xl font-bold'>Game Over!</h1>
            <h2 className='text-black text-xl'>
              Final Score: {Math.round(score).toFixed()}
            </h2>
            <button
              onClick={() => {
                setSquares([]);
                setScore(0);
                setEnergy(100);
              }}
              className='bg-blue-500 text-white px-4 py-2 mt-4 rounded-lg'
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      {scoreCallout.visible && (
        <>
          <motion.div
            style={{
              position: 'absolute',
              left: scoreCallout.x,
              top: scoreCallout.y,
              pointerEvents: 'none',
              color: 'yellow',
              fontSize: '24px',
            }}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -30 }} // Move upwards and fade out
            transition={{ duration: 0.5 }}
          >
            <div className='flex text-xs'>
              <span>+{Math.round(scoreCallout.score).toFixed()} points</span>
              <span className='ml-4'>
                -{Math.round(scoreCallout.health).toFixed()} energy
              </span>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default App;
