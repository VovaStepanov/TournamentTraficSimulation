import * as THREE from "/build/three.module.js";
import {OrbitControls} from "/jsm/controls/OrbitControls.js";
import {GLTFLoader} from "/jsm/loaders/GLTFLoader.js";


function ThreeDimentionalApp(containerId, width, height) {
    this.nodes = {};
    this.cars = {};


    //#region  initialization
    this.init = () =>  {

        this.scene = new THREE.Scene();

        // this.pointLight = new THREE.PointLight(0xffffff, 0.1);
        // this.pointLight.position.x = 2;
        // this.pointLight.position.y = 3;
        // this.pointLight.position.z = 4;
        // this.pointLight.castShadow = true;
        // this.scene.add(this.pointLight);

        // this.ambiendLight = new THREE.AmbientLight(0xFFFFFF);
        // this.ambiendLight.position.x = 2;
        // this.ambiendLight.position.y = 3;
        // this.ambiendLight.position.z = 4;
        // this.scene.add(this.ambiendLight);

        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 1);
        this.scene.add(this.hemiLight);

        this.light = new THREE.SpotLight(0xffa95c,4);
        this.light.position.set(-50,50,50);
        this.light.castShadow = true;
        this.light.shadow.bias = -0.0001;
        this.light.shadow.mapSize.width = 1024*4;
        this.light.shadow.mapSize.height = 1024*4;
        this.scene.add( this.light );

        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        window.addEventListener('resize', () => {
            // Update sizes
            this.sizes.width = window.innerWidth;
            this.sizes.height = window.innerHeight;

            // Update camera
            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();

            // Update renderer
            this.renderer.setSize(sizes.width, sizes.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });


        this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.3, 100);
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 2;
        this.scene.add(this.camera);


        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0xffffff);
        this.renderer.shadowMap.enabled = true;
        $("#container").append( this.renderer.domElement );

        // Controls
        this.controls = new OrbitControls(this.camera,  this.renderer.domElement);
        this.controls.enableDamping = true;

        this.loader = new GLTFLoader();

        //absolute path
        this.loader.load("./assets/models/1/scene.gltf", (gltf) => {
            gltf.scene.traverse( function( node ) {

                if ( node.isMesh ) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    if(node.material.map) node.material.map.anisotropy = 16;
                }; 
        
            });

            this.scene.add( gltf.scene );
        });

        this.clock = new THREE.Clock();

        this.tick();
    };
    //#endregion

    //#region update frame
    this.tick = () =>
    {

        let elapsedTime = this.clock.getElapsedTime();

        // Update Orbital Controls
        this.controls.update();

        // Render
        this.renderer.render(this.scene, this.camera);

        // Call tick again on the next frame
        window.requestAnimationFrame(this.tick);
    };
    //#endregion
    this.init();


};



export default ThreeDimentionalApp;