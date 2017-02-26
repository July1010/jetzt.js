threeDHTMLTranspiler = {
    customObjectsToLoad: 999,
    insertAssetByPath: function (parentId, src, cssID, cssClass, callback) {
        var newAsset;
        var loader = new THREE.OBJLoader();
        // execute loading
        loader.load(src, function (data) {
            // prepare first object in collada scene as asset asset
            newAsset = data;

            newAsset.children[0].geometry.computeFaceNormals();
            newAsset.children[0].geometry.computeVertexNormals();

            newAsset.cssID = cssID;
            newAsset.cssClass = cssClass;
            //add asset to scene
            if (parentId != null && parentId != "objectsContainer") {
                Designer.scene.traverse(function (sceneObject) {
                    if (sceneObject.cssID == parentId) {
                        sceneObject.add(newAsset);
                    }
                });
            } else {
                Designer.scene.add(newAsset);
            }

            // execute callback function, if provided
            if (callback) {
                callback(newAsset.id);
            }
        });
    },
    assignEventhandler: function () {
        $(document).on("documentIsReadyEvent", function () {
            var htmlElements = document.getElementById('objectsContainer');
            var elementsArray = [htmlElements];
            threeDHTMLTranspiler.parseObjects(elementsArray, null);

            for (var i = 0; i < threeDHTMLTranspiler.objectStack.length; ++i) {
                var element = threeDHTMLTranspiler.objectStack[i].element;
                var parentId = threeDHTMLTranspiler.objectStack[i].parentId;
                threeDHTMLTranspiler.objectFunctions[element.localName](
                        parentId ? parentId : false,
                        element.id ? element.id : false,
                        element.className ? element.className : false,
                        element.attributes.src ? element.attributes.src : false,
                        element.attributes ? element.attributes : false
                        );
            }
        });

        threeDHTMLTranspiler.customObjectsToLoad -= 999;
    },
    objectStack: [],
    parseObjects: function (htmlElements, parentNode) {
        for (var i = 0; i < htmlElements.length; ++i) {
            var element = htmlElements[i];
            if (element.children.length > 0) {
                threeDHTMLTranspiler.parseObjects(element.children, element);
            }
            if (threeDHTMLTranspiler.objectFunctions.hasOwnProperty(element.localName)) {
                threeDHTMLTranspiler.objectStack.unshift({
                    "element": element,
                    "parentId": element.parentElement.id
                });
            }
        }
    },
    objectFunctions: {
        "simple-cube": function (parentId, cssID, cssClass, src) {
            threeDHTMLTranspiler.insertSimpleCube(parentId, 1, 1, 1, cssID, cssClass);
        },
        "simple-sphere": function (parentId, cssID, cssClass, src) {
            threeDHTMLTranspiler.insertSimpleSphere(parentId, 1, 30, 30, cssID, cssClass);
        },
        "custom-object": function (parentId, cssID, cssClass, src) {
            threeDHTMLTranspiler.insertCustomObject(parentId, cssID, cssClass, src);
        },
        "grid": function (parentId, cssID, cssClass, src, attributes) {
            Designer.insertGrid(parseInt(attributes.size.nodeValue), parseFloat(attributes.step.nodeValue), attributes.color.nodeValue);
        },
        "view-point": function (parentId, cssID, cssClass, src, attributes) {
            Designer.setViewport(attributes.coordX.nodeValue, attributes.coordY.nodeValue, attributes.coordZ.nodeValue);
        },
        "simple-circle": function (parentId, cssID, cssClass, src, attributes) {
            threeDHTMLTranspiler.insertSimpleCircle(parentId, cssID, cssClass, parseInt(attributes.radius.nodeValue), parseFloat(attributes.segments.nodeValue));
        },
        "simple-cylinder": function (parentId, cssID, cssClass, src, attributes) {
            threeDHTMLTranspiler.insertSimpleCylinder(parentId, cssID, cssClass, parseFloat(attributes.radiusTop.nodeValue), parseFloat(attributes.radiusBottom.nodeValue), parseFloat(attributes.height.nodeValue), parseFloat(attributes.radiusSegments.nodeValue));
        },
        "simple-torus": function (parentId, cssID, cssClass, src, attributes) {
            threeDHTMLTranspiler.insertSimpleTorus(parentId, cssID, cssClass, parseFloat(attributes.radius.nodeValue), parseInt(attributes.tube.nodeValue), parseInt(attributes.radialSegments.nodeValue), parseInt(attributes.tubularSegments.nodeValue), parseFloat(attributes.arc.nodeValue));
        }
    },
    insertSimpleCube: function (parentId, width, length, height, cssID, cssClass) {
        var material = new THREE.MeshPhongMaterial({color: 0xa0a0a0});
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), material);
        var object = new THREE.Object3D();
        object.cssID = cssID;
        object.cssClass = cssClass;
        object.add(mesh);

        if (parentId != null && parentId != "objectsContainer") {
            Designer.scene.traverse(function (sceneObject) {
                if (sceneObject.cssID == parentId) {
                    sceneObject.add(object);
                }
            });
        } else {
            Designer.scene.add(object);
        }
    },
    insertSimpleSphere: function (parentId, radius, subdivisionX, subdivisionY, cssID, cssClass) {
        var material = new THREE.MeshPhongMaterial({color: 0xa0a0a0});
        var mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, subdivisionX, subdivisionY), material);
        var object = new THREE.Object3D();
        object.cssID = cssID;
        object.cssClass = cssClass;
        object.add(mesh);
        if (parentId != null && parentId != "objectsContainer") {
            Designer.scene.traverse(function (sceneObject) {
                if (sceneObject.cssID == parentId) {
                    sceneObject.add(object);
                }
            });
        } else {
            Designer.scene.add(object);
        }
    },
    insertCustomObject: function (parentId, cssID, cssClass, src) {
        var val = src.value;
        ++threeDHTMLTranspiler.customObjectsToLoad;
        threeDHTMLTranspiler.insertAssetByPath(parentId, val,
                cssID,
                cssClass,
                function () {
                    --threeDHTMLTranspiler.customObjectsToLoad;
                });
    },
    insertSimpleCircle: function (parentId, cssID, cssClass, radius, segments) {
        var material = new THREE.MeshPhongMaterial({color: 0xa0a0a0});
        var mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, segments), material);
        var object = new THREE.Object3D();
        object.cssID = cssID;
        object.cssClass = cssClass;
        object.add(mesh);

        if (parentId != null && parentId != "objectsContainer") {
            Designer.scene.traverse(function (sceneObject) {
                if (sceneObject.cssID == parentId) {
                    sceneObject.add(object);
                }
            });
        } else {
            Designer.scene.add(object);
        }
    },
    insertSimpleCylinder: function (parentId, cssID, cssClass, radiusTop, radiusBottom, height, radiusSegments) {
        var material = new THREE.MeshPhongMaterial({color: 0xa0a0a0});
        var mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments), material);
        var object = new THREE.Object3D();
        object.cssID = cssID;
        object.cssClass = cssClass;
        object.add(mesh);

        if (parentId != null && parentId != "objectsContainer") {
            Designer.scene.traverse(function (sceneObject) {
                if (sceneObject.cssID == parentId) {
                    sceneObject.add(object);
                }
            });
        } else {
            Designer.scene.add(object);
        }
    },
    insertSimpleTorus: function (parentId, cssID, cssClass, radius, tube, radialSegments, tubularSegments, arc) {
        var material = new THREE.MeshPhongMaterial({color: 0xa0a0a0});
        var mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc), material);
        var object = new THREE.Object3D();
        object.cssID = cssID;
        object.cssClass = cssClass;
        object.add(mesh);

        if (parentId != null && parentId != "objectsContainer") {
            Designer.scene.traverse(function (sceneObject) {
                if (sceneObject.cssID == parentId) {
                    sceneObject.add(object);
                }
            });
        } else {
            Designer.scene.add(object);
        }
    }
};

$(window).load(function () {
    threeDHTMLTranspiler.assignEventhandler();
    $(document).trigger("documentIsReadyEvent");
});