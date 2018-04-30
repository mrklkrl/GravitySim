//Michael Cole Final Exam
//LSU ID 891477738


//html5 canvas and it's context
var canvas;
var gl;

//Buffers within the gpu
var positionBuffer;
var triangleBuffer;
var normalBuffer;

//shader and model objects
var lightingShader;
var chestModel;

//mouse interaction variable 
var modelRotationX = 0;
var modelRotationY = 0;
var dX = 0;
var dY = 0;
var rotX = 0;
var rotY = 0;

//animation stuff
var lastTime;
var cycleTime = 0;
var currentTime;
var deltaTime;
var upTime =0;
var center = [0, 0, 0]; 
var velocity = 0;
var acceleration = -9.8;
var newCycle = true;
var down = false;
var force = [0 , 0 , 0];
var xForce;
var yForce; 
var zForce;

function ballShoot(deltaTime)
{

    if (down == true)
    {
        if (newCycle == true)
        {
            cycleTime = 0;
            newCycle = false;
        }
        if (center[1] <= -1.0)
        { 
            velocity = velocity * .8;
            upTime = 0;
            down = false;
        }
        velocity -= (acceleration * cycleTime);
        center[1] -= (velocity * cycleTime);
        cycleTime += deltaTime;
    }
    else if (down == false)
    {
        if (velocity < 0.1)
        {
            yMax = center[1];
            newCycle = true;
            down = true;
        }
        upTime = cycleTime - upTime;
        velocity += (acceleration * upTime);
        center[1] += (velocity * upTime);
        upTime += deltaTime;
    }

    rotX += force[1] * force[1];
    rotY += force[0] * force[0];

    force[0] = force[0] * .999;
    force[1] = force[1] * .98;
    force[2] = force[2] * .9999; 

    for (var i=0; i<3; i++)
    {
      center[i] += force[i];
    }
}

//creates a new shader object, assigns locations for attributes and uniforms and enables them
function Shader(vertexId, fragmentId) 
{
    this.program = createProgram(gl, document.getElementById(vertexId).text, document.getElementById(fragmentId).text);
                                    
    this.vertexPositionLocation = gl.getAttribLocation(this.program, "vertexPosition");
    this.vertexNormalLocation = gl.getAttribLocation(this.program, "vertexNormal");
    this.vertexTexCoordLocation = gl.getAttribLocation(this.program, "vertexTexCoord");
                                    
    this.modelMatrixLocation = gl.getUniformLocation(this.program, 'modelMatrix');
    this.viewMatrixLocation = gl.getUniformLocation(this.program, 'viewMatrix');
    this.projectionMatrixLocation = gl.getUniformLocation(this.program, 'projectionMatrix');
    this.lightColorLocation = gl.getUniformLocation(this.program, 'lightColor');
    this.lightPositionLocation = gl.getUniformLocation(this.program, 'lightPosition');
        
    gl.enableVertexAttribArray(this.vertexPositionLocation);
    gl.enableVertexAttribArray(this.vertexNormalLocation);
    gl.enableVertexAttribArray(this.vertexTexCoordLocation);
}

//allows us to use a specified shader program 
Shader.prototype.use = function(projectionMatrix, viewMatrix, modelMatrix) {
    gl.useProgram(this.program);
        
    gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix.elements);
    gl.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix.elements);
    gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix.elements);
        
    gl.uniform3f(this.lightColorLocation, 1.0 , 1.0, 1.0);
    gl.uniform4f(this.lightPositionLocation, 2, 3, 5, 1.0);
}

//creates an object model
function Model(model) {
    //creates buffers in the gpu
    this.positionBuffer = gl.createBuffer();
    this.triangleBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    this.texCoordBuffer = gl.createBuffer();
           
       var positions =[];
       
        for(var i = 0 ; i < model.positions.length ; i++){
          for(var j = 0 ; j < 3; j++)
          positions.push(model.positions[i][j]/19);
      }
       //Takes the positions from cube.js and flattens the array
    this.positionArray = new Float32Array(positions);
    //Binds position buffer and fills it with data from the array in the model file
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.positionArray, gl.STATIC_DRAW);
       
    //repeat for normals, tex coords, and triangles
    this.normalArray = new Float32Array(flatten(model.normals));         
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normalArray, gl.STATIC_DRAW);

    this.texCoordArray = new Float32Array(flatten(model.texCoords));
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.texCoordArray, gl.STATIC_DRAW);   

    this.triangleArray = new Uint16Array(flatten(model.triangles));    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleArray, gl.STATIC_DRAW);  
}

