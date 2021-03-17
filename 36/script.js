var c;
var q = new qtnIV();
var qt = q.identity(q.create());

function mouseMove(e) {
    var cw = c.width;
    var ch = c.height;
    var wh = 1 / Math.sqrt(cw * cw + ch * ch);
    var x = e.clientX - c.offsetLeft - cw * 0.5;
    var y = e.clientY - c.offsetTop - ch * 0.5;
    var sq = Math.sqrt(x * x + y * y);
    var r = sq * 2.0 * Math.PI * wh;
    if (sq != 1) {
        sq = 1 / sq;
        x *= sq;
        y *= sq;
    }
    q.rotate(r, [y, x, 0.0], qt);
}

onload = function () {
    c = document.getElementById('canvas');
    c.width = 500;
    c.height = 300;

    var eLines = document.getElementById('lines');
    var eLineStrip = document.getElementById('line_strip');
    var eLineLoop = document.getElementById('line_loop');
    var ePointSize = document.getElementById('point_size');

    c.addEventListener('mousemove', mouseMove, true);

    var eCheck = document.getElementById('check');

    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');

    var v_shader = create_shader('vs');
    var f_shader = create_shader('fs');
    var prg = create_program(v_shader, f_shader);

    var attLocation = new Array();
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'color');

    var attStride = new Array();
    attStride[0] = 3;
    attStride[1] = 4;

    var pointSphere = sphere(16, 16, 2.0);
    var pPos = create_vbo(pointSphere.p);
    var pCol = create_vbo(pointSphere.c);
    var pVBOList = [pPos, pCol];

    var position = [
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, 1.0, 0.0
    ];

    var color = [
        1.0, 1.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];

    var index = [
        0, 1, 2,
        3, 2, 1
    ];
    
	var lPos = create_vbo(position);
	var lCol = create_vbo(color);
	var lVBOList = [lPos, lCol];

    var uniLocation = new Array();
    uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1] = gl.getUniformLocation(prg, 'pointSize');

    var m = new matIV();
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());

    var count = 0;

    (function () {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        count++;
        var rad = (count % 360) * Math.PI / 180;

        var qMatrix = m.identity(m.create());
        q.toMatIV(qt, qMatrix);

        var camPosition = [0.0, 5.0, 10.0];
        m.lookAt(camPosition, [0, 0, 0], [0, 1, 0], vMatrix);
        m.multiply(vMatrix, qMatrix, vMatrix);
        m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
        m.multiply(pMatrix, vMatrix, tmpMatrix);

        var pointSize = ePointSize.value / 10;
        
		set_attribute(pVBOList, attLocation, attStride);
		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniform1f(uniLocation[1], pointSize);
		gl.drawArrays(gl.POINTS, 0, pointSphere.p.length / 3);

        var lineOption = 0;
        if (eLines.checked) { lineOption = gl.LINES; }
        if (eLineStrip.checked) { lineOption = gl.LINE_STRIP; }
        if (eLineLoop.checked) { lineOption = gl.LINE_LOOP; }

        set_attribute(lVBOList, attLocation, attStride);
        m.identity(mMatrix);
        m.rotate(mMatrix, Math.PI / 2, [1, 0, 0], mMatrix);
        m.scale(mMatrix, [3.0, 3.0, 1.0], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.drawArrays(lineOption, 0, position.length / 3);

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

    function create_texture(source, index) {
        var img = new Image();

        img.onload = function () {
            var tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);

            switch (index) {
                case 0:
                    texture0 = tex;
                    break;
                case 1:
                    texture1 = tex;
                    break;
                default:
                    break;
            }
        };

        img.src = source;
    }
};