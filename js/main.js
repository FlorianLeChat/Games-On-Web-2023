let canvas;
let engine;
let scene;

canvas = document.getElementById( "renderCanvas" );
engine = new BABYLON.Engine( canvas, true );
scene = new BABYLON.Scene( engine );


// vars for handling inputs
let inputStates = {};

window.onload = startGame;

function startGame()
{
	canvas = document.querySelector( "#myCanvas" );
	engine = new BABYLON.Engine( canvas, true );
	scene = createScene();

	// enable physics
	scene.enablePhysics();

	// modify some default settings (i.e pointer events to prevent cursor to go
	// out of the game window)
	modifySettings();

}

function createScene()
{
	let scene = new BABYLON.Scene( engine );
	let ground = createGround( scene );
	let freeCamera = createFreeCamera( scene );
	let ceilling = creatCeilling( scene );
	let walls = createWalls( scene );

	// second parameter is the target to follow
	let followCamera = createFollowCamera( scene, target );
	scene.activeCamera = followCamera;

	createLights( scene );

	return scene;
}

function createGround( scene )
{
	const ground = BABYLON.MeshBuilder.CreateGround( "ground", { width: 10, height: 10 }, scene );

	//scene is optional and defaults to the current scene

	function onGroundCreated()
	{
		const groundMaterial = new BABYLON.StandardMaterial( "groundMaterial", scene );
		groundMaterial.diffuseTexture = new BABYLON.Color3.Green();
		ground.material = groundMaterial;
		// to be taken into account by collision detection
		ground.checkCollisions = true;
		//groundMaterial.wireframe=true;

		// for physic engine
		ground.physicsImpostor = new BABYLON.PhysicsImpostor( ground,
			BABYLON.PhysicsImpostor.HeightmapImpostor, { mass: 0 }, scene );
	}
	return ground;
}

function creatCeilling( scene )
{
	const ceiling = BABYLON.MeshBuilder.CreateBox( "ceiling", { size: 10 }, scene );
	ceiling.position.y = 5;
	ceiling.material = new BABYLON.StandardMaterial( "ceilingMat", scene );
	ceiling.material.diffuseColor = new BABYLON.Color3.Green();

	return ceiling;
}

function createWalls( scene )
{
	let walls = [];
	walls.push( BABYLON.MeshBuilder.CreateBox( "wall1", { size: 10 }, scene ) );
	walls.push( BABYLON.MeshBuilder.CreateBox( "wall2", { size: 10 }, scene ) );
	walls.push( BABYLON.MeshBuilder.CreateBox( "wall3", { size: 10 }, scene ) );
	walls.push( BABYLON.MeshBuilder.CreateBox( "wall4", { size: 10 }, scene ) );

	walls[ 0 ].position.x = -5;
	walls[ 0 ].material = new BABYLON.StandardMaterial( "wallMat1", scene );
	walls[ 0 ].material.diffuseColor;

	return walls;
}

function createLights( scene )
{
	// i.e sun light with all light rays parallels, the vector is the direction.
	let light = new BABYLON.DirectionalLight( "light", new BABYLON.Vector3( -1, -2, -1 ), scene );

}

function createFreeCamera( scene )
{

	let camera = new BABYLON.FreeCamera( "freeCamera", new BABYLON.Vector3( 0, 0, -10 ), scene );
	camera.setTarget( BABYLON.Vector3.Zero() );
	camera.attachControl( canvas, true );
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
	let camera = new BABYLON.FollowCamera( "tankFollowCamera", target.position, scene, target );

	camera.radius = 40; // how far from the object to follow
	camera.heightOffset = 14; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = .1; // how fast to move
	camera.maxCameraSpeed = 5; // speed limit

	return camera;
}
