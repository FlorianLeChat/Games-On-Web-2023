let canvas;
let engine;
let scene;
let inputStates = {};
let groundSpeed = 5;
let distanceText;
let distance = 0;

export async function startGame2() {
    canvas = document.querySelector("#myCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = await createScene();
  
    modifySettings();
  
    let Bike = scene.getMeshByName("Bike");
    const finishLine = createFinishLine(scene);
  
    distanceText = document.createElement("div");
    distanceText.id = "distanceText";
    document.body.appendChild(distanceText);
  
    // Set the style of the distanceText element
    const style = distanceText.style;
    style.position = "absolute";
    style.left = "10px";
    style.top = "10px";
    style.color = "white";
    style.fontSize = "24px";
    style.fontFamily = "'Press Start 2P', cursive";
  
    engine.runRenderLoop(async () => {
      let deltaTime = engine.getDeltaTime();
  
      Bike.move();
  
      scene.meshes.forEach((mesh) => {
        if (mesh.name == "ground" || mesh.name == "obstacle" || mesh.name == "leftSideGround" || mesh.name == "rightSideGround" || mesh.name == "finishLine" || mesh.name == "palmtree") {
          mesh.position.z += groundSpeed;
        }
      });
  
      groundSpeed += 0.0005;
  
      // Update distance
      distance += groundSpeed * deltaTime / 1000;
      const distanceText = document.querySelector("#distanceText");
      distanceText.textContent = `Distance : ${distance.toFixed(0)} mètres`;
  
      if (Bike.position.z < finishLine.position.z) {
        // Game over logic here
        Bike.speed = 0; // Stop the bike
        engine.stopRenderLoop(); // Stop the game loop
  
        // Add distance text to gameResult div  
        const gameResult = document.querySelector("#gameResult");
        const finishText = document.createElement("p");
        finishText.textContent = "YOU WIN!";
        finishText.style.fontFamily = "'Press Start 2P', cursive";
        finishText.style.color = "rgb(147,138,138)";
        finishText.style.fontSize = "50px";
        gameResult.appendChild(finishText);
  
        showGameOverMenu(); // Show a game over menu, you need to create this function and the related menu
      }
  
      scene.render();
    });
  }
  

async function createScene() {
    let scene = new BABYLON.Scene( engine );
    let assetsManager = new BABYLON.AssetsManager(scene); // Créez un nouvel objet assetsManager
    let ground = createGround( scene );
    let sidegrounds = createSideGrounds( scene );

    let skybox = createSkybox(scene);
    ground.position.z = 300;    
    ground.position.y = 10;    


    let itBOX = createitBOX(scene);
  
    let Bike = await createBike( scene, itBOX );
    let freeCamera = createFreeCamera( scene, Bike );
  
    // second parameter is the target to follow
    let followCamera = createFollowCamera( scene, Bike );
    scene.activeCamera = followCamera;
  
    createLights( scene );
    
    // Ajoutez la tâche de chargement de fichier binaire à l'assetsManager
    let binaryTask = assetsManager.addBinaryFileTask("mood", "sounds/rayah.wav");
    binaryTask.onSuccess = function (task) {
        if (!scene.assets) {
            scene.assets = {}; // Créez la propriété assets si elle n'existe pas déjà
        }
        scene.assets.moodMusic = new BABYLON.Sound(
            "mood",
            task.data,
            scene,
            null,
            {
                loop: true,
                autoplay: true,
            }
        );
    };

    // Add obstacles
    function addObstacle() {
        // create first obstacle
        let obstacle1 = createObstacle(scene, itBOX);
        obstacle1.position.z = Bike.position.z - 300 - Math.floor(Math.random() * 100); // place the obstacle just in front of the bike
        let lane1 = Math.floor(Math.random() * 3); // randomly choose a lane (0, 1, or 2)
        let x1 = -30 + lane1 * 30; // compute the x position based on the lane
        obstacle1.position.x = x1; // set initial position in the lane
    
        // start obstacle1 animation
        scene.beginAnimation(obstacle1, 0, 40, false);
    
        // remove obstacle1 after 10 seconds
        setTimeout(function() {
            obstacle1.dispose();
        }, 10000);
    
        // create second obstacle
        let obstacle2 = createObstacle(scene, itBOX);
        obstacle2.position.z = Bike.position.z - 300 - Math.floor(Math.random() * 100); // place the obstacle just in front of the bike
        let lane2 = Math.floor(Math.random() * 3); // randomly choose a lane (0, 1, or 2)
        let x2 = -30 + lane2 * 30; // compute the x position based on the lane
        while (x2 == x1) { // make sure the second obstacle is not in the same lane as the first one
            lane2 = Math.floor(Math.random() * 3);
            x2 = -30 + lane2 * 30;
        }
        obstacle2.position.x = x2; // set initial position in the lane
    
        // start obstacle2 animation
        scene.beginAnimation(obstacle2, 0, 40, false);
    
        // remove obstacle2 after 10 seconds
        setTimeout(function() {
            obstacle2.dispose();
        }, 6000);
    }    
    
    // Wait for 15 seconds before adding obstacles
    setTimeout(() => {
        addObstacle();
        setInterval(addObstacle, 3000);
    }, 4000);

    await assetsManager.loadAsync(); // Attendez le chargement de tous les actifs

    return scene;
  }
  
function createGround(scene) {
    const groundOptions = {
        width: 100,
        height: 20300,
        subdivisions: 20,
        minHeight: 0,
        maxHeight: 0,
        onReady: onGroundCreated,
    };
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("ground", "images/hmap2.jpeg", groundOptions, scene);

    function onGroundCreated() {
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("images/terre.jpeg", scene);
        groundMaterial.diffuseTexture.uScale = 1;
        groundMaterial.diffuseTexture.vScale = 200;
        ground.material = groundMaterial;
        ground.checkCollisions = true;    
    }
    return ground;
}
function createFinishLine(scene) {
    const finishLine = BABYLON.MeshBuilder.CreateBox("finishLine", { height: 20, width: 100, depth: 1 }, scene);
    finishLine.position.y = 10;
    finishLine.position.z = -10000; // Change this value to set the finish line distance

    const finishLineMaterial = new BABYLON.StandardMaterial("finishLineMaterial", scene);
    finishLineMaterial.diffuseTexture = new BABYLON.Texture("images/grass.jpeg", scene);
    finishLineMaterial.diffuseTexture.hasAlpha = true;
    finishLine.material = finishLineMaterial;
    finishLine.visibility = false;

    return finishLine;
}
function createSideGrounds(scene) {
  const sideGroundOptions = {
    width: 2000,
    height: 20000,
    subdivisions: 50,
    minHeight: -50,
    maxHeight: 22,
    onReady: onSideGroundsCreated,
  };

  // Create left side ground
  const leftSideGround = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "leftSideGround",
    "images/hmap2.jpg", // la hauteur de bikete est définie ici
    sideGroundOptions,
    scene
  );
  leftSideGround.position.x = -1040; // Adjust position to left of main ground


  // Create right side ground
  const rightSideGround = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "rightSideGround",
    "images/hmap2.jpg", // la hauteur de bikete est définie ici
    sideGroundOptions,
    scene
  );
  rightSideGround.position.x = 1030; // Adjust position to right of main ground


  function onSideGroundsCreated() {
    const sideGroundMaterial = new BABYLON.StandardMaterial(
      "sideGroundMaterial",
      scene
    );
    sideGroundMaterial.diffuseTexture = new BABYLON.Texture(
      "images/grass.jpeg", // ajoutez une texture pour simuler du sable
      scene
    );
    sideGroundMaterial.diffuseTexture.uScale = 100;
    sideGroundMaterial.diffuseTexture.vScale = 1000;

    leftSideGround.material = sideGroundMaterial;
    rightSideGround.material = sideGroundMaterial;

    // Enable collisions for both side grounds
    leftSideGround.checkCollisions = true;
    rightSideGround.checkCollisions = true;
  }

  return [leftSideGround, rightSideGround]; // Return an array containing both side grounds
}


