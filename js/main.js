let canvas;
let engine;
let scene;

window.onload = startGame;

function startGame() {
    canvas = document.querySelector("#myCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = createScene();

    // modify some default settings (i.e pointer events to prevent cursor to go 
    // out of the game window)
    modifySettings();

    engine.runRenderLoop(() => {
        scene.render();
    });
}

function createScene() {
    let scene = new BABYLON.Scene(engine);
    let camera = createFreeCamera(scene);

    // load the .glb model and add it to the scene
    BABYLON.SceneLoader.ImportMesh("", "models/", "american_road.glb", scene, function(newMeshes) {
        newMeshes.forEach(function(mesh) {
            scene.addMesh(mesh);
        });
     });
    // add some lights to the scene
    let light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
    let light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), scene);

    return scene;
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

window.addEventListener("resize", () => {
    engine.resize()
});

function modifySettings() {
    // as soon as we click on the game window, the mouse pointer is "locked"
    // you will have to press ESC to unlock it

    //ajoute un événement "onPointerDown" à la scène du jeu lorsque l'utilisateur clique sur la fenêtre du jeu.
    scene.onPointerDown = () => {
        //On vérifie si le pointeur de la souris est déjà verrouillé ou non. 
        //Si ce n'est pas le cas, elle demande que le pointeur soit verrouillé en utilisant la méthode "requestPointerLock()" de l'élément canvas
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
}
