import React, { useState, useEffect, useRef } from 'react';

// Beautiful Interactive Flying Butterfly Component
export const FloatingButterfly = () => {
    const [butterfly, setButterfly] = useState({ x: 100, y: 100, angle: 0, scale: 0.18 });
    const [particles, setParticles] = useState([]);
    const [wingPhase, setWingPhase] = useState(0);

    // Track mouse coordinates
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        let animationFrameId;
        
        // Butterfly movement state
        let x = window.innerWidth * 0.3;
        let y = window.innerHeight * 0.4;
        let angle = Math.random() * Math.PI * 2;
        let targetAngle = angle;
        let speed = 2.5;
        let turnSpeed = 0.05;
        let noiseTime = Math.random() * 100;
        
        // Window dimensions
        let width = window.innerWidth;
        let height = window.innerHeight;

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
        };

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        const updatePhysics = () => {
            // Calculate distance to mouse
            const dx = x - mouseRef.current.x;
            const dy = y - mouseRef.current.y;
            const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

            let isFleeing = false;

            // Interaction settings
            const FEAR_DISTANCE = 160;   // Distance at which butterfly gets scared
            const ATTRACT_DISTANCE = 400; // Distance at which it feels attracted to cursor

            if (distanceToMouse < FEAR_DISTANCE) {
                // Flee from cursor! Calculate opposite angle
                isFleeing = true;
                targetAngle = Math.atan2(dy, dx); // Fly in the opposite vector
                speed = Math.min(6.5, speed + 0.4); // Panic speed up
                turnSpeed = 0.12; // Sharp quick turns
            } else if (distanceToMouse < ATTRACT_DISTANCE) {
                // Gentle curiosity — head towards cursor, but wander slightly
                const angleToMouse = Math.atan2(-dy, -dx);
                targetAngle = angleToMouse;
                speed = Math.max(2.0, speed - 0.1); // Slow down slightly as it approaches
                turnSpeed = 0.04;
            } else {
                // Default natural organic flight path (wandering)
                turnSpeed = 0.05;
                if (speed > 2.5) speed -= 0.1; // Settle back to default speed
                
                noiseTime += 0.02;
                const noise = Math.sin(noiseTime) * 0.5 + Math.cos(noiseTime * 0.7) * 0.3;
                
                // Randomly decide to make sharp turns
                if (Math.random() < 0.02) {
                    targetAngle = Math.random() * Math.PI * 2;
                    speed = 1.8 + Math.random() * 2.2;
                }
                
                targetAngle += noise * 0.1;
            }

            // Guide angle towards target smoothly
            angle += (targetAngle - angle) * turnSpeed;

            // Move forward
            x += Math.cos(angle) * speed;
            y += Math.sin(angle) * speed;

            // Keep within boundaries with smooth turning away from screen edges
            const margin = 120;
            if (x < margin) targetAngle = 0;
            if (x > width - margin) targetAngle = Math.PI;
            if (y < margin) targetAngle = Math.PI / 2;
            if (y > height - margin) targetAngle = -Math.PI / 2;

            // Update state
            setButterfly({
                x,
                y,
                angle: angle + Math.PI / 2, // Rotated adjustment for SVG direction
                scale: 0.18 + Math.sin(noiseTime * 2) * 0.02 + (isFleeing ? 0.03 : 0) // Expand slightly under panic
            });

            // Flap wings dynamically based on flight speed
            // Flap speed is much faster when fleeing!
            const flapMultiplier = isFleeing ? 0.35 : 0.15;
            setWingPhase(prev => (prev + speed * flapMultiplier) % (Math.PI * 2));

            // Periodically emit golden trail sparkles
            if (Math.random() < (isFleeing ? 0.8 : 0.4)) {
                setParticles(prev => [
                    ...prev.slice(-40), // Cap particle array length for performance
                    {
                        id: Math.random(),
                        x: x - Math.cos(angle) * 15 + (Math.random() - 0.5) * 10,
                        y: y - Math.sin(angle) * 15 + (Math.random() - 0.5) * 10,
                        size: (isFleeing ? 4 : 2.5) + Math.random() * 5,
                        opacity: 1,
                        color: isFleeing 
                            ? (Math.random() > 0.4 ? '#ffda79' : '#ffffff') 
                            : (Math.random() > 0.3 ? '#e8c060' : '#ffffff')
                    }
                ]);
            }

            // Fade/age existing particles
            setParticles(prev => 
                prev
                    .map(p => ({
                        ...p,
                        y: p.y + 0.3, // Slowly drift down
                        opacity: p.opacity - (isFleeing ? 0.025 : 0.015),
                        size: Math.max(0, p.size - 0.05)
                    }))
                    .filter(p => p.opacity > 0)
            );

            animationFrameId = requestAnimationFrame(updatePhysics);
        };

        animationFrameId = requestAnimationFrame(updatePhysics);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Wing flap scale animation (horizontal scaling of wing parts)
    const wingFlapScaleX = Math.abs(Math.sin(wingPhase));

    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
            {/* Render Gold Glow Sparkle Particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: p.x,
                        top: p.y,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: '50%',
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                        transform: 'translate(-50%, -50%)',
                        transition: 'opacity 0.05s linear'
                    }}
                />
            ))}

            {/* Flying Butterfly SVG Container */}
            <div
                style={{
                    position: 'absolute',
                    left: butterfly.x,
                    top: butterfly.y,
                    transform: `translate(-50%, -50%) rotate(${butterfly.angle}rad) scale(${butterfly.scale})`,
                    transformOrigin: 'center center',
                    filter: 'drop-shadow(0 4px 12px rgba(212, 160, 36, 0.45))'
                }}
            >
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                    {/* Glowing trail effect center */}
                    <circle cx="100" cy="100" r="12" fill="#d4a024" opacity="0.3" filter="blur(8px)" />
                    
                    {/* Left Wing Group */}
                    <g style={{ transform: `scaleX(${wingFlapScaleX})`, transformOrigin: '100px 100px' }}>
                        <path
                            fill="url(#goldGrad)"
                            d="M100 100 C70 60, 20 50, 30 90 C35 110, 70 120, 100 105"
                            opacity="0.95"
                        />
                        <path
                            fill="#ffffff"
                            fillOpacity="0.4"
                            d="M95 95 C75 75, 45 70, 50 90 C53 100, 75 105, 95 100"
                        />
                        {/* Lower Left Wing */}
                        <path
                            fill="url(#goldGradDark)"
                            d="M100 105 C75 115, 45 130, 55 150 C65 160, 85 140, 100 115"
                            opacity="0.9"
                        />
                    </g>

                    {/* Right Wing Group */}
                    <g style={{ transform: `scaleX(${-wingFlapScaleX})`, transformOrigin: '100px 100px' }}>
                        <path
                            fill="url(#goldGrad)"
                            d="M100 100 C70 60, 20 50, 30 90 C35 110, 70 120, 100 105"
                            opacity="0.95"
                        />
                        <path
                            fill="#ffffff"
                            fillOpacity="0.4"
                            d="M95 95 C75 75, 45 70, 50 90 C53 100, 75 105, 95 100"
                        />
                        {/* Lower Right Wing */}
                        <path
                            fill="url(#goldGradDark)"
                            d="M100 105 C75 115, 45 130, 55 150 C65 160, 85 140, 100 115"
                            opacity="0.9"
                        />
                    </g>

                    {/* Butterfly Body and Antennae */}
                    <g>
                        {/* Antennae */}
                        <path d="M96 90 Q92 70 85 65" stroke="#e8c060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        <path d="M104 90 Q108 70 115 65" stroke="#e8c060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        
                        {/* Body segments */}
                        <ellipse cx="100" cy="98" rx="3.5" ry="12" fill="#2d2208" stroke="#e8c060" strokeWidth="1" />
                        <circle cx="100" cy="85" r="4.5" fill="#2d2208" stroke="#e8c060" strokeWidth="1" />
                        <ellipse cx="100" cy="113" rx="2" ry="7" fill="#2d2208" stroke="#e8c060" strokeWidth="0.8" />
                    </g>

                    {/* Gradients */}
                    <defs>
                        <linearGradient id="goldGrad" x1="30" y1="50" x2="100" y2="120" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#ffea9f" />
                            <stop offset="50%" stopColor="#d4a024" />
                            <stop offset="100%" stopColor="#aa7c11" />
                        </linearGradient>
                        <linearGradient id="goldGradDark" x1="45" y1="110" x2="100" y2="150" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#d4a024" />
                            <stop offset="100%" stopColor="#573e04" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </div>
    );
};

export default FloatingButterfly;
