onload = function () {
    var c = document.getElementById('canvas');
    c.width = 300;
    c.height = 300;

    var eRange = document.getElementById('range');

    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');

    var v_shader = create_shader('vs');
    var f_shader = create_shader('fs');
    var prg = create_program(v_shader, f_shader);

    var attLocation = new Array();
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'normal');
    attLocation[2] = gl.getAttribLocation(prg, 'color');

    var attStride = new Array();
    attStride[0] = 3;
    attStride[1] = 3;
    attStride[2] = 4;

    var torusData = torus(64, 64, 0.5, 1.5, [0.5, 0.5, 0.5, 1.0]);
    var tPosition = create_vbo(torusData.p);
    var tNormal = create_vbo(torusData.n);
    var tColor = create_vbo(torusData.c);
    var tVBOList = [tPosition, tNormal, tColor];
    var tIndex = create_ibo(torusData.i);
    set_attribute(tVBOList, attLocation, attStride);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndex);

    var uniLocation = new Array();
    uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1] = gl.getUniformLocation(prg, 'mMatrix');
    uniLocation[2] = gl.getUniformLocation(prg, 'invMatrix');
    uniLocation[3] = gl.getUniformLocation(prg, 'lightPosition');
    uniLocation[4] = gl.getUniformLocation(prg, 'eyeDirection');
    uniLocation[5] = gl.getUniformLocation(prg, 'ambientColor');

    var m = new matIV();
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());
    var invMatrix = m.identity(m.create());
    var qMatrix = m.identity(m.create());

    var q = new qtnIV();
    var aQuaternion = q.identity(q.create());
    var bQuaternion = q.identity(q.create());
    var sQuaternion = q.identity(q.create());

    var lightPosition = [15.0, 10.0, 15.0];
    var ambientColor = [0.1, 0.1, 0.1, 1.0];

    var camPosition = [0.0, 0.0, 20.0];
    var camUpDirection = [0.0, 1.0, 0.0];

    m.lookAt(camPosition, [0, 0, 0], camUpDirection, vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);

    var count = 0;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);

    (function () {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        count++;
        var rad = (count % 360) * Math.PI / 180;

        var time = eRange.value / 100;

        q.rotate(rad, [1.0, 0.0, 0.0], aQuaternion);
        q.rotate(rad, [0.0, 1.0, 0.0], bQuaternion);
        q.slerp(aQuaternion, bQuaternion, time, sQuaternion);

        ambientColor = [0.5, 0.0, 0.0, 1.0];
        draw(aQuaternion);
        ambientColor = [0.0, 0.5, 0.0, 1.0];
        draw(bQuaternion);
        ambientColor = [0.0, 0.0, 0.5, 1.0];
        draw(sQuaternion);

        function draw(qtn) {
            q.toMatIV(qtn, qMatrix);
            m.identity(mMatrix);
            m.multiply(mMatrix, qMatrix, mMatrix);
            m.translate(mMatrix, [0.0, 0.0, -5.0], mMatrix);
            m.multiply(tmpMatrix, mMatrix, mvpMatrix);
            m.inverse(mMatrix, invMatrix);

            gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
            gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
            gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
            gl.uniform3fv(uniLocation[3], lightPosition);
            gl.uniform3fv(uniLocation[4], camPosition);
            gl.uniform4fv(uniLocation[5], ambientColor);
            gl.drawElements(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0);
        }
        gl.flush();

        setTimeout(arguments.callee, 1000 / 30);
    })();


    function create_shader(id) {
        var shader;

        var scriptElement = document.getElementById(id);

        if (!scriptElement) { return; }

        switch (scriptElement.type) {
            case 'x-shader/x-vertex':
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
            case 'x-shader/x-fragment':
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default:
                return;
        }

        gl.shaderSource(shader, scriptElement.text);

        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        }
        else {
            alert(gl.getShaderInfoLog(shader));
        }
    }

    function create_program(vs, fs) {
        var program = gl.createProgram();

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);

        gl.linkProgram(program);

        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);

            return program;
        }
        else {
            alert(gl.getProgramInfoLog(program));
        }
    }

    function create_vbo(data) {
        var vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }

    function set_attribute(vbo, attL, attS) {
        for (var i in vbo) {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
            gl.enableVertexAttribArray(attL[i]);
            gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
        }
    }

    function create_ibo(data) {
        var ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }
};