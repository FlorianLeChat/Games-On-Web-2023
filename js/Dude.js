// Classe pour le modèle "Dude".
// Source : https://github.com/micbuffa/BabylonJS_course/blob/ba07555440240519ec4f082037e32ceedeb8cd45/tp2/tp2_exemple4/js/Dude.js
// Source : https://playground.babylonjs.com/#WLDCUC#2
export default class Dude
{
	constructor( dudeMesh, id, speed, scaling, scene )
	{
		this.id = id;
		this.scene = scene;
		this.speed = speed ?? 1;
		this.scaling = scaling;
		this.dudeMesh = dudeMesh;
		this.positionId = 0;

		// in case, attach the instance to the mesh itself, in case we need to retrieve
		// it after a scene.getMeshByName that would return the Mesh
		// SEE IN RENDER LOOP !
		dudeMesh.Dude = this;

		// scaling
		this.dudeMesh.scaling = new BABYLON.Vector3( 0.2, 0.2, 0.2 );

		// FOR COLLISIONS, let's associate a BoundingBox to the Dude
		// singleton, static property, computed only for the first dude we constructed
		// for others, we will reuse this property.
		if ( Dude.boundingBoxParameters == undefined )
		{
			Dude.boundingBoxParameters = this.calculateBoundingBoxParameters();
		}

		this.bounder = this.createBoundingBox();
		this.bounder.dudeMesh = this.dudeMesh;
	}

	move( _scene )
	{
		// On vérifie d'abord si la boîte de collision a été créée.
		if ( !this.bounder ) return;

		// On place ensuite le personnage à la position de la boîte de collision.
		this.dudeMesh.position.copyFrom( this.bounder.position );

		// On génère alors quatre positions du rectangle de patrouille.
		const positions = [
			new BABYLON.Vector3( 0, 0, 0 ),
			new BABYLON.Vector3( 0, 0, 100 ),
			new BABYLON.Vector3( 100, 0, 100 ),
			new BABYLON.Vector3( 100, 0, 0 )
		];

		// On sélectionne la prochaine position de la patrouille.
		let nextPosition = positions[ this.positionId ];
		let distanceToNextPosition = BABYLON.Vector3.Distance( this.bounder.position, nextPosition );

		if ( distanceToNextPosition < 5 )
		{
			// Le personnage est proche de la prochaine position de patrouille.
			// On passe alors à la prochaine position de patrouille.
			this.positionId = ( this.positionId + 1 ) % positions.length;
			nextPosition = positions[ this.positionId ];
			distanceToNextPosition = BABYLON.Vector3.Distance( this.bounder.position, nextPosition );
		}

		// On calcule également la direction vers la prochaine position de patrouille.
		const directionToNextPosition = nextPosition.subtract( this.bounder.position ).normalize();
		let angleToNextPosition = 0;

		if ( directionToNextPosition )
		{
			angleToNextPosition = Math.atan2( -directionToNextPosition.x, -directionToNextPosition.z );
		}

		// On tourne le personnage vers la prochaine position de patrouille.
		this.dudeMesh.rotation.y = angleToNextPosition;

		// On déplace enfin la boîte de collision vers la prochaine position de patrouille.
		if ( distanceToNextPosition > 5 )
		{
			// Le personnage est éloigné de la prochaine position de patrouille.
			this.bounder.moveWithCollisions( directionToNextPosition.multiplyByFloats( this.speed, this.speed, this.speed ) );
		}
	}

	calculateBoundingBoxParameters()
	{
		// Compute BoundingBoxInfo for the Dude, for this we visit all children meshes
		return this.totalBoundingInfo( this.dudeMesh.getChildren() );
	}

	// Taken from BabylonJS Playground example : https://www.babylonjs-playground.com/#QVIDL9#1
	totalBoundingInfo( meshes )
	{
		let boundingInfo = meshes[ 0 ].getBoundingInfo();
		let min = boundingInfo.minimum.add( meshes[ 0 ].position );
		let max = boundingInfo.maximum.add( meshes[ 0 ].position );

		for ( let i = 1; i < meshes.length; i++ )
		{
			boundingInfo = meshes[ i ].getBoundingInfo();

			min = BABYLON.Vector3.Minimize( min, boundingInfo.minimum.add( meshes[ i ].position ) );
			max = BABYLON.Vector3.Maximize( max, boundingInfo.maximum.add( meshes[ i ].position ) );
		}

		return new BABYLON.BoundingInfo( min, max );
	}

	createBoundingBox()
	{
		// Create a box as BoundingBox of the Dude
		const bounder = new BABYLON.Mesh.CreateBox( "bounder" + ( this.id ).toString(), 1, this.scene );
		const bounderMaterial = new BABYLON.StandardMaterial( "bounderMaterial", this.scene );

		bounderMaterial.alpha = .4;
		bounder.material = bounderMaterial;
		bounder.position = this.dudeMesh.position.clone();
		bounder.checkCollisions = true;

		const bbInfo = Dude.boundingBoxParameters;
		const max = bbInfo.boundingBox.maximum;
		const min = bbInfo.boundingBox.minimum;

		// Not perfect, but kinda of works...
		// Looks like collisions are computed on a box that has half the size... ?
		bounder.scaling.x = ( max._x - min._x ) * this.scaling;
		bounder.scaling.y = ( max._y - min._y ) * this.scaling * 2;
		bounder.scaling.z = ( max._z - min._z ) * this.scaling * 3;

		return bounder;
	}
}
