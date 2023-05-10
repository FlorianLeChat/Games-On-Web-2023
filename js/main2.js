//import Dude from "./Dude.js";

let canvas;
let engine;
let scene;

export function startGame2() {
  canvas = document.querySelector("#myCanvas");
  engine = new BABYLON.Engine(canvas, true);
  scene = createScene();

  // enable physics
  scene.enablePhysics();

  modifySettings();

  let tank = scene.getMeshByName("Tank");

  scene.toRender = () => {
    let deltaTime = engine.getDeltaTime();

    tank.move();

    scene.render();
  };

  //engine.runRenderLoop();
  // instead of running the game, we tell instead the asset manager to load.
  // when finished it will execute its onFinish callback that will run the loop
  scene.assetsManager.load();
}

function createScene() {
  let scene = new BABYLON.Scene(engine);

  scene.assetsManager = configureAssetManager(scene);

  let ground = createGround(scene);
  //let freeCamera = createFreeCamera(scene);
 
  let skybox = createSkybox(scene);

  let tank = createTank(scene);

  // second parameter is the target to follow
  scene.followCameraTank = createFollowCamera(scene, tank);
  scene.activeCamera = scene.followCameraTank;

  createLights(scene);

  loadSounds(scene);

  return scene;
}

function configureAssetManager(scene) {
  // useful for storing references to assets as properties. i.e scene.assets.cannonsound, etc.
  scene.assets = {};

  let assetsManager = new BABYLON.AssetsManager(scene);

  assetsManager.onProgress = function (
    remainingCount,
    totalCount,
    lastFinishedTask
  ) {
    engine.loadingUIText =
      "We are loading the scene. " +
      remainingCount +
      " out of " +
      totalCount +
      " items still need to be loaded.";
    console.log(
      "We are loading the scene. " +
      remainingCount +
      " out of " +
      totalCount +
      " items still need to be loaded."
    );
  };

  assetsManager.onFinish = function (tasks) {
    engine.runRenderLoop(function () {
      scene.toRender();
    });
  };

  return assetsManager;
}

function loadSounds(scene) {
  var assetsManager = scene.assetsManager;

  var binaryTask = assetsManager.addBinaryFileTask("laserSound", "sounds/laser.wav");
  binaryTask.onSuccess = function (task) {
    scene.assets.laserSound = new BABYLON.Sound("laser", task.data, scene, null,
      { loop: false, spatialSound: true }
    );
  };

  binaryTask = assetsManager.addBinaryFileTask("dieSound", "sounds/dying.wav");
  binaryTask.onSuccess = function (task) {
    scene.assets.dieSound = new BABYLON.Sound("die", task.data, scene, null, {
      loop: false,
      spatialSound: true
    });
  };

  binaryTask = assetsManager.addBinaryFileTask("gunSound", "sounds/shot.wav");
  binaryTask.onSuccess = function (task) {
    scene.assets.gunSound = new BABYLON.Sound("gun", task.data, scene, null, {
      loop: false,
    });
  };

  binaryTask = assetsManager.addBinaryFileTask("explosion","sounds/explosion.mp3");
  binaryTask.onSuccess = function (task) {
    scene.assets.explosion = new BABYLON.Sound(
      "explosion",
      task.data,
      scene,
      null,
      { loop: false, spatialSound: true }
    );
  };

  binaryTask = assetsManager.addBinaryFileTask("pirates", "sounds/pirateFun.mp3");
  binaryTask.onSuccess = function (task) {
    scene.assets.pirateMusic = new BABYLON.Sound(
      "piratesFun",
      task.data,
      scene,
      null,
      {
        loop: true,
        autoplay: true,
      }
    );
  };
}

function createGround(scene) {
  const groundOptions = {
    width: 2000,
    height: 20000,
    subdivisions: 50,
    minHeight: -50,
    maxHeight: 50,
    onReady: onGroundCreated,
  };
  //scene is optional and defaults to the current scene
  const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "gdhm",
    "images/hmap2.jpg",
    groundOptions,
    scene
  );

  function onGroundCreated() {
    const groundMaterial = new BABYLON.StandardMaterial(
      "groundMaterial",
      scene
    );
    groundMaterial.diffuseTexture = new BABYLON.Texture("images/grass2.jpeg");
    ground.material = groundMaterial;
    // to be taken into account by collision detection
    ground.checkCollisions = true;
    //groundMaterial.wireframe=true;
    groundMaterial.diffuseTexture.uScale = 100;
    groundMaterial.diffuseTexture.vScale = 1000;
    // for physic engine
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.HeightmapImpostor,
      { mass: 0 },
      scene
    );
  }
  return ground;
}