function createSkybox(scene) {
    // Création d'une material
       var sMaterial = new BABYLON.StandardMaterial("skyboxMaterial", scene);
       sMaterial.backFaceCulling = false;
       sMaterial.reflectionTexture = new BABYLON.CubeTexture("textures2/TropicalSunnyDay", scene);
       sMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  
       // Création d'un cube avec la material adaptée
       var skybox = BABYLON.Mesh.CreateBox("skybox", 10000, scene);
       skybox.material = sMaterial;
       skybox.position.z = 400;
       skybox.position.y = -200;
  }


function createitBOX(scene) {
    let itBOX = BABYLON.Mesh.CreateBox("itBOX", 2, scene);
    itBOX.scaling = new BABYLON.Vector3(6, 4, 23);
    itBOX.visibility = false; // make the box invisible
    itBOX.checkCollisions = true;
    return itBOX;
}

function createObstacle(scene, itBOX) {
    let obstacle = BABYLON.Mesh.CreateBox("obstacle", 2, scene);

    const collisionSound = new BABYLON.Sound(
        "collisionSound",
        "sounds/over.wav",
        scene,
        null,
        {
          loop: false,
          autoplay: false
        }
      );
    const actionManager = new BABYLON.ActionManager(scene);
        actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: { mesh: itBOX },
                },
                (evt) => {
                    distanceText.remove();

                    // Create a div to hold distance and buttons
                    const gameResult = document.createElement("div");
                    gameResult.style.position = "absolute";
                    gameResult.style.left = "50%";
                    gameResult.style.top = "40%";
                    gameResult.style.transform = "translate(-50%, -50%)";
                    gameResult.style.textAlign = "center";
                    document.body.appendChild(gameResult);
                    
                    // Add distance text to gameResult div
                    const distanceText1 = document.createElement("p");
                    distanceText1.textContent =`SO CLOSE`;
                    distanceText1.style.fontFamily = "'Press Start 2P', cursive";
                    distanceText1.style.color = "rgb(147,138,138)";
                    distanceText1.style.fontSize = "50px";
                    gameResult.appendChild(distanceText1);

                    // Add distance text to gameResult div
                    const distanceText2 = document.createElement("p");
                    distanceText2.textContent =`Distance parcourue  ${distance.toFixed(0)} mètres`;
                    distanceText2.style.fontFamily = "'Press Start 2P', cursive";
                    distanceText2.style.color = "rgb(147,138,138)";
                    distanceText2.style.fontSize = "40px";
                    gameResult.appendChild(distanceText2);
                    
                    // Add Try Again button to gameResult div
                    const tryAgain = document.createElement("button");
                    tryAgain.textContent = "Try Again";
                    gameResult.appendChild(tryAgain);
                    tryAgain.style.fontFamily = "'Press Start 2P', cursive";
                    tryAgain.style.marginRight = "10px";
                    tryAgain.style.padding = "10px 20px";
                    tryAgain.style.fontSize = "24px";
                    tryAgain.style.borderRadius = "10px";
                    tryAgain.style.background = "#ddd";
                    tryAgain.style.color = "#000";
                    tryAgain.style.cursor = "pointer";
                    tryAgain.addEventListener("click", () => {
                        gameResult.remove(); // supprime la div gameResult de la page
                        distance = 0; // réinitialise la distance
                        groundSpeed = 1; // réinitialise la vitesse
                        startGame2(); // redémarre le jeu
                    });           

                    collisionSound.play(); // Joue le son de collision

                    // Arrête la lecture du son de fond
                    if (scene.assets && scene.assets.moodMusic) {
                        scene.assets.moodMusic.stop();
                    }

                    // Stop the game
                    engine.stopRenderLoop();
                    }
            )
        );
    obstacle.actionManager = actionManager;
    obstacle.scaling = new BABYLON.Vector3(11, 8, 10);
  
    let lane = Math.floor(Math.random() * 3); // randomly choose a lane (0, 1, or 2)
    let x = -30 + lane * 30; // compute the x position based on the lane
    obstacle.position = new BABYLON.Vector3(x, 50, -100); // set initial position above the scene
  
    obstacle.checkCollisions = true;
  
    const obstacleFrontMaterial = new BABYLON.StandardMaterial("obstacleFrontMaterial", scene);
    obstacleFrontMaterial.diffuseTexture = new BABYLON.Texture("images/rock.png", scene);

    const transparentMaterial = createTransparentTexture(scene);

    const obstacleMultiMaterial = new BABYLON.MultiMaterial("obstacleMultiMaterial", scene);
    obstacleMultiMaterial.subMaterials.push(transparentMaterial); // Back face
    obstacleMultiMaterial.subMaterials.push(transparentMaterial); // Right face
    obstacleMultiMaterial.subMaterials.push(transparentMaterial); // Left face
    obstacleMultiMaterial.subMaterials.push(transparentMaterial); // Top face
    obstacleMultiMaterial.subMaterials.push(transparentMaterial); // Bottom face
    obstacleMultiMaterial.subMaterials.push(obstacleFrontMaterial); // Front face

    obstacle.subMeshes = [];
    const verticesCount = obstacle.getTotalVertices();
    obstacle.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 8, obstacle));
    obstacle.subMeshes.push(new BABYLON.SubMesh(1, 0, verticesCount, 0, 8, obstacle));
    obstacle.subMeshes.push(new BABYLON.SubMesh(2, 0, verticesCount, 0, 8, obstacle));
    obstacle.subMeshes.push(new BABYLON.SubMesh(3, 0, verticesCount, 0, 8, obstacle));
    obstacle.subMeshes.push(new BABYLON.SubMesh(4, 0, verticesCount, 0, 8, obstacle));
    obstacle.subMeshes.push(new BABYLON.SubMesh(5, 0, verticesCount, 0, 8, obstacle));

    obstacle.material = obstacleMultiMaterial;
    obstacle.checkCollisions = true;
  
    // animate the obstacle's fall
    let animation = new BABYLON.Animation("obstacleAnimation", "position.y", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    let keys = [];
    keys.push({frame: 0, value: 50}); // starting position
    keys.push({frame: 60, value: 18}); // ending position
    animation.setKeys(keys);
    obstacle.animations.push(animation);
  
    // remove obstacle after 10 seconds
    setTimeout(function() {
        obstacle.dispose();
    }, 10000);
  
    return obstacle;
}

