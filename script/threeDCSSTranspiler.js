threeDCSSTranspiler = {
    init: function () {
        //wait for custom objects to load
        var limit = 100;

        if (threeDHTMLTranspiler.customObjectsToLoad > 0)
        {
            console.log("waiting for obj loader ", threeDHTMLTranspiler.customObjectsToLoad);
            setTimeout(threeDCSSTranspiler.init, 100);
        }
        else
        {
            threeDCSSTranspiler.getParsedStyles(function (sheet) {
                threeDCSSTranspiler.data.rules = sheet.cssRules;
                threeDCSSTranspiler.data.rules = threeDCSSTranspiler.data.rules.sort(threeDCSSTranspiler.compareBySpecificity);
                threeDCSSTranspiler.data.rules.forEach(function (rule) {
                    var objects = threeDCSSTranspiler.getObjectsBySelector(rule);
                    objects.forEach(function (object) {
                        rule.declarations.forEach(function (declaration) {
                            threeDCSSTranspiler.applyPropertyToObject(object, declaration);
                        });
                    });
                });
            });
        }
    },
    compareBySpecificity: function (a, b) {
        if (a.mSelectorText[0] == '#' && b.mSelectorText[0] == '.')
        {
            return 1;
        }
        if (b.mSelectorText[0] == '#' && a.mSelectorText[0] == '.')
        {
            return -1;
        }

        return 0;
    },
    data: {
        rules: null,
        sheet: null
    },
    getParsedStyles: function (callback) {
        var source;
        $.get("style/3Dstyles.css", function (data) {
            source = data;
            var parser = new CSSParser();
            var sheet = parser.parse(source, false, false);
            if (callback) {
                callback(sheet);
            }
        });
    },
    getObjectsBySelector: function (rule) {
        var regExp = /[#.][^,]{1,}/g;
        var selectors = [];
        var selector = null;
        selector = regExp.exec(rule.mSelectorText);
        do {
            selectors.push(selector[0]);
            selector = regExp.exec(rule.mSelectorText);
        } while (selector != null);

        var objects = [];
        selectors.forEach(function (selector) {
            switch (rule.mSelectorText[0]) {
                case '#':
                    var idName = selector.substr(1);
                    Designer.scene.traverse(function (obj) {
                        if (obj.cssID == idName) {
                            objects.push(obj);
                        }
                        return;
                    });
                    break;
                case '.':
                    var className = rule.mSelectorText.substr(1);
                    Designer.scene.traverse(function (obj) {
                        if (obj.cssClass == className) {
                            objects.push(obj);
                        }
                    });
                    break;
            }
        });
        return objects;

    },
    applyPropertyToObject: function (object, declaration) {
        if (declaration.property == undefined) {
            return;
        }
        threeDCSSTranspiler.propertyFunctions[declaration.property](object, declaration);
    },
    propertyFunctions: {
        "material-color": function (object, declaration) {
            var value = parseInt(declaration.valueText.replace("#", "0x"));
            object.children[0].material.color = new THREE.Color(value);

        },
        "size-x": function (object, declaration) {
            var value = declaration.valueText;
            var box = new THREE.Box3().setFromObject(object);
            var newX = value / box.size().x;
            object.children[0].scale.x = newX.toString();
        },
        "size-y": function (object, declaration) {
            var value = declaration.valueText;
            var box = new THREE.Box3().setFromObject(object);
            var newY = value / box.size().y;
            object.children[0].scale.y = newY.toString();
        },
        "size-z": function (object, declaration) {
            var value = declaration.valueText;
            var box = new THREE.Box3().setFromObject(object);
            var newZ = value / box.size().z;
            object.children[0].scale.z = newZ.toString();
        },
        "rotate-x": function (object, declaration) {
            var value = parseInt(declaration.valueText.replace("deg", ""));
            object.rotation.x = (value / 360) * (2 * Math.PI);
        },
        "rotate-y": function (object, declaration) {
            var value = parseInt(declaration.valueText.replace("deg", ""));
            object.rotation.y = (value / 360) * (2 * Math.PI);
        },
        "rotate-z": function (object, declaration) {
            var value = parseInt(declaration.valueText.replace("deg", ""));
            object.rotation.z = (value / 360) * (2 * Math.PI);
        },
        "scale-x": function (object, declaration) {
            object.scale.x = declaration.valueText;
        },
        "scale-y": function (object, declaration) {
            object.scale.y = declaration.valueText;
        },
        "scale-z": function (object, declaration) {
            object.scale.z = declaration.valueText;
        },
        "position-x": function (object, declaration) {
            object.position.set(parseFloat(declaration.valueText), object.position.y, object.position.z);
        },
        "position-y": function (object, declaration) {
            object.position.set(object.position.x, parseFloat(declaration.valueText), object.position.z);
        },
        "position-z": function (object, declaration) {
            object.position.set(object.position.x, object.position.y, parseFloat(declaration.valueText));
        },
        "texture": function (object, declaration) {
            var textureLoader = new THREE.TextureLoader();
            var url = declaration.valueText.replace(/\"/g, '');
            object.children[0].material.map = textureLoader.load(url);
            object.children[0].material.needsUpdate = true;
        },
        "shininess": function (object, declaration) {
            object.children[0].material.shininess = declaration.valueText;
            object.children[0].material.needsUpdate = true;
        },
        "fade-in": function (object, declaration) {
            object.children[0].material.transparent = true;
            object.children[0].material.opacity = 0;

            var time = parseInt(declaration.valueText);
            var lastUpdate = 0;
            var fps = 0;

            function step(timestamp) {
                if (lastUpdate > 0) {
                    fps = 1000 / (timestamp - lastUpdate);

                    object.children[0].material.opacity += 1 / (time / (1000 / fps));
                }
                if (object.children[0].material.opacity < 1) {
                    window.requestAnimationFrame(step);
                }
                lastUpdate = timestamp;
            }
            step();
        },
        "fade-out": function (object, declaration) {
            object.children[0].material.transparent = true;
            object.children[0].material.opacity = 1;

            var time = parseInt(declaration.valueText);
            var lastUpdate = 0;
            var fps = 0;

            function step(timestamp) {
                if (lastUpdate > 0) {
                    fps = 1000 / (timestamp - lastUpdate);

                    object.children[0].material.opacity -= 1 / (time / (1000 / fps));
                }
                if (object.children[0].material.opacity > 0) {
                    window.requestAnimationFrame(step);
                }
                lastUpdate = timestamp;
            }
            step();
        },
        "translate-x": function (object, declaration) {
            var normX = parseFloat(object.position.x);
            var normTargX = parseFloat(declaration.valueText.split(",")[0]);
            var time = parseInt(declaration.valueText.split(",")[1]);
            var diff = Math.abs(Math.abs(normX)- Math.abs(normTargX)) * 0.9;
            var direction = 1;
            var lastUpdate = 0;
            var fps = 0;
            
            function step(timestamp) {
                if (normX > normTargX) {
                    direction *= -1;
                }
                normX = Math.abs(normX);
                normTargX = Math.abs(normTargX);

                if (lastUpdate > 0) {
                    fps = 1000 / (timestamp - lastUpdate);
                    object.position.x +=  diff / (time / (1000 / fps)) * direction;
                    normX = object.position.x;
                }
                if (direction > 0 && normX - normTargX < 0) {
                    window.requestAnimationFrame(step);
                }
                else if (direction < 0 && normTargX * direction - normX  < 0) {
                    window.requestAnimationFrame(step);
                }
                lastUpdate = timestamp;
            }
            step();
        },
        "translate-y": function (object, declaration) {
            var normY = parseFloat(object.position.y);
            var normTargY = parseFloat(declaration.valueText.split(",")[0]);
            var time = parseInt(declaration.valueText.split(",")[1]);
            var diff = Math.abs(Math.abs(normY)- Math.abs(normTargY)) * 0.9;
            var direction = 1;
            var lastUpdate = 0;
            var fps = 0;
            
            function step(timestamp) {
                if (normY > normTargY) {
                    direction *= -1;
                }
                normY = Math.abs(normY);
                normTargY = Math.abs(normTargY);

                if (lastUpdate > 0) {
                    fps = 1000 / (timestamp - lastUpdate);
                    object.position.y +=  diff / (time / (1000 / fps)) * direction;
                    normY = object.position.y;
                }
                if (direction > 0 && normY - normTargY < 0) {
                    window.requestAnimationFrame(step);
                }
                else if (direction < 0 && normTargY * direction - normY  < 0) {
                    window.requestAnimationFrame(step);
                }
                lastUpdate = timestamp;
            }
            step();
        },
        "translate-z": function (object, declaration) {
            var normZ = parseFloat(object.position.z);
            var normTargZ = parseFloat(declaration.valueText.split(",")[0]);
            var time = parseInt(declaration.valueText.split(",")[1]);
            var diff = Math.abs(Math.abs(normZ)- Math.abs(normTargZ)) * 0.9;
            var direction = 1;
            var lastUpdate = 0;
            var fps = 0;
            
            function step(timestamp) {
                if (normZ > normTargZ) {
                    direction *= -1;
                }
                normZ = Math.abs(normZ);
                normTargZ = Math.abs(normTargZ);

                if (lastUpdate > 0) {
                    fps = 1000 / (timestamp - lastUpdate);
                    object.position.z +=  diff / (time / (1000 / fps)) * direction;
                    normZ = object.position.z;
                }
                if (direction > 0 && normZ - normTargZ < 0) {
                    window.requestAnimationFrame(step);
                }
                else if (direction < 0 && normTargZ * direction - normZ  < 0) {
                    window.requestAnimationFrame(step);
                }
                lastUpdate = timestamp;
            }
            step();
        },
        "spin-x": function (object, declaration) {
            var start = null;
            function step(timestamp) {
                if (!start) {
                    start = timestamp;
                }
                if (declaration.valueText == "forward") {
                    object.rotation.x += 0.01 * 2;
                }
                if (declaration.valueText == "backward")
                    object.rotation.x -= 0.01 * 2;
                if (parseFloat(object.position.x) < 1000) {
                    window.requestAnimationFrame(step);
                }
            }
            step();
        },
        "spin-y": function (object, declaration) {
            var start = null;
            function step(timestamp) {
                if (!start) {
                    start = timestamp;
                }
                if (declaration.valueText == "right") {
                    object.rotation.y += 0.01 * 2;
                }
                if (declaration.valueText == "left")
                    object.rotation.y -= 0.01 * 2;
                if (parseFloat(object.position.y) < 1000) {
                    window.requestAnimationFrame(step);
                }
            }
            step();
        },
        "spin-z": function (object, declaration) {
            var start = null;
            function step(timestamp) {
                if (!start) {
                    start = timestamp;
                }
                if (declaration.valueText == "right") {
                    object.rotation.z -= 0.01 * 2;
                }
                if (declaration.valueText == "left")
                    object.rotation.z += 0.01 * 2;
                if (parseFloat(object.position.z) < 1000) {
                    window.requestAnimationFrame(step);
                }
            }
            step();
        },
        "rotation-x": function (object, declaration) {
            var angleX = parseFloat(object.rotation.x);
            var angleTargX = (parseFloat(declaration.valueText.split(",")[0]) / 360) * 2 * Math.PI;
            var time = parseInt(declaration.valueText.split(",")[1]);
            var diff = Math.abs(Math.abs(angleX)- Math.abs(angleTargX)) * 0.9;
            var direction = 1;
            var lastUpdate = 0;
            var fps = 0;
            
            function step(timestamp) {
                if (angleX > angleTargX) {
                    direction *= -1;
                }
                angleX = Math.abs(angleX);
                angleTargX = Math.abs(angleTargX);

                if (lastUpdate > 0) {
                    fps = 1000 / (timestamp - lastUpdate);
                    object.rotation.x +=  diff / (time / (1000 / fps)) * direction;
                    angleX = object.rotation.x;
                }
                if (direction > 0 && angleX - angleTargX < 0) {
                    window.requestAnimationFrame(step);
                }
                else if (direction < 0 && angleTargX * direction - angleX  < 0) {
                    window.requestAnimationFrame(step);
                }
                lastUpdate = timestamp;
            }
            step();
        },
        "rotation-y": function (object, declaration) {
            var angleY = parseFloat(object.rotation.y);
            var angleTargY = (parseFloat(declaration.valueText.split(",")[0]) / 360) * 2 * Math.PI;
            var time = parseInt(declaration.valueText.split(",")[1]);
            var diff = Math.abs(Math.abs(angleY)- Math.abs(angleTargY)) * 0.9;
            var direction = 1;
            var lastUpdate = 0;
            var fps = 0;
            
            function step(timestamp) {
                if (angleY > angleTargY) {
                    direction *= -1;
                }
                angleY = Math.abs(angleY);
                angleTargY = Math.abs(angleTargY);

                if (lastUpdate > 0) {
                    fps = 1000 / (timestamp - lastUpdate);
                    object.rotation.y +=  diff / (time / (1000 / fps)) * direction;
                    angleY = object.rotation.y;
                }
                if (direction > 0 && angleY - angleTargY < 0) {
                    window.requestAnimationFrame(step);
                }
                else if (direction < 0 && angleTargY * direction - angleY  < 0) {
                    window.requestAnimationFrame(step);
                }
                lastUpdate = timestamp;
            }
            step();;
        },
        "rotation-z": function (object, declaration) {
            var angleZ = parseFloat(object.rotation.z);
            var angleTargZ = (parseFloat(declaration.valueText.split(",")[0]) / 360) * 2 * Math.PI;
            var time = parseInt(declaration.valueText.split(",")[1]);
            var diff = Math.abs(Math.abs(angleZ)- Math.abs(angleTargZ)) * 0.9;
            var direction = 1;
            var lastUpdate = 0;
            var fps = 0;
            
            function step(timestamp) {
                if (angleZ > angleTargZ) {
                    direction *= -1;
                }
                angleZ = Math.abs(angleZ);
                angleTargZ = Math.abs(angleTargZ);

                if (lastUpdate > 0) {
                    fps = 1000 / (timestamp - lastUpdate);
                    object.rotation.z +=  diff / (time / (1000 / fps)) * direction;
                    angleZ = object.rotation.z;
                }
                if (direction > 0 && angleZ - angleTargZ < 0) {
                    window.requestAnimationFrame(step);
                }
                else if (direction < 0 && angleTargZ * direction - angleZ  < 0) {
                    window.requestAnimationFrame(step);
                }
                lastUpdate = timestamp;
            }
            step();
        },
    }
};
threeDCSSTranspiler.init();
