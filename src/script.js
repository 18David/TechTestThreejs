import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import * as dat from 'dat.gui'

// Debug
const gui = new dat.GUI()

//const camera = new THREE.PerspectiveCamera();

//let renderer = new THREE.WebGLRenderer();

/**
 * Sizes
 */
/*const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}*/

/*window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})*/

document.getElementById('btnXR').onclick = async function activateXR() {
    console.log("activateXR");
    document.getElementById('start-panel').style.display="none";
    // Add a canvas element and initialize a WebGL context that is compatible with WebXR.
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const gl = canvas.getContext("webgl", {xrCompatible: true});
  
    const scene = new THREE.Scene();

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 15, 10);
    scene.add(directionalLight);

    // Set up the WebGLRenderer, which handles rendering to the session's base layer.
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        preserveDrawingBuffer: true,
        canvas: canvas,
        context: gl
    });
    renderer.autoClear = false;

    // The API directly updates the camera matrices.
    // Disable matrix auto updates so three.js doesn't attempt
    // to handle the matrices independently.
    const camera = new THREE.PerspectiveCamera();
    camera.matrixAutoUpdate = false;

    // Initialize a WebXR session using "immersive-ar".
    const session = await navigator.xr.requestSession("immersive-ar",{requiredFeatures: ['hit-test', "dom-overlay"],domOverlay: { root: document.body }});
    session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gl)
    });

    // A 'local' reference space has a native origin that is located
    // near the viewer's position at the time the session was created.
    const referenceSpace = await session.requestReferenceSpace('local');

    // Create another XRReferenceSpace that has the viewer as the origin.
    const viewerSpace = await session.requestReferenceSpace('viewer');
    // Perform hit testing using the viewer as origin.
    const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

    // "https://ar3a.app/models/bot.glb"
    const loader = new GLTFLoader();
    loader.setCrossOrigin('simple');

    
    const url = document.getElementById("url").value;
    console.log(url);
    let object;

    //loader.load('https://ar3a.app/models/helmet.glb', function(gltf) {
    //loader.load('/assets/helmet.glb', function(gltf) {
    loader.load(
        url, 
        function(gltf) {
            object = gltf.scene;
            object.visible = false;
            scene.add(object);
            let tmp = [];
            tmp.push(object);
            const controls = new DragControls( tmp, camera, renderer.domElement );

            // add event listener to highlight dragged objects

            controls.addEventListener( 'dragstart', function ( event ) {
                console.log("dragstart");
                console.log(event);
                event.object.material.emissive.set( 0xaaaaaa );

            });

            controls.addEventListener( 'dragend', function ( event ) {
                console.log("dragend");
                console.log(event);
                event.object.material.emissive.set( 0x000000 );

            } );
            var params = {
                'scale' : 1
            };
            gui.add(params, 'scale', 0, 5).onFinishChange(function(val){
                object.scale.set(val,val,val);
            });
        
        },
        undefined,
        function(event){
            const split = url.split('/');
            const local = '/assets/'+ split[split.length-1];
            loader.load(local, function(gltf) {
                object = gltf.scene;
                object.visible = false;
                scene.add(object);
                let tmp = [];
                tmp.push(object);
                const controls = new DragControls( tmp, camera, renderer.domElement );
    
                // add event listener to highlight dragged objects
    
                controls.addEventListener( 'dragstart', function ( event ) {
                    console.log("dragstart");
                    console.log(event);
                    event.object.material.emissive.set( 0xaaaaaa );
    
                });
    
                controls.addEventListener( 'dragend', function ( event ) {
                    console.log("dragend");
                    console.log(event);
                    event.object.material.emissive.set( 0x000000 );
    
                } );
                var params = {
                    'scale' : 1
                };
                gui.add(params, 'scale', 0, 5).onFinishChange(function(val){
                    object.scale.set(val,val,val);
                });
                
            });
        }
    );


    let spawned = false;
    // Create a render loop that allows us to draw on the AR view.
    const onXRFrame = (time, frame) => {
        // Queue up the next draw request.
        session.requestAnimationFrame(onXRFrame);
    
        // Bind the graphics framebuffer to the baseLayer's framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer)
    
        // Retrieve the pose of the device.
        // XRFrame.getViewerPose can return null while the session attempts to establish tracking.
        const pose = frame.getViewerPose(referenceSpace);
        if (pose) {
            // In mobile AR, we only have one view.
            const view = pose.views[0];
        
            const viewport = session.renderState.baseLayer.getViewport(view);
            renderer.setSize(viewport.width, viewport.height)
        
            // Use the view's transform matrix and projection matrix to configure the THREE.camera.
            camera.matrix.fromArray(view.transform.matrix)
            camera.projectionMatrix.fromArray(view.projectionMatrix);
            camera.updateMatrixWorld(true);
            
            if(!spawned && frame!==undefined && frame !== null){
                const hitTestResults = frame.getHitTestResults(hitTestSource);
                if (hitTestResults.length > 0 && object) {
                    const hitPose = hitTestResults[0].getPose(referenceSpace);
                    object.visible = true;
                    object.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z)
                    object.updateMatrixWorld(true);
                    spawned=true;
                    
                    
                }
            }
        
            // Render the scene with THREE.WebGLRenderer.
            renderer.render(scene, camera)
        }
    }
    session.requestAnimationFrame(onXRFrame);
}






