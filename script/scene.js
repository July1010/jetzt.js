var canvas = "canvas";

var Designer = {
    initScene: function () {
        Designer.scene = new THREE.Scene();
        var WIDTH = document.getElementById(canvas).innerWidth;
        var HEIGHT = document.getElementById(canvas).innerHeight;
        Designer.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        Designer.renderer.setSize(WIDTH, HEIGHT);
        Designer.container = document.getElementById(canvas);
        Designer.container.appendChild(Designer.renderer.domElement);

        // CAMERA
        Designer.camera = new THREE.PerspectiveCamera(30, WIDTH / HEIGHT, 1, 500);
        Designer.insertLight();
        Designer.scene.add(Designer.camera);

        // CONTROLS
        Designer.controls = new THREE.OrbitControls(Designer.camera, Designer.renderer.domElement);
        Designer.controls.target = new THREE.Vector3(0, 3, 0);
        Designer.controls.noKeys = true;
        Designer.controls.update();

        window.addEventListener('resize', Designer.onWindowResize, false);
        Designer.onWindowResize();
        
        setTimeout(Designer.animate, 500);
    },
    onWindowResize: function () {
        var width = Designer.container.clientWidth;
        var height = Designer.container.clientHeight;
        Designer.camera.aspect = width / height;
        Designer.camera.updateProjectionMatrix();
        Designer.renderer.setSize(width, height);
    },
    animate: function () {
        requestAnimationFrame(Designer.animate);
        Designer.renderer.render(Designer.scene, Designer.camera);
    },
    // LIGHT
    insertLight: function () {
        var sunLight = new THREE.PointLight(0xffffff, 1.2);
        sunLight.position.set(20, 30, 20);
        Designer.camera.add(sunLight);
        var light1 = new THREE.PointLight(0x303030);
        Designer.scene.add(light1);
        var light2 = new THREE.AmbientLight(0x303030);
        Designer.scene.add(light2);
    },
    insertGrid: function (size, step, color) {
        var geometry = new THREE.Geometry();
        var material = new THREE.LineBasicMaterial({color: color});
        for (var i = -size; i <= size; i += step) {
          
            geometry.vertices.push(new THREE.Vector3(-size, 0.005, i));
            geometry.vertices.push(new THREE.Vector3(size, 0.005, i));

            geometry.vertices.push(new THREE.Vector3(i, 0.005, -size));
            geometry.vertices.push(new THREE.Vector3(i, 0.005, size));
        }

        var line = new THREE.Line(geometry, material, THREE.LinePieces);
        Designer.scene.add(line);
    },
    setViewport: function (coordX, coordY, coordZ) {
        Designer.controls.object.position.x = coordX;
        Designer.controls.object.position.y = coordY;
        Designer.controls.object.position.z = coordZ;
        Designer.controls.update();
    }
};

$(document).ready(function () {
    Designer.initScene();
});