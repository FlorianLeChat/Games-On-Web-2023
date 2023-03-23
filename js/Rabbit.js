// Classe pour le modèle "Rabbit".
// Le code est totalement hérité de la classe "Dude" du tp2_exemple4 (sans modifications).
// Source : https://playground.babylonjs.com/#NMU4ZM#1
export default class Rabbit
{
	constructor( rabbitMesh, id, speed, scaling, scene )
	{
		this.rabbitMesh = rabbitMesh;
		this.id = id;
		this.scene = scene;
		this.scaling = scaling;

		if ( speed )
			this.speed = speed;
		else
			this.speed = 1;

		// in case, attach the instance to the mesh itself, in case we need to retrieve
		// it after a scene.getMeshByName that would return the Mesh
		// SEE IN RENDER LOOP !
		rabbitMesh.Rabbit = this;

		// scaling
		this.rabbitMesh.scaling = new BABYLON.Vector3( 0.2, 0.2, 0.2 );

		// FOR COLLISIONS, let's associate a BoundingBox to the rabbit

		// singleton, static property, computed only for the first rabbit we constructed
		// for others, we will reuse this property.
		if ( Rabbit.boundingBoxParameters == undefined )
		{
			Rabbit.boundingBoxParameters = this.calculateBoundingBoxParameters();
		}

		this.bounder = this.createBoundingBox();
		this.bounder.rabbitMesh = this.rabbitMesh;
	}

	move( scene )
	{
		// as move can be called even before the bbox is ready.
		if ( !this.bounder ) return;

		// let's put the rabbit at the BBox position. in the rest of this
		// method, we will not move the rabbit but the BBox instead
		this.rabbitMesh.position = new BABYLON.Vector3( this.bounder.position.x,
			this.bounder.position.y, this.bounder.position.z );

		// follow the tank
		let tank = scene.getMeshByName( "heroTank" );
		// let's compute the direction vector that goes from rabbit to the tank
		let direction = tank.position.subtract( this.rabbitMesh.position );
		let distance = direction.length(); // we take the vector that is not normalized, not the dir vector
		//console.log(distance);

		let dir = direction.normalize();
		// angle between rabbit and tank, to set the new rotation.y of the rabbit so that he will look towards the tank
		// make a drawing in the X/Z plan to uderstand....
		let alpha = Math.atan2( -dir.x, -dir.z );
		// If I uncomment this, there are collisions. This is strange ?
		//this.bounder.rotation.y = alpha;

		this.rabbitMesh.rotation.y = alpha;

		// let make the rabbit move towards the tank
		// first let's move the bounding box mesh
		if ( distance > 30 )
		{
			//a.restart();
			// Move the bounding box instead of the rabbit....
			this.bounder.moveWithCollisions( dir.multiplyByFloats( this.speed, this.speed, this.speed ) );
		}
		else
		{
			//a.pause();
		}
	}

	calculateBoundingBoxParameters()
	{
		// Compute BoundingBoxInfo for the rabbit, for this we visit all children meshes
		let childrenMeshes = this.rabbitMesh.getChildren();
		let bbInfo = this.totalBoundingInfo( childrenMeshes );

		return bbInfo;
	}

	// Taken from BabylonJS Playground example : https://www.babylonjs-playground.com/#QVIDL9#1
	totalBoundingInfo( meshes )
	{
		var boundingInfo = meshes[ 0 ].getBoundingInfo();
		var min = boundingInfo.minimum.add( meshes[ 0 ].position );
		var max = boundingInfo.maximum.add( meshes[ 0 ].position );
		for ( var i = 1; i < meshes.length; i++ )
		{
			boundingInfo = meshes[ i ].getBoundingInfo();
			min = BABYLON.Vector3.Minimize( min, boundingInfo.minimum.add( meshes[ i ].position ) );
			max = BABYLON.Vector3.Maximize( max, boundingInfo.maximum.add( meshes[ i ].position ) );
		}
		return new BABYLON.BoundingInfo( min, max );
	}

	createBoundingBox()
	{
		// Create a box as BoundingBox of the rabbit
		let bounder = new BABYLON.Mesh.CreateBox( "bounder" + ( this.id ).toString(), 1, this.scene );
		let bounderMaterial = new BABYLON.StandardMaterial( "bounderMaterial", this.scene );
		bounderMaterial.alpha = .4;
		bounder.material = bounderMaterial;
		bounder.checkCollisions = true;

		bounder.position = this.rabbitMesh.position.clone();

		let bbInfo = Rabbit.boundingBoxParameters;

		let max = bbInfo.boundingBox.maximum;
		let min = bbInfo.boundingBox.minimum;

		// Not perfect, but kinda of works...
		// Looks like collisions are computed on a box that has half the size... ?
		bounder.scaling.x = ( max._x - min._x ) * this.scaling;
		bounder.scaling.y = ( max._y - min._y ) * this.scaling * 2;
		bounder.scaling.z = ( max._z - min._z ) * this.scaling * 3;

		//bounder.isVisible = false;

		return bounder;
	}
}