function createTransparentTexture(scene) {
    const transparentMaterial = new BABYLON.StandardMaterial("transparentMaterial", scene);
    const transparentTexture = new BABYLON.Texture("images/transparentTexture.png", scene);
    transparentMaterial.diffuseTexture = transparentTexture;
    return transparentMaterial;
}

function createLights( scene )
{
  // Create a directional light with a direction pointing towards the setting sun
  let light0 = new BABYLON.DirectionalLight( "dir0", new BABYLON.Vector3( 0.5, -0.5, -0.5 ), scene );
  light0.intensity = 0.8; // Decrease the intensity to simulate a setting sun
  light0.diffuse = new BABYLON.Color3(1, 0.7, 0.5); // Use a warm color to simulate sunset
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
	let camera = new BABYLON.FollowCamera( "BikeFollowCamera", target.position, scene, target );

	camera.radius = 70; // how far from the object to follow
	camera.heightOffset = 20; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = 0.1; // how fast to move
	camera.maxCameraSpeed = 5; // speed limit

	return camera;
}

let zMovement = 5;

async function createBike(scene, itBOX) {
    return new Promise(resolve => {
        BABYLON.SceneLoader.ImportMesh("", "./models/", "bike.glb", scene, function(newMeshes) {
            let Bike = newMeshes[0];
            Bike.name = "Bike";
            Bike.position.y = 9;
            Bike.speed = 0;
            Bike.frontVector = new BABYLON.Vector3(0, 0, 1);
            Bike.laneIndex = 0; // start at the leftmost lane

            // Define the positions of the lanes
            const lanes = [-30, 0, 30]; // example positions for 3 lanes
            const laneOffset = 5; // distance between lanes
            const leftmostLane = lanes[0];
            const rightmostLane = lanes[lanes.length - 1];

            Bike.move = () => {
                
                let yMovement = 0;

                if (Bike.position.y > 2) {
                    zMovement = 0;
                    yMovement = -2;
                }

                if (inputStates.right) {
                    if (Bike.laneIndex > 0) { // check if there's a lane to the right
                        Bike.laneIndex--;
                        let toPosition = new BABYLON.Vector3(lanes[Bike.laneIndex], Bike.position.y, Bike.position.z);
                        BABYLON.Animation.CreateAndStartAnimation("moveRight", Bike, "position", 15, 15, Bike.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                        BABYLON.Animation.CreateAndStartAnimation("moveRight", itBOX, "position", 15, 15, itBOX.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    }
                }   
                if (inputStates.left) {
                    if (Bike.laneIndex < lanes.length - 1) { // check if there's a lane to the left
                        Bike.laneIndex++;
                        let toPosition = new BABYLON.Vector3(lanes[Bike.laneIndex], Bike.position.y, Bike.position.z);
                        BABYLON.Animation.CreateAndStartAnimation("moveLeft", Bike, "position", 15, 15, Bike.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                        BABYLON.Animation.CreateAndStartAnimation("moveLeft", itBOX, "position", 15, 15, itBOX.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    }
                }
                if (inputStates.down) {
					if (Bike.laneIndex == 0 || Bike.laneIndex == lanes.length - 1) { // check if there's a lane to the middle
						Bike.laneIndex = 1;
						let toPosition = new BABYLON.Vector3(lanes[Bike.laneIndex], Bike.position.y, Bike.position.z);
						BABYLON.Animation.CreateAndStartAnimation("moveMiddle", Bike, "position", 15, 15, Bike.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                        BABYLON.Animation.CreateAndStartAnimation("moveMiddle", itBOX, "position", 15, 15, itBOX.position, toPosition, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

					}
				}				

                // other movements (left, right, etc.) can be added here
            };

            Bike.scaling = new BABYLON.Vector3(8, 8, 13);
            Bike.rotation.y = Math.PI;
            Bike.name = "Bike";

            // to be taken into account by collision detection
            Bike.checkCollisions = true;

            resolve(Bike);
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