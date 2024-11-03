import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { Stage, Environment, OrthographicCamera } from '@react-three/drei';
import Cube from './Cube';
import { Mesh, Group, Box3, Vector3 } from 'three';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { ChonkBody } from './ChonkBody';

gsap.registerPlugin(ScrollTrigger);

interface Chonk3dProps {
  chonkOpacity: number;
  chonkPosY: number;
  chonkRotate: number;
}

const Chonk3d: React.FC<Chonk3dProps> = ({ chonkOpacity=1, chonkPosY=0, chonkRotate=0 }) => {

  const cameraRef = useRef<React.ElementRef<typeof OrthographicCamera>>(null);
  const groupRef = useRef<Group>(null);
  const chonkBodyRef = useRef<Mesh>(null);
  const [chonkBodyVisible, setChonkBodyVisible] = useState<boolean>(false);
  const [boxes, setBoxes] = useState<{ position: Vector3; finalPosition: Vector3; color: string; opacity?: number }[]>([]);
  const [wHeight, setwHeight] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isChonkAppearComplete, setIsChonkAppearComplete] = useState<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const firstLoad = true;

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let previousHeight = document.documentElement.clientHeight;

    const handleResize = () => {

      const currentHeight = document.documentElement.clientHeight;

      if (firstLoad || Math.abs(currentHeight - previousHeight) > 100 || !isMobile) {
        previousHeight = currentHeight;
        setwHeight(window.innerHeight);

        if (cameraRef.current) {
          console.log("handleResize ref found");
          const aspect = window.innerWidth / window.innerHeight;
          const frustumSize = 1000 / aspect;
          cameraRef.current.left = frustumSize * aspect / -2;
          cameraRef.current.right = frustumSize * aspect / 2;
          cameraRef.current.top = frustumSize / 2;
          cameraRef.current.bottom = frustumSize / -2;
          cameraRef.current.near = -100;
          cameraRef.current.far = 2000;

          cameraRef.current.position.set(0, 0, 100); // this doesn't really change the view as it's ortho camera but if it's out of the box it will disappear
          cameraRef.current.lookAt(0, 0, 0);

          cameraRef.current.updateProjectionMatrix();
        }
      };
    }

    if (isMobile) {
      window.addEventListener('orientationchange', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }
    
    handleResize(); // Initial size

    setTimeout(() => {
      setIsMounted(true);
      handleResize();
    }, 1000);

    setTimeout(() => {
      handleResize();
    }, 100);

    return () => {
      if (isMobile) {
        window.removeEventListener('orientationchange', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);
  

  // fires on load, randomly places the boxes
  useEffect(() => {
    console.log("useEffect called");

    // Generate initial and final positions for boxes
    const initialBoxes = [
      { position: [0, 0, 0], color: "#EFB15E", opacity: 0 },
      { position: [1, 0, 0], color: "#EFB15E" },
      { position: [2, 0, 0], color: "#EFB15E" },
      { position: [3, 0, 0], color: "#EFB15E" },
      { position: [4, 0, 0], color: "#EFB15E" },
      { position: [5, 0, 0], color: "#EFB15E" },
      { position: [6, 0, 0], color: "#EFB15E" },
      { position: [7, 0, 0], color: "#EFB15E" },
      { position: [-1, -1, 0], color: "#EFB15E" },
      { position: [0, -1, 0], color: "#EFB15E" },
      { position: [1, -1, 0], color: "#EFB15E" },
      { position: [2, -1, 0], color: "#EFB15E" },
      { position: [3, -1, 0], color: "#EFB15E" },
      { position: [4, -1, 0], color: "#EFB15E" },
      { position: [5, -1, 0], color: "#EFB15E" },
      { position: [6, -1, 0], color: "#EFB15E" },
      { position: [7, -1, 0], color: "#EFB15E" },
      { position: [8, -1, 0], color: "#EFB15E" },
      { position: [-1, -2, 0], color: "#EFB15E" },
      { position: [0, -2, 0], color: "#EFB15E" },
      { position: [1, -2, 0], color: "#EFB15E" },
      { position: [2, -2, 0], color: "#EFB15E" },
      { position: [3, -2, 0], color: "#EFB15E" },
      { position: [4, -2, 0], color: "#EFB15E" },
      { position: [5, -2, 0], color: "#EFB15E" },
      { position: [6, -2, 0], color: "#EFB15E" },
      { position: [7, -2, 0], color: "#EFB15E" },
      { position: [8, -2, 0], color: "#EFB15E" },
      { position: [-2, -3, 0], color: "#D69743" },
      { position: [-1, -3, 0], color: "#EFB15E" },
      { position: [0, -3, 0], color: "#EFB15E" },
      { position: [1, -3, 0], color: "#ffffff" },
      { position: [2, -3, 0], color: "#000000" },
      { position: [3, -3, 0], color: "#EFB15E" },
      { position: [4, -3, 0], color: "#EFB15E" },
      { position: [5, -3, 0], color: "#EFB15E" },
      { position: [6, -3, 0], color: "#ffffff" },
      { position: [7, -3, 0], color: "#000000" },
      { position: [8, -3, 0], color: "#EFB15E" },
      { position: [-2, -4, 0], color: "#D69743" },
      { position: [-1, -4, 0], color: "#EFB15E" },
      { position: [0, -4, 0], color: "#EFB15E" },
      { position: [1, -4, 0], color: "#ffffff" },
      { position: [2, -4, 0], color: "#000000" },
      { position: [3, -4, 0], color: "#D69743" },
      { position: [4, -4, 0], color: "#D69743" },
      { position: [5, -4, 0], color: "#D69743" },
      { position: [6, -4, 0], color: "#ffffff" },
      { position: [7, -4, 0], color: "#000000" },
      { position: [8, -4, 0], color: "#EFB15E" },
      { position: [-1, -5, 0], color: "#EFB15E" },
      { position: [0, -5, 0], color: "#EFB15E" },
      { position: [1, -5, 0], color: "#EFB15E" },
      { position: [2, -5, 0], color: "#EFB15E" },
      { position: [3, -5, 0], color: "#EFB15E" },
      { position: [4, -5, 0], color: "#EFB15E" },
      { position: [5, -5, 0], color: "#EFB15E" },
      { position: [6, -5, 0], color: "#EFB15E" },
      { position: [7, -5, 0], color: "#EFB15E" },
      { position: [8, -5, 0], color: "#EFB15E" },
      { position: [0, -6, 0], color: "#EFB15E" },
      { position: [1, -6, 0], color: "#EFB15E" },
      { position: [2, -6, 0], color: "#EFB15E" },
      { position: [3, -6, 0], color: "#EFB15E" },
      { position: [4, -6, 0], color: "#EFB15E" },
      { position: [5, -6, 0], color: "#EFB15E" },
      { position: [6, -6, 0], color: "#EFB15E" },
      { position: [7, -6, 0], color: "#EFB15E" }
    ].map(({ position, color, opacity }) => ({
      position: new Vector3(
        // ...position,
        Math.floor(Math.random() * 30) - 12,
        Math.floor(Math.random() * 15) - 12,
        // 0
        // Math.random() * 20 - 10
      ),
      finalPosition: new Vector3(...position),
      color: color,
      opacity: opacity
    }));

    setBoxes(initialBoxes);

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };

  }, []);

  // fires on change of isMounted, randomly places the boxes
  useEffect(() => {
    console.log("isMounted", isMounted);

    if (groupRef.current) {

      console.log("groupRef.current.rotation.x", groupRef.current.rotation.x);
      console.log("groupRef.current.rotation.y", groupRef.current.rotation.y);

      // move them to their final position
      setTimeout(() => {
        boxes.forEach((box, index) => {
          const child = groupRef.current?.children[index];
          // console.log("child", child);
          if (child) {
            gsap.to(child.position, {
              x: box.finalPosition.x,
              y: box.finalPosition.y,
              // z: box.finalPosition.z,
              scrollTrigger: {
                // trigger: "body",
                // start: "10% top",
                // end: "20% top",
                trigger: ".chonkAppear",
                start: "top top",
                end: "center center",
                scrub: 1,
                onLeave: () => { 
                  setIsChonkAppearComplete(true);
                  console.log("onLeave, isChonkAppearComplete is set to true");
                  // if (groupRef.current) groupRef.current.rotation.x = 0;
                  // if (groupRef.current) groupRef.current.rotation.y = 0;
                  
                },
                onEnterBack: () => { 
                  
                  setIsChonkAppearComplete(false);
                  console.log("onEnterBack, isChonkAppearComplete is set to false");
                  // if (groupRef.current) groupRef.current.rotation.x = 0;
                  // if (groupRef.current) groupRef.current.rotation.y = 0;
                },
              },
            });
          }
        });
      }, 100);


      // Hide the groupRef at the ourTeam dev section
      // gsap.to(groupRef.current, {
      //   visible: false,
      //   scrollTrigger: {
      //     trigger: ".ourTeam",
      //     start: "top center",
      //     end: '+=1'
      //   },
      // });

      ScrollTrigger.create({
        trigger: '#studio',
        start: 'top top',
        end: '+=1',
        scrub: 0,
        // endTrigger: 'top center',
        // end: 'bottom 50%+=100px',
        onToggle: (self) => console.log('toggled, isActive:', self.isActive),
        onUpdate: (self) => {
            console.log(
                'progress:',
                self.progress.toFixed(3),
                'direction:',
                self.direction,
                'velocity',
                self.getVelocity()
            );
        },
        onEnter: () => {
          console.log("onEnter");
          if (groupRef.current) groupRef.current.visible = false;
          setChonkBodyVisible(true);
          // stop it rotating
          if (animationFrameIdRef.current !== null) cancelAnimationFrame(animationFrameIdRef.current);
          setIsChonkAppearComplete(false);
        },
        onEnterBack: () => {
          console.log("onEnterBack ourTeam");
          // start it rotating
          setIsChonkAppearComplete(true);
        },
        onLeaveBack: () => {
          console.log("onLeaveBack");
          if (groupRef.current) groupRef.current.visible = true;
          setChonkBodyVisible(false);
        }
    });




      // rotate body at ...
      // gsap.to(groupRef.current.rotation, {
      //   y: Math.PI / 6,
      //   scrollTrigger: {
      //     trigger: "body",
      //     start: "center top", // when the top of the body is at the center of the screen
      //     // end: '+=500', // end after scrolling 500px beyond the start
      //     end: "bottom bottom", // end when the bottom of the body is at the bottom of the screen
      //     scrub: 1,
      //   },
      // });

      // gsap.to(groupRef.current.rotation, {
      //   y: Math.PI / 6,
      //   scrollTrigger: {
      //     trigger: ".chonkRotate",
      //     start: "top bottom", // when the top of the trigger is at the center of the screen
      //     // end: '+=500', // end after scrolling 500px beyond the start
      //     // end: "center center", // end when the bottom of the body is at the bottom of the screen
      //     scrub: 1,
      //   },
      // });

      // gsap.to(groupRef.current.position, {
      //   x: groupRef.current.position.x - 150,
      //   scrollTrigger: {
      //     trigger: ".chonkRotate",
      //     start: "center bottom", // when the top of the trigger is at the center of the screen
      //     // end: '+=1', // end after scrolling 500px beyond the start
      //     // end: "center center", // end when the bottom of the body is at the bottom of the screen
      //     scrub: 1,
      //   },
      // });


    }

  }, [isMounted]);

  useEffect(() => {
    console.log("isChonkAppearComplete", isChonkAppearComplete);
    if (isChonkAppearComplete) {
      let targetRotationX = 0;
      let targetRotationY = 0;

      const handleMouseMove = (event: MouseEvent) => {
        const { clientX, clientY } = event;
        targetRotationX = (clientY / window.innerHeight - 0.5) * 0.9; // Adjust the multiplier for sensitivity
        targetRotationY = (clientX / window.innerWidth - 0.5) * 0.9;
      };

      const animate = () => {
        console.log("animate");
        if (groupRef.current) {
          // Lerp function for smooth transition
          groupRef.current.rotation.x += (targetRotationX - groupRef.current.rotation.x) * 0.01;
          groupRef.current.rotation.y += (targetRotationY - groupRef.current.rotation.y) * 0.01;
        }
        animationFrameIdRef.current = requestAnimationFrame(animate);
      };

      window.addEventListener('mousemove', handleMouseMove);
      animate(); // Start the animation loop

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (animationFrameIdRef.current !== null) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
      };
    } else {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
        if (groupRef.current) {
          // Lerp function for smooth transition
          groupRef.current.rotation.x = 0;
          groupRef.current.rotation.y = 0;
        }

      }
    }
  }, [isChonkAppearComplete]);

  useEffect(() => {
    if (typeof window !== 'undefined') {  // Check if we're in browser environment
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Set CSS custom property for viewport height
        const setVH = () => {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH(); // Set initial value
        window.addEventListener('orientationchange', setVH);
        
        return () => window.removeEventListener('orientationchange', setVH);
      }
    }
  }, []);

  return (
    
      <Canvas style={{ 
        height: isMobile ? 'calc(var(--vh, 1vh) * 100)' : '100%',
        position: 'fixed',
        top: 0,
        left: 0,
      }}>
        <Environment preset="city" />
        <ambientLight color="#ffffff" intensity={1} />
        <directionalLight color="#ffffff" position={[0, 0, 10]} intensity={1} />
        <directionalLight color="#ffffff" position={[10, 0, 10]} intensity={1} />
        <OrthographicCamera
          ref={cameraRef}
          makeDefault
          zoom={1}
          top={200}
          bottom={-200}
          left={200}
          right={-200}
          near={-100}
          far={2000}
          position={[0, 0, 100]}
        />

        <ChonkBody ref={chonkBodyRef} name="body" chonkBodyVisible={chonkBodyVisible} />
        
        <group ref={groupRef} position={[-75, 70 , 0]}  scale={20} >
          {boxes.map((box, index) => (
            // places them in their initial position
            <Cube key={index} color={box.color} opacity={chonkOpacity} position={[box.position.x, box.position.y, box.position.z]}  />
          ))}
        </group>
      
      </Canvas>
  
  );
};

export default Chonk3d;