function createLights( scene )
{
  // Create a directional light with a direction pointing towards the setting sun
  let light0 = new BABYLON.DirectionalLight( "dir0", new BABYLON.Vector3( 0.5, -0.5, -0.5 ), scene );
  light0.intensity = 0.9; // Decrease the intensity to simulate a setting sun
  light0.diffuse = new BABYLON.Color3(1, 0.7, 0.5); // Use a warm color to simulate sunset
}


function createSkybox(scene) {
  // Création d'une material
     var sMaterial = new BABYLON.StandardMaterial("skyboxMaterial", scene);
     sMaterial.backFaceCulling = false;
     sMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/TropicalSunnyDay", scene);
     sMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;

     // Création d'un cube avec la material adaptée
     var skybox = BABYLON.Mesh.CreateBox("skybox", 10000, scene);
     skybox.material = sMaterial;
     skybox.position.z = 400;
     skybox.position.y = -200;
}

function createFreeCamera(scene, initialPosition) {
  let camera = new BABYLON.FreeCamera("freeCamera", initialPosition, scene);
  camera.attachControl(canvas);
  // prevent camera to cross ground
  camera.checkCollisions = true;
  // avoid flying with the camera
  camera.applyGravity = true;

  // Make it small as we're going to put in on top of the Dude
  camera.ellipsoid = new BABYLON.Vector3(.1, .1, .1); // very small ellipsoid/sphere 
  camera.ellipsoidOffset.y = 4;
  // Add extra keys for camera movements
  // Need the ascii code of the extra key(s). We use a string method here to get the ascii code
  camera.keysUp.push("z".charCodeAt(0));
  camera.keysDown.push("s".charCodeAt(0));
  camera.keysLeft.push("q".charCodeAt(0));
  camera.keysRight.push("d".charCodeAt(0));
  camera.keysUp.push("Z".charCodeAt(0));
  camera.keysDown.push("S".charCodeAt(0));
  camera.keysLeft.push("Q".charCodeAt(0));
  camera.keysRight.push("D".charCodeAt(0));

  return camera;
}

function createFollowCamera(scene, target) {
  let targetName = target.name;

  // use the target name to name the camera
  let camera = new BABYLON.FollowCamera(
    targetName + "FollowCamera",
    target.position,
    scene,
    target
  );

  // default values
	camera.radius = 47; // how far from the object to follow
	camera.heightOffset = 10; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = 0.1; // how fast to move
	camera.maxCameraSpeed = 5; // speed limit

  return camera;
}

