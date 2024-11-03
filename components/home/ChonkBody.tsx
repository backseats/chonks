import { MeshProps, useThree, useFrame } from "@react-three/fiber";
import { RefObject, useEffect, useRef, useState } from "react";
import { DoubleSide, Vector3 } from "three";
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { addBox, parseZColorMap, convertToByteArray } from '../../utils/voxelUtils';
import { fullBodyZMap, hoodieZMap, frogZMap, suitTopZMap, bluePaintsZMap, brownShoesZMap } from './chonkBodyData';

gsap.registerPlugin(ScrollTrigger);


// type BodyPart = 'feet' | 'legs' | 'butt' | 'body' | 'back' | 'arms' | 'neck' | 'head' | 'face' | 'ear';

export interface ChonkBodyProps extends MeshProps {
    name?: string;
    chonkBodyVisible?: boolean;
    // onClickAtPosition?: (positions: Vector3) => any;
}

function ChonkBody({ chonkBodyVisible = true }: ChonkBodyProps) {
    const groupRef = useRef<THREE.Group>(null);
    const fullBodyRef = useRef<THREE.Group>(null);
    const hoodieRef = useRef<THREE.Group>(null);
    const frogRef = useRef<THREE.Group>(null);
    const suitTopRef = useRef<THREE.Group>(null);
    const bluePaintsRef = useRef<THREE.Group>(null);
    const brownShoesRef = useRef<THREE.Group>(null);
    const [pantsOn, setPantsOn] = useState<boolean>(false);
    const chonkScale = 20;
    const offset = 0.01; //sometimes 0.005 is fine, but others not, weird;


    useEffect(() => {
        if(pantsOn)
        {
            if (groupRef.current) {
                gsap.to(groupRef.current.rotation, {
                    // y: pantsOn ?  groupRef.current ? groupRef.current.rotation.y : 0 :  groupRef.current ? groupRef.current.rotation.y : 0,
                    y: groupRef.current ? groupRef.current.rotation.y : 0,
                    duration: 0.1,
                    ease: "none",
                    modifiers: {
                        y: (y) => pantsOn ? 
                            // `${Math.PI / 6 - Math.sin(gsap.ticker.time) / 12}` : 
                            `${(groupRef.current ? groupRef.current.rotation.y : 0) - Math.sin(gsap.ticker.time) / 800}` : 
                            groupRef.current ? groupRef.current.rotation.y : 0
                    },
                    repeat: pantsOn ? -1 : 0,
                });
            }

            return () => {
                if (groupRef.current) {
                    gsap.killTweensOf(groupRef.current.rotation);
                }
            };
        }
    }, [pantsOn]);

    // ... rest of the code ...

    useEffect(() => {

        if (fullBodyRef.current) {
            parseZColorMap(fullBodyZMap, fullBodyRef, addBox);

            // parseZColorMap(fullBodyZMap + frogZMap + suitTopZMap + bluePaintsZMap + brownShoesZMap, fullBodyRef, addBox);
        }

        // if (hoodieRef.current) {
        //     parseZColorMap(hoodieZMap, hoodieRef, addBox);
        // }

        if (frogRef.current) {
            parseZColorMap(frogZMap, frogRef, addBox);
        }

        if (suitTopRef.current) {
            parseZColorMap(suitTopZMap, suitTopRef, addBox);
        }

        if (bluePaintsRef.current) {
            parseZColorMap(bluePaintsZMap, bluePaintsRef, addBox);
        }

        if (brownShoesRef.current) {
            parseZColorMap(brownShoesZMap, brownShoesRef, addBox);
        }

        if (groupRef.current && frogRef.current && suitTopRef.current && bluePaintsRef.current && brownShoesRef.current) {
            
            const tlRotateAndMoveBody = gsap.timeline({
                scrollTrigger: {
                    trigger: ".chonkRotate",
                    start: "top top",
                    end: 'center top',
                    scrub: 1,
                    onLeaveBack: () => {
                        console.log("onLeaveBack tlRotateAndMoveBody, reset rotation");
                        if(groupRef.current) groupRef.current.rotation.y = Math.PI / 6;
                    }
                }
            });

            tlRotateAndMoveBody.to(groupRef.current.rotation, {
                y: Math.PI /6,
            }, 0)
            .to(groupRef.current.position, {
                x: -200,
            }, 0);

            const tlMoveFrog = gsap.timeline({
                scrollTrigger: {
                    trigger: ".chonkRotate",
                    start: "top top",
                    // end: 'center top',
                    end: 'center 0%', //0% is the same as top
                    scrub: 1,
                }
            });

            tlMoveFrog.to(frogRef.current.position, {
                y: offset,
            }, 0);

            const tlMoveSuitTop = gsap.timeline({
                scrollTrigger: {
                    trigger: ".chonkRotate",
                    // start: "top top",
                    start: 'center 0%-=300px', //0% is the same as top
                    end: 'center 0%-=300px', //0% is the same as top
                    scrub: 1,
                }
            });

            tlMoveSuitTop.to(suitTopRef.current.position, {
                x: -offset,
            }, 0);

            const tlMoveBluePaints = gsap.timeline({
                scrollTrigger: {
                    trigger: ".chonkRotate",
                    // start: "top top",
                    start: 'center 0%-=500px',
                    end: 'center 0%-=500px', //0% is the same as top
                    scrub: 1,
                }
            });

            tlMoveBluePaints.to(bluePaintsRef.current.position, {
                y: offset,
                delay: 0,
            }, 0);

            const tlMoveBrownShoes = gsap.timeline({
                scrollTrigger: {
                    trigger: ".chonkRotate",
                    // start: "top top",
                    start: 'center 0%-=700px',
                    end: 'center 0%-=700px', //0% is the same as top
                    scrub: 1,
                    onLeave: () => { 
                        console.log("onLeave, pantsOn is set to true");
                        setPantsOn(true);
                    },
                    onEnterBack: () => {
                        console.log("onEnterBack, pantsOn is set to false");
                        setPantsOn(false);
                    }
                }
            }); 

            tlMoveBrownShoes.to(brownShoesRef.current.position, {
                y: offset,
                delay: 0,
            }, 0);


            




            // // works...
            // tl.to([bodyPartRefs.feet.current, bodyPartRefs.legs.current, bodyPartRefs.butt.current, bodyPartRefs.body.current, bodyPartRefs.back.current, bodyPartRefs.arms.current, bodyPartRefs.neck.current], {
            //     visible: true,
            //     scrollTrigger: {
            //         trigger: ".chonkRotate",
            //         start: "top center",
            //         end: "bottom bottom",
            //         // toggleActions: "play none none reverse"
            //     }
            // }, 0);

            // if you need them to be different...
            // .to(groupRef.current.position, {
            //     x: groupRef.current.position.x - 150,
            //     scrollTrigger: {
            //         trigger: ".chonkRotate",
            //         start: "center bottom",
            //         scrub: 1,
            //     }
            // }, 0);

            // gsap.to(groupRef.current.rotation, {
            //     y: Math.PI / 6,
            //     scrollTrigger: {
            //     trigger: ".chonkRotate",
            //     start: "top bottom", // when the top of the trigger is at the center of the screen
            //     // end: '+=500', // end after scrolling 500px beyond the start
            //     // end: "center center", // end when the bottom of the body is at the bottom of the screen
            //     scrub: 1,
            //     },
            // });

            // gsap.to(groupRef.current.position, {
            //     x: groupRef.current.position.x - 150,
            //     scrollTrigger: {
            //     trigger: ".chonkRotate",
            //     start: "center bottom", // when the top of the trigger is at the center of the screen
            //     // end: '+=1', // end after scrolling 500px beyond the start
            //     // end: "center center", // end when the bottom of the body is at the bottom of the screen
            //     scrub: 1,
            //     },
            // });
        }

        return () => {
            // Clean up logic here
        };
    }, []);

    
    // useFrame((state) => {
    //     const t = state.clock.getElapsedTime()
    //     console.log('inUseFrame')
    //     if (groupRef.current && pantsOn) {
    //         // groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, pantsOn ? Math.PI / 6 - Math.sin(t / 1) / 12 : Math.PI / 6, 0.1)
    //         groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, Math.PI / 6 - Math.sin(t / 1) / 12 , 0.1)
    //     }
    // })

    

    return (
        <group ref={groupRef} scale={[chonkScale, chonkScale, chonkScale]} position={[0, 0, 0]} visible={chonkBodyVisible} >
            <group ref={fullBodyRef} />
            <group ref={frogRef} position={[-offset, 50, offset]} scale={[1, 1, 1]} />
            <group ref={suitTopRef} position={[-50, offset, offset]} scale={[1,1,1]} />
            <group ref={bluePaintsRef} position={[-offset, -50, offset]} scale={[1,1,1]} />
            <group ref={brownShoesRef} position={[-offset, -50, offset]} scale={[1,1,1]} />
            {/* <group ref={hoodieRef} /> */}
            {/* <group ref={frogRef} />
            <group ref={suitTopRef} />
            <group ref={bluePaintsRef} />
            <group ref={brownShoesRef} /> */}
        </group>
    );
}

export { ChonkBody };