//renders the model. A shader object, along with transformation coordinates are accepted as arguments
Model.prototype.draw = function (currentShader) {
    currentTime = Date.now();
    deltaTime = (currentTime - lastTime)*.00005;
    //translation matrices
    var viewMatrix = new Matrix4();
    var projectionMatrix = new Matrix4(); 
    var modelMatrix = new Matrix4();   

    ballShoot(deltaTime);

    //Moves the model away on the z axis
    viewMatrix.translate(0,0,-5);
        
    //FOV, ratio, closest render point, fartherst r.p.)
    projectionMatrix.perspective(45, 1, 1, 150);

    //moves the model on the screen
    modelMatrix.translate(center[0], center[1] , center[2]);
    modelMatrix.rotate(force[1]*1000, 1, 0, 0);
    modelMatrix.rotate(force[0]*1000, 0, 1, 0);

    //activate the shader specified in the argument and bind attribute data
    currentShader.use(projectionMatrix, viewMatrix, modelMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);     
    gl.vertexAttribPointer(currentShader.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
        
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(currentShader.vertexNormalLocation,3,gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(currentShader.vertexTexCoordLocation, 2, gl.FLOAT, false, 0, 0);
    //draw the primitives
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.drawElements(gl.TRIANGLES, this.triangleArray.length, gl.UNSIGNED_SHORT, 0)
    //
    lastTime = currentTime;
    requestAnimationFrame(draw);
}

//takes an image and loads it onto the gpu as a texture
function loadTexture(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    requestAnimationFrame(draw);
}

//initializes canvas, creates shader objects and model objects
function init(){
        
    //Grabs the canvas from the html document
    canvas = document.getElementById("webgl");
    gl = getWebGLContext(canvas, false);

    //create a new texture on the gpu
    var modelTexture = gl.createTexture();
    
    //inverts texture image along y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    
    //create a new image object and retreieve it from the internet
    var modelImage = new Image();
    modelImage.crossOrigin = "anonymous";
    modelImage.src = "http://i.imgur.com/mGINQzO.jpg";
    
    //when the image is loaded, use this function to load it into a texture
    modelImage.onload = function() {loadTexture(modelImage, modelTexture)}

    //create new model and shader
    Alduin = new Model(demon);
    lightingShader = new Shader("vertexShader", "lightingFragmentShader");

    //connects the canvas to our mouse function events
    canvas.onmousedown = onmousedown;
    canvas.onmouseup = onmouseup;
    canvas.onmousemove = onmousemove;
       
     //Enables checking for Depth
     gl.enable(gl.DEPTH_TEST);

     //Request to draw
     requestAnimationFrame(draw);
}

//transofrm 2d array into 1d array
function flatten(a) {
     return a.reduce(function (b, v){ b.push.apply(b,v); return b}, [])
}

//draws the model obects
function draw(){
     //Clears the screen
     gl.clearColor(0.0, 0.0, 0.0, 0.0);
     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

     Alduin.draw(lightingShader);
}

function forces() 
{

    xForce = parseFloat(document.getElementById("xForce").value);
    yForce = parseFloat(document.getElementById("yForce").value);
    zForce = parseFloat(document.getElementById("zForce").value);


    center = [0, -1, 0];
    force = [.01 * xForce,.01 * yForce, -.01 * zForce];
    
    requestAnimationFrame(draw);
}
    
function calcNorm()
{
    var Normals = [];

    var n = [0,0,0];

    for (var i = 0; i < demon.positions.length; i++)
    {
        Normals.push(n);
    }

    for (var j = 0; j < demon.triangles.length; j++)
    {
        var a = sub(demon.positions[demon.triangles[j][1]], demon.positions[demon.triangles[j][0]]);
        var b = sub(demon.positions[demon.triangles[j][2]],demon.positions[demon.triangles[j][0]]);

        a = normalize(a);
        b = normalize(b);

        n = normalize(cross(a,b));

        Normals[demon.triangles[j][0]]   = add(Normals[demon.triangles[j][0]], n);
        Normals[demon.triangles[j][1]] = add(Normals[demon.triangles[j][1]], n);
        Normals[demon.triangles[j][2]] = add(Normals[demon.triangles[j][2]], n);
    }

    for (var k = 0; k < Normals.length; k++)
    {
        n = normalize(n);
    }

    return Normals;
}

    function add(a,b)
    {
        return [  a[0] + b[0], a[1] + b[1], a[2] + b[2] ]; 
    }

    function sub(a,b)
    {
        return [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ]; 
    }

     function dot(a,b)
    {
        var n = 0, lim = Math.min(a.length,b.length);
        for (var i = 0; i < lim; i++) n += a[i] * b[i];
        return n;
     }

    function cross(a,b)
    {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ]; 
    }

    function normalize(a)
    {
        var len = Math.sqrt(dot(a,a));

        return [
            a[0] / len,
            a[1] / len,
            a[2] / len 
        ];
    }