let zMovement = 5;
function createTank(scene) {
  let tank = new BABYLON.MeshBuilder.CreateBox(
    "Tank",
    { height: 1, depth: 6, width: 6 },
    scene
  );
  let tankMaterial = new BABYLON.StandardMaterial("tankMaterial", scene);
  tankMaterial.diffuseColor = new BABYLON.Color3.Red();
  tankMaterial.emissiveColor = new BABYLON.Color3.Blue();
  tank.material = tankMaterial;

  // tank cannot be picked by rays, but tank will not be pickable by any ray from other
  // players.... !
  //tank.isPickable = false;

  // By default the box/tank is in 0, 0, 0, let's change that...
  tank.position.y = 0.6;
  tank.speed = 1;
  tank.frontVector = new BABYLON.Vector3(0, 0, 1);

  tank.move = () => {
    if (scene.activeCamera !== scene.followCameraTank) return;
    //tank.position.z += -1; // speed should be in unit/s, and depends on
    // deltaTime !

    // if we want to move while taking into account collision detections
    // collision uses by default "ellipsoids"

    let yMovement = 0;

    if (tank.position.y > 2) {
      zMovement = 0;
      yMovement = -2;
    }


    // adjusts y position depending on ground height...
    // create a ray that starts above the dude, and goes down vertically
    let origin = new BABYLON.Vector3(tank.position.x, 1000, tank.position.z);
    let direction = new BABYLON.Vector3(0, -1, 0);
    let ray = new BABYLON.Ray(origin, direction, 10000);

    // compute intersection point with the ground
    let pickInfo = scene.pickWithRay(ray, (mesh) => { return (mesh.name === "gdhm"); });
    let groundHeight = pickInfo.pickedPoint.y;
    tank.position.y = groundHeight + 1.5;

    //tank.moveWithCollisions(new BABYLON.Vector3(0, yMovement, zMovement));

    if (scene.inputStates.up) {
      //tank.moveWithCollisions(new BABYLON.Vector3(0, 0, 1*tank.speed));
      tank.moveWithCollisions(
        tank.frontVector.multiplyByFloats(tank.speed, tank.speed, tank.speed)
      );
    }
    if (scene.inputStates.down) {
      //tank.moveWithCollisions(new BABYLON.Vector3(0, 0, -1*tank.speed));
      tank.moveWithCollisions(
        tank.frontVector.multiplyByFloats(-tank.speed, -tank.speed, -tank.speed)
      );
    }
    if (scene.inputStates.left) {
      //tank.moveWithCollisions(new BABYLON.Vector3(-1*tank.speed, 0, 0));
      tank.rotation.y -= 0.02;
      tank.frontVector = new BABYLON.Vector3(
        Math.sin(tank.rotation.y),
        0,
        Math.cos(tank.rotation.y)
      );
    }
    if (scene.inputStates.right) {
      //tank.moveWithCollisions(new BABYLON.Vector3(1*tank.speed, 0, 0));
      tank.rotation.y += 0.02;
      tank.frontVector = new BABYLON.Vector3(
        Math.sin(tank.rotation.y),
        0,
        Math.cos(tank.rotation.y)
      );
    }
  };
  return tank;
}

window.addEventListener("resize", () => {
  engine.resize();
});

function modifySettings() {
  // as soon as we click on the game window, the mouse pointer is "locked"
  // you will have to press ESC to unlock it
  scene.onPointerDown = () => {
    if (!scene.alreadyLocked) {
      console.log("requesting pointer lock");
      canvas.requestPointerLock();
    } else {
      console.log("Pointer already locked");
    }
  };

  document.addEventListener("pointerlockchange", () => {
    let element = document.pointerLockElement || null;
    if (element) {
      // lets create a custom attribute
      scene.alreadyLocked = true;
    } else {
      scene.alreadyLocked = false;
    }
  });

  // key listeners for the tank
  scene.inputStates = {};
  scene.inputStates.left = false;
  scene.inputStates.right = false;
  scene.inputStates.up = false;
  scene.inputStates.down = false;
  scene.inputStates.space = false;
  scene.inputStates.laser = false;

  //add the listener to the main, window object, and update the states
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "ArrowLeft" || event.key === "q" || event.key === "Q") {
        scene.inputStates.left = true;
      } else if (
        event.key === "ArrowUp" ||
        event.key === "z" ||
        event.key === "Z"
      ) {
        scene.inputStates.up = true;
      } else if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        scene.inputStates.right = true;
      } else if (
        event.key === "ArrowDown" ||
        event.key === "s" ||
        event.key === "S"
      ) {
        scene.inputStates.down = true;
      } else if (event.key === " ") {
        scene.inputStates.space = true;
      } else if (event.key === "l" || event.key === "L") {
        scene.inputStates.laser = true;
      } else if (event.key == "t" || event.key == "T") {
        scene.activeCamera = scene.followCameraTank;
      } else if (event.key == "y" || event.key == "Y") {
        scene.activeCamera = scene.followCameraDude;
      } else if (event.key == "u" || event.key == "U") {
        scene.activeCamera = scene.freeCameraDude;
      }
    },
    false
  );

  //if the key will be released, change the states object
  window.addEventListener(
    "keyup",
    (event) => {
      if (event.key === "ArrowLeft" || event.key === "q" || event.key === "Q") {
        scene.inputStates.left = false;
      } else if (
        event.key === "ArrowUp" ||
        event.key === "z" ||
        event.key === "Z"
      ) {
        scene.inputStates.up = false;
      } else if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        scene.inputStates.right = false;
      } else if (
        event.key === "ArrowDown" ||
        event.key === "s" ||
        event.key === "S"
      ) {
        scene.inputStates.down = false;
      } else if (event.key === " ") {
        scene.inputStates.space = false;
      } else if (event.key === "l" || event.key === "L") {
        scene.inputStates.laser = false;
      }
    },
    false
  );
}
