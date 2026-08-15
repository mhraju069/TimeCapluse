import React, { useState, useEffect, useRef } from 'react';

// Beautiful Interactive Flying Butterflies Component
export const FloatingButterfly = () => {
    const [butterflies, setButterflies] = useState([]);
    const [particles, setParticles] = useState([]);

    // Configuration options
    const START_DELAY_MS = 1000;    // Initial delay before spawning starts
    const SPAWN_INTERVAL_MS = 1000; // Delay between each butterfly spawning
    const MAX_BUTTERFLIES = 1;      // Maximum number of butterflies to spawn
    const PARTICLE_OPACITY_MULTIPLIER = 0.5; // Lower values make sparkles more subtle
    const LOGO_X = 60;              // Approx logo center X
    const LOGO_Y = 40;              // Approx logo center Y

    // Speed options (increase or decrease these to control how fast they fly)
    const BASE_SPEED = 2.0;         // Default standard speed
    const MIN_WANDER_SPEED = 0.8;    // Slowest speed when wandering around
    const MAX_WANDER_SPEED = 3.0;    // Fastest speed when wandering around
    const MAX_PANIC_SPEED = 4.5;     // Max speed when fleeing from the cursor
    const MIN_ATTRACT_SPEED = 2.0;   // Slowest speed when curious and approaching the cursor

    // Track mouse coordinates
    const mouseRef = useRef({ x: -1000, y: -1000 });

    // Handle mouse movement and window resize
    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Spawning loop
    useEffect(() => {
        let spawnInterval;

        // Start spawning after initial delay
        const startTimeout = setTimeout(() => {
            spawnInterval = setInterval(() => {
                setButterflies(prev => {
                    if (prev.length >= MAX_BUTTERFLIES) {
                        clearInterval(spawnInterval);
                        return prev;
                    }

                    // Add a new butterfly at the logo position
                    return [
                        ...prev,
                        {
                            id: Math.random(),
                            x: LOGO_X,
                            y: LOGO_Y,
                            angle: Math.random() * Math.PI * 2,
                            targetAngle: Math.random() * Math.PI * 2,
                            speed: BASE_SPEED,
                            turnSpeed: 0.05,
                            noiseTime: Math.random() * 100,
                            wingPhase: Math.random() * Math.PI * 2,
                            opacity: 0, // Starts at 0 to fade in
                            scale: 0.18
                        }
                    ];
                });
            }, SPAWN_INTERVAL_MS);
        }, START_DELAY_MS);

        return () => {
            clearTimeout(startTimeout);
            if (spawnInterval) clearInterval(spawnInterval);
        };
    }, []);

    // Physics and Animation loop
    useEffect(() => {
        let animationFrameId;

        const updatePhysics = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            setButterflies(prevButterflies => {
                const updated = prevButterflies.map(b => {
                    // Fade in the butterfly (0 to 1 over 1s, ~60 frames, so +0.017 per frame)
                    let newOpacity = b.opacity;
                    if (newOpacity < 1) {
                        newOpacity = Math.min(1, newOpacity + 0.017);
                    }

                    // Physics math
                    const dx = b.x - mouseRef.current.x;
                    const dy = b.y - mouseRef.current.y;
                    const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

                    let isFleeing = false;
                    let targetAngle = b.targetAngle;
                    let speed = b.speed;
                    let turnSpeed = b.turnSpeed;
                    let noiseTime = b.noiseTime;

                    const FEAR_DISTANCE = 160;
                    const ATTRACT_DISTANCE = 400;

                    if (distanceToMouse < FEAR_DISTANCE) {
                        isFleeing = true;
                        targetAngle = Math.atan2(dy, dx);
                        speed = Math.min(MAX_PANIC_SPEED, speed + 0.4);
                        turnSpeed = 0.12;
                    } else if (distanceToMouse < ATTRACT_DISTANCE) {
                        const angleToMouse = Math.atan2(-dy, -dx);
                        targetAngle = angleToMouse;
                        speed = Math.max(MIN_ATTRACT_SPEED, speed - 0.1);
                        turnSpeed = 0.04;
                    } else {
                        turnSpeed = 0.05;
                        if (speed > BASE_SPEED) speed -= 0.1;

                        noiseTime += 0.02;
                        const noise = Math.sin(noiseTime) * 0.5 + Math.cos(noiseTime * 0.7) * 0.3;

                        if (Math.random() < 0.02) {
                            targetAngle = Math.random() * Math.PI * 2;
                            speed = MIN_WANDER_SPEED + Math.random() * (MAX_WANDER_SPEED - MIN_WANDER_SPEED);
                        }

                        targetAngle += noise * 0.1;
                    }

                    let angle = b.angle;
                    angle += (targetAngle - angle) * turnSpeed;

                    let x = b.x + Math.cos(angle) * speed;
                    let y = b.y + Math.sin(angle) * speed;

                    // Edge avoidance
                    const margin = 120;
                    if (x < margin) targetAngle = 0;
                    if (x > width - margin) targetAngle = Math.PI;
                    if (y < margin) targetAngle = Math.PI / 2;
                    if (y > height - margin) targetAngle = -Math.PI / 2;

                    const scale = 0.18 + Math.sin(noiseTime * 2) * 0.02 + (isFleeing ? 0.03 : 0);
                    const flapMultiplier = isFleeing ? 0.35 : 0.15;
                    const wingPhase = (b.wingPhase + speed * flapMultiplier) % (Math.PI * 2);

                    // Generate sparkles for this butterfly

                    if (Math.random() < (isFleeing ? 0.8 : 0.4) && newOpacity > 0.2) {
                        setParticles(p => [
                            ...p.slice(-80), // Cap max sparkles total
                            {
                                id: Math.random(),
                                x: x - Math.cos(angle) * 15 + (Math.random() - 0.5) * 10,
                                y: y - Math.sin(angle) * 15 + (Math.random() - 0.5) * 10,
                                size: (isFleeing ? 4 : 2.5) + Math.random() * 5,
                                opacity: newOpacity * PARTICLE_OPACITY_MULTIPLIER,
                                color: isFleeing
                                    ? (Math.random() > 0.4 ? '#ffda79' : '#ffffff')
                                    : (Math.random() > 0.3 ? '#e8c060' : '#ffffff')
                            }
                        ]);
                    }

                    return {
                        ...b,
                        x,
                        y,
                        angle,
                        targetAngle,
                        speed,
                        turnSpeed,
                        noiseTime,
                        wingPhase,
                        opacity: newOpacity,
                        scale
                    };
                });

                return updated;
            });

            // Age and move sparkles
            setParticles(prev =>
                prev
                    .map(p => ({
                        ...p,
                        y: p.y + 0.3,
                        opacity: p.opacity - 0.015,
                        size: Math.max(0, p.size - 0.05)
                     }))
                    .filter(p => p.opacity > 0)
            );

            animationFrameId = requestAnimationFrame(updatePhysics);
        };

        animationFrameId = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
            {/* Render Sparkles */}
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

            {/* Render Butterflies */}
            {butterflies.map(b => {
                const wingFlapScaleX = Math.abs(Math.sin(b.wingPhase));
                return (
                    <div
                        key={b.id}
                        style={{
                            position: 'absolute',
                            left: b.x,
                            top: b.y,
                            transform: `translate(-50%, -50%) rotate(${b.angle + Math.PI / 2}rad) scale(${b.scale})`,
                            transformOrigin: 'center center',
                            filter: `drop-shadow(0 4px 12px rgba(212, 160, 36, ${0.45 * b.opacity}))`,
                            opacity: b.opacity,
                            transition: 'opacity 1s ease-out'
                        }}
                    >
                        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                            <circle cx="100" cy="100" r="12" fill="#d4a024" opacity="0.3" filter="blur(8px)" />

                            {/* Left Wing */}
                            <g style={{ transform: `scaleX(${wingFlapScaleX})`, transformOrigin: '100px 100px' }}>
                                <path fill="url(#goldGrad)" d="M100 100 C70 60, 20 50, 30 90 C35 110, 70 120, 100 105" opacity="0.95" />
                                <path fill="#ffffff" fillOpacity="0.4" d="M95 95 C75 75, 45 70, 50 90 C53 100, 75 105, 95 100" />
                                <path fill="url(#goldGradDark)" d="M100 105 C75 115, 45 130, 55 150 C65 160, 85 140, 100 115" opacity="0.9" />
                            </g>

                            {/* Right Wing */}
                            <g style={{ transform: `scaleX(${-wingFlapScaleX})`, transformOrigin: '100px 100px' }}>
                                <path fill="url(#goldGrad)" d="M100 100 C70 60, 20 50, 30 90 C35 110, 70 120, 100 105" opacity="0.95" />
                                <path fill="#ffffff" fillOpacity="0.4" d="M95 95 C75 75, 45 70, 50 90 C53 100, 75 105, 95 100" />
                                <path fill="url(#goldGradDark)" d="M100 105 C75 115, 45 130, 55 150 C65 160, 85 140, 100 115" opacity="0.9" />
                            </g>

                            {/* Body */}
                            <g>
                                <path d="M96 90 Q92 70 85 65" stroke="#e8c060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                <path d="M104 90 Q108 70 115 65" stroke="#e8c060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                <circle cx="100" cy="85" r="4.5" fill="#2d2208" stroke="#e8c060" strokeWidth="1" />
                                <ellipse cx="100" cy="98" rx="3.5" ry="12" fill="#2d2208" stroke="#e8c060" strokeWidth="1" />
                                <ellipse cx="100" cy="113" rx="2" ry="7" fill="#2d2208" stroke="#e8c060" strokeWidth="0.8" />
                            </g>

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
                );
            })}
        </div>
    );
};

export default FloatingButterfly;
