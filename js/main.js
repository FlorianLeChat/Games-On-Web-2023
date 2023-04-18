let canvas;
let engine;
let scene;
// vars for handling inputs
let inputStates = {};

window.onload = startGame;

async function startGame()
{
	canvas = document.querySelector( "#myCanvas" );
	engine = new BABYLON.Engine( canvas, true );
	scene = await createScene();

	// modify some default settings (i.e pointer events to prevent cursor to go
	// out of the game window)
	modifySettings();

	let Car = scene.getMeshByName( "Car" );

	engine.runRenderLoop( () =>
	{
		let deltaTime = engine.getDeltaTime(); // remind you something ?

		Car.move();
		scene.render();
		
		scene.meshes.forEach((mesh) => {
			console.log(mesh.name);
			  if (mesh.name == "ground" || mesh.name == "object") {
				mesh.position.z += 2;
			  }
			});
	} );
}

async function createScene()
{
	let scene = new BABYLON.Scene( engine );
	let ground = createGround( scene );

	let Car = await createCar( scene );
	let freeCamera = createFreeCamera( scene, Car );

	// second parameter is the target to follow
	let followCamera = createFollowCamera( scene, Car );
	scene.activeCamera = followCamera;

	createLights( scene );

	return scene;
}

function createGround(scene) {
    const groundOptions = {
        width: 100,
        height: 500,
        subdivisions: 20,
        minHeight: 0,
        maxHeight: 0,
        onReady: onGroundCreated
    };
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("gdhm", "images/hmap1.png", groundOptions, scene);

    function onGroundCreated() {
		const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
		groundMaterial.diffuseTexture = new BABYLON.Texture("images/road.png");
		ground.material = groundMaterial;
		ground.checkCollisions = true;
	
		// create objects at random positions on the ground
		const numObjects = 10; // change this to adjust the number of objects
		const objectWidth = 5; // the width of the objects
		const objectHeight = 10; // the height of the objects
		const objectSpacing = 20; // the minimum spacing between objects
	
		for (let i = 0; i < numObjects; i++) {
			const x = Math.random() * (groundOptions.width - objectWidth) - groundOptions.width / 2 + objectWidth / 2;
			const z = Math.random() * (groundOptions.height - objectSpacing) - groundOptions.height / 2 + objectSpacing / 2;
			const object = BABYLON.MeshBuilder.CreateBox(`object`, { width: objectWidth, height: objectHeight, depth: objectWidth }, scene);
			object.position = new BABYLON.Vector3(x, objectHeight / 2, z);
			object.checkCollisions = true;
		}
	
		animateGround();
	}

    function animateGround() {
        const animationSpeed = 0.1; // change this to adjust the speed of the ground
        const groundLength = 500; // the length of the ground in the z-direction
        const groundWidth = 100; // the width of the ground in the x-direction
        const groundPosition = ground.position.clone();
        const groundOffset = new BABYLON.Vector3(0, 0, -groundLength);
        ground.position.addInPlace(groundOffset);

        // create a new ground mesh and material
        const newGround = BABYLON.MeshBuilder.CreateGround("ground", { width: groundWidth, height: groundLength }, scene);
        const newGroundMaterial = new BABYLON.StandardMaterial("newGroundMaterial", scene);
        newGroundMaterial.diffuseTexture = new BABYLON.Texture("images/road.png");
        newGround.material = newGroundMaterial;

        // position the new ground behind the old one
        newGround.position = groundPosition.clone().subtract(groundOffset);

        // animate the ground
        const groundAnimation = new BABYLON.Animation("groundAnimation", "position", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [
            { frame: 0, value: ground.position },
            { frame: 100, value: ground.position.add(new BABYLON.Vector3(0, 0, groundLength)) }
        ];
        groundAnimation.setKeys(keys);
        groundAnimation.setEasingFunction(new BABYLON.QuadraticEase());
        ground.animations.push(groundAnimation);
        scene.beginAnimation(ground, 0, 100, true, animationSpeed);

        // destroy the old ground when it is out of view
        setTimeout(function() {
            ground.dispose();
        },  10000);

        // repeat the process to create a new ground
        setTimeout(function() {
            animateGround();
        },  2000);
    }

    return ground;
}


// function createGround( scene )
// {
// 	const groundOptions = { width: 100, height: 500, subdivisions: 20, minHeight: 0, maxHeight: 0, onReady: onGroundCreated };
// 	//scene is optional and defaults to the current scene
// 	const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap( "gdhm", 'images/hmap1.png', groundOptions, scene );

// 	function onGroundCreated()
// 	{
// 		const groundMaterial = new BABYLON.StandardMaterial( "groundMaterial", scene );
// 		groundMaterial.diffuseTexture = new BABYLON.Texture( "images/road.png" );
// 		ground.material = groundMaterial;
// 		// to be taken into account by collision detection
// 		ground.checkCollisions = true;
// 		//groundMaterial.wireframe=true;
// 	}
// 	return ground;

// }

function createLights( scene )
{
	// i.e sun light with all light rays parallels, the vector is the direction.
	let light0 = new BABYLON.DirectionalLight( "dir0", new BABYLON.Vector3( -1, -1, 0 ), scene );

}

function createFreeCamera( scene )
{
	let camera = new BABYLON.FreeCamera( "freeCamera", new BABYLON.Vector3( 0, 50, 0 ), scene );
	camera.attachControl( canvas );
	// prevent camera to cross ground
	camera.checkCollisions = true;
	// avoid flying with the camera
	camera.applyGravity = true;

	// Add extra keys for camera movements
	// Need the ascii code of the extra key(s). We use a string method here to get the ascii code
	camera.keysUp.push( 'z'.charCodeAt( 0 ) );
	camera.keysDown.push( 's'.charCodeAt( 0 ) );
	camera.keysLeft.push( 'q'.charCodeAt( 0 ) );
	camera.keysRight.push( 'd'.charCodeAt( 0 ) );
	camera.keysUp.push( 'Z'.charCodeAt( 0 ) );
	camera.keysDown.push( 'S'.charCodeAt( 0 ) );
	camera.keysLeft.push( 'Q'.charCodeAt( 0 ) );
	camera.keysRight.push( 'D'.charCodeAt( 0 ) );

	return camera;
}

function createFollowCamera( scene, target )
{
	let camera = new BABYLON.FollowCamera( "CarFollowCamera", target.position, scene, target );

	camera.radius = 20; // how far from the object to follow
	camera.heightOffset = 5; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = 0.1; // how fast to move
	camera.maxCameraSpeed = 5; // speed limit

	return camera;
}

let zMovement = 5;

async function createCar(scene) {
    return new Promise(resolve => {
        BABYLON.SceneLoader.ImportMesh("", "./models/", "Car.glb", scene, function(newMeshes) {
            let Car = newMeshes[0];
            Car.name = "Car";
            Car.position.y = 10;
            Car.speed = 2;
            Car.frontVector = new BABYLON.Vector3(0, 0, 1);
            Car.laneIndex = 0; // start at the leftmost lane

            // Define the positions of the lanes
            const lanes = [-30, 0, 30]; // example positions for 3 lanes
            const laneOffset = 5; // distance between lanes
            const leftmostLane = lanes[0];
            const rightmostLane = lanes[lanes.length - 1];

            Car.move = () => {
                let yMovement = 0;

                if (Car.position.y > 2) {
                    zMovement = 0;
                    yMovement = -2;
                }

                if (inputStates.right) {
                    if (Car.laneIndex > 0) { // check if there's a lane to the right
                        Car.laneIndex--;
                        let toPosition = new BABYLON.Vector3(lanes[Car.laneIndex], Car.position.y, Car.position.z);
                        BABYLON.Animation.CreateAndStartAnimation("moveLeft", Car, "position", 15, 15, Car.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    }
                }   
                if (inputStates.left) {
                    if (Car.laneIndex < lanes.length - 1) { // check if there's a lane to the left
                        Car.laneIndex++;
                        let toPosition = new BABYLON.Vector3(lanes[Car.laneIndex], Car.position.y, Car.position.z);
                        BABYLON.Animation.CreateAndStartAnimation("moveRight", Car, "position", 15, 15, Car.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    }
                }
                if (inputStates.down) {
					if (Car.laneIndex == 0 || Car.laneIndex == lanes.length - 1) { // check if there's a lane to the middle
						Car.laneIndex = 1;
						let toPosition = new BABYLON.Vector3(lanes[Car.laneIndex], Car.position.y, Car.position.z);
						BABYLON.Animation.CreateAndStartAnimation("moveMiddle", Car, "position", 15, 15, Car.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
					}
				}				

                // other movements (left, right, etc.) can be added here
            };

            Car.scaling = new BABYLON.Vector3(3, 3, 5);
            Car.rotation.y = Math.PI;
            Car.name = "Car";

            // to be taken into account by collision detection
            Car.checkCollisions = true;

            resolve(Car);
        });
    });
}


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

    // key listeners for the Perso
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