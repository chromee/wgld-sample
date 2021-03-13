onload = function () {
    var c = document.getElementById('canvas');
    c.width = 1000;
    c.height = 600;

    var elmTransparency = document.getElementById('transparency');
    var elmAdd = document.getElementById('add');
    var elmRange = document.getElementById('range');

    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var v_shader = create_shader('vs');
    var f_shader = create_shader('fs');

    var prg = create_program(v_shader, f_shader);

    var attLocation = new Array();
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'color');
    attLocation[2] = gl.getAttribLocation(prg, 'textureCoord');

    var attStride = new Array();
    attStride[0] = 3;
    attStride[1] = 4;
    attStride[2] = 2;

    var position = [
        -1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ];

	var color = [
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0
	];

	var textureCoord = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];

    var index = [
        0, 1, 2,
        3, 2, 1
    ];

    var vPosition = create_vbo(position);
    var vColor = create_vbo(color);
    var vTextureCoord = create_vbo(textureCoord);
    var VBOList = [vPosition, vColor, vTextureCoord];
    var iIndex = create_ibo(index);

    set_attribute(VBOList, attLocation, attStride);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iIndex);

    var uniLocation = new Array();
    uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1] = gl.getUniformLocation(prg, 'vertexAlpha');
    uniLocation[2] = gl.getUniformLocation(prg, 'texture');
    uniLocation[3] = gl.getUniformLocation(prg, 'useTexture');

    var m = new matIV();
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());

    m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var texture = null;
    create_texture('texture.png');
    gl.activeTexture(gl.TEXTURE0);

    var count = 0;

    (function () {
        if (elmTransparency.checked) { blend_type(0); }
        if (elmAdd.checked) { blend_type(1); }

        var vertexAlpha = parseFloat(elmRange.value / 100);

        gl.clearColor(0.0, 0.75, 0.75, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        count++;
        var rad = (count % 360) * Math.PI / 180;

        // テクスチャ付きポリゴン
        m.identity(mMatrix);
        m.translate(mMatrix, [0.25, 0.25, -0.25], mMatrix);
        m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.disable(gl.BLEND);

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniform1f(uniLocation[1], 1.0);
        gl.uniform1i(uniLocation[2], 0);
        gl.uniform1i(uniLocation[3], true);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

        // 半透明ポリゴン
        m.identity(mMatrix);
        m.translate(mMatrix, [-0.25, -0.25, 0.25], mMatrix);
        m.rotate(mMatrix, rad, [0, 0, 1], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.enable(gl.BLEND);

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniform1f(uniLocation[1], vertexAlpha);
        gl.uniform1i(uniLocation[2], 0);
        gl.uniform1i(uniLocation[3], false);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

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

    function create_texture(source) {
        var img = new Image();

        img.onload = function () {
            var tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

			texture = tex;
			gl.bindTexture(gl.TEXTURE_2D, null);
        };

        img.src = source;
    }

    function blend_type(prm) {
        switch (prm) {
            case 0:
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                break;
            case 1:
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                break;
            default:
                break;
        }
    }
};