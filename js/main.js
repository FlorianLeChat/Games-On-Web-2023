let canvas;
let engine;
let scene;
// vars for handling inputs
let inputStates = {};

window.onload = startGame;

function startGame() {
    canvas = document.querySelector("#myCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = createScene();

    // modify some default settings (i.e pointer events to prevent cursor to go 
    // out of the game window)
    modifySettings();

    let Car = scene.getMeshByName("Car");

    engine.runRenderLoop(() => {
        let deltaTime = engine.getDeltaTime(); // remind you something ?

        Car.move();
        scene.render();
    });
}

function createScene() {
    let scene = new BABYLON.Scene(engine);
    let ground = createGround(scene);
    let freeCamera = createFreeCamera(scene);

    let Car = createCar(scene);

    // second parameter is the target to follow
    let followCamera = createFollowCamera(scene, Car);
    scene.activeCamera = followCamera;

    createLights(scene);
   return scene;
}

function createGround(scene) {
    const groundOptions = { width:70, height:20000, subdivisions:20, minHeight:0, maxHeight:0, onReady: onGroundCreated};
    //scene is optional and defaults to the current scene
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("gdhm", 'images/hmap1.png', groundOptions, scene); 

    function onGroundCreated() {
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("images/road.png");
        ground.material = groundMaterial;
        // to be taken into account by collision detection
        ground.checkCollisions = true;
        //groundMaterial.wireframe=true;
    }
    return ground;
}

function createLights(scene) {
    // i.e sun light with all light rays parallels, the vector is the direction.
    let light0 = new BABYLON.DirectionalLight("dir0", new BABYLON.Vector3(-1, -1, 0), scene);

}

function createFreeCamera(scene) {
    let camera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 50, 0), scene);
    camera.attachControl(canvas);
    // prevent camera to cross ground
    camera.checkCollisions = true; 
    // avoid flying with the camera
    camera.applyGravity = true;

    // Add extra keys for camera movements
    // Need the ascii code of the extra key(s). We use a string method here to get the ascii code
    camera.keysUp.push('z'.charCodeAt(0));
    camera.keysDown.push('s'.charCodeAt(0));
    camera.keysLeft.push('q'.charCodeAt(0));
    camera.keysRight.push('d'.charCodeAt(0));
    camera.keysUp.push('Z'.charCodeAt(0));
    camera.keysDown.push('S'.charCodeAt(0));
    camera.keysLeft.push('Q'.charCodeAt(0));
    camera.keysRight.push('D'.charCodeAt(0));

    return camera;
}

function createFollowCamera(scene, target) {
    let camera = new BABYLON.FollowCamera("CarFollowCamera", target.position, scene, target);

    camera.radius = 15; // how far from the object to follow
	camera.heightOffset = 2; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = .1; // how fast to move
	camera.maxCameraSpeed = 5; // speed limit

    return camera;
}

let zMovement = 5;
function createCar(scene) {
    let Car = BABYLON.SceneLoader.ImportMesh("", "/models/", "car.glb", scene, function(){
    // let CarMaterial = new BABYLON.StandardMaterial("CarMaterial", scene);
    // CarMaterial.diffuseColor = new BABYLON.Color3.Red;
    // CarMaterial.emissiveColor = new BABYLON.Color3.Blue;
    // Car.material = CarMaterial;

    // By default the box/Car is in 0, 0, 0, let's change that...
    Car.position.y = 0.6;
    Car.speed = 1;
    Car.frontVector = new BABYLON.Vector3(0, 0, 1);

    Car.move = () => {
                //Car.position.z += -1; // speed should be in unit/s, and depends on
                                 // deltaTime !

        // if we want to move while taking into account collision detections
        // collision uses by default "ellipsoids"

        let yMovement = 0;
       
        if (Car.position.y > 2) {
            zMovement = 0;
            yMovement = -2;
        } 
        //Car.moveWithCollisions(new BABYLON.Vector3(0, yMovement, zMovement));

        
        if(inputStates.up) {
            //Car.moveWithCollisions(new BABYLON.Vector3(0, 0, 1*Car.speed));
            Car.moveWithCollisions(Car.frontVector.multiplyByFloats(Car.speed, Car.speed, Car.speed));
        }    
        if(inputStates.down) {
            //Car.moveWithCollisions(new BABYLON.Vector3(0, 0, -1*Car.speed));
            Car.moveWithCollisions(Car.frontVector.multiplyByFloats(-Car.speed, -Car.speed, -Car.speed));

        }  
        if(inputStates.left) {
            //Car.moveWithCollisions(new BABYLON.Vector3(-1*Car.speed, 0, 0));
            Car.rotation.y -= 0.02;
            Car.frontVector = new BABYLON.Vector3(Math.sin(Car.rotation.y), 0, Math.cos(Car.rotation.y));
        }    
        if(inputStates.right) {
            //Car.moveWithCollisions(new BABYLON.Vector3(1*Car.speed, 0, 0));
            Car.rotation.y += 0.02;
            Car.frontVector = new BABYLON.Vector3(Math.sin(Car.rotation.y), 0, Math.cos(Car.rotation.y));
        }
    }
    
    return Car;
})};

window.addEventListener("resize", () => {
    engine.resize()
});

function modifySettings() {
    // as soon as we click on the game window, the mouse pointer is "locked"
    // you will have to press ESC to unlock it
    scene.onPointerDown = () => {
        if(!scene.alreadyLocked) {
            console.log("requesting pointer lock");
            canvas.requestPointerLock();
        } else {
            console.log("Pointer already locked");
        }
    }

    document.addEventListener("pointerlockchange", () => {
        let element = document.pointerLockElement || null;
        if(element) {
            // lets create a custom attribute
            scene.alreadyLocked = true;
        } else {
            scene.alreadyLocked = false;
        }
    })

    // key listeners for the Car
    inputStates.left = false;
    inputStates.right = false;
    inputStates.up = false;
    inputStates.down = false;
    inputStates.space = false;
    
    //add the listener to the main, window object, and update the states
    window.addEventListener('keydown', (event) => {
        if ((event.key === "ArrowLeft") || (event.key === "q")|| (event.key === "Q")) {
           inputStates.left = true;
        } else if ((event.key === "ArrowUp") || (event.key === "z")|| (event.key === "Z")){
           inputStates.up = true;
        } else if ((event.key === "ArrowRight") || (event.key === "d")|| (event.key === "D")){
           inputStates.right = true;
        } else if ((event.key === "ArrowDown")|| (event.key === "s")|| (event.key === "S")) {
           inputStates.down = true;
        }  else if (event.key === " ") {
           inputStates.space = true;
        }
    }, false);

    //if the key will be released, change the states object 
    window.addEventListener('keyup', (event) => {
        if ((event.key === "ArrowLeft") || (event.key === "q")|| (event.key === "Q")) {
           inputStates.left = false;
        } else if ((event.key === "ArrowUp") || (event.key === "z")|| (event.key === "Z")){
           inputStates.up = false;
        } else if ((event.key === "ArrowRight") || (event.key === "d")|| (event.key === "D")){
           inputStates.right = false;
        } else if ((event.key === "ArrowDown")|| (event.key === "s")|| (event.key === "S")) {
           inputStates.down = false;
        }  else if (event.key === " ") {
           inputStates.space = false;
        }
    }, false);
}

