
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

	c.addEventListener('mousemove', mouseMove, true);

	var gl = c.getContext('webgl') || c.getContext('experimental-webgl');

	var eRange = document.getElementById('range');

	var v_shader = create_shader('vs');
	var f_shader = create_shader('fs');
	var prg = create_program(v_shader, f_shader);

	var attLocation = new Array();
	attLocation[0] = gl.getAttribLocation(prg, 'position');
	attLocation[1] = gl.getAttribLocation(prg, 'normal');
	attLocation[2] = gl.getAttribLocation(prg, 'color');
	attLocation[3] = gl.getAttribLocation(prg, 'textureCoord');

	var attStride = new Array();
	attStride[0] = 3;
	attStride[1] = 3;
	attStride[2] = 4;
	attStride[3] = 2;

	var sphereData = sphere(64, 64, 1.0);
	var sPosition = create_vbo(sphereData.p);
	var sNormal = create_vbo(sphereData.n);
	var sColor = create_vbo(sphereData.c);
	var sTextureCoord = create_vbo(sphereData.t);
	var sVBOList = [sPosition, sNormal, sColor, sTextureCoord];
	var sIndex = create_ibo(sphereData.i);
	set_attribute(sVBOList, attLocation, attStride);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sIndex);

	var uniLocation = new Array();
	uniLocation[0] = gl.getUniformLocation(prg, 'mMatrix');
	uniLocation[1] = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[2] = gl.getUniformLocation(prg, 'invMatrix');
	uniLocation[3] = gl.getUniformLocation(prg, 'lightPosition');
	uniLocation[4] = gl.getUniformLocation(prg, 'eyePosition');
	uniLocation[5] = gl.getUniformLocation(prg, 'texture0');
	uniLocation[6] = gl.getUniformLocation(prg, 'texture1');
	uniLocation[7] = gl.getUniformLocation(prg, 'height');

	var m = new matIV();
	var mMatrix = m.identity(m.create());
	var vMatrix = m.identity(m.create());
	var pMatrix = m.identity(m.create());
	var tmpMatrix = m.identity(m.create());
	var mvpMatrix = m.identity(m.create());
	var invMatrix = m.identity(m.create());

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	var texture0 = null;
	var texture1 = null;
	create_texture('texture0.png', 0);
	create_texture('texture1.png', 1);

	var lightPosition = [-10.0, 10.0, 10.0];

	var eyePosition = [0.0, 0.0, 5.0];

	var count = 0;

	(function () {
		count++;

		var rad = (count % 360) * Math.PI / 180;

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		var camUp = new Array();
		q.toVecIII([0.0, 0.0, 5.0], qt, eyePosition);
		q.toVecIII([0.0, 1.0, 0.0], qt, camUp);
		m.lookAt(eyePosition, [0, 0, 0], camUp, vMatrix);
		m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);

		var hScale = eRange.value / 10000;

		m.identity(mMatrix);
		m.rotate(mMatrix, -rad, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		gl.uniform3fv(uniLocation[3], lightPosition);
		gl.uniform3fv(uniLocation[4], eyePosition);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture0);
		gl.uniform1i(uniLocation[5], 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture1);
		gl.uniform1i(uniLocation[6], 1);

		gl.uniform1f(uniLocation[7], hScale);
		gl.drawElements(gl.TRIANGLES, sphereData.i.length, gl.UNSIGNED_SHORT, 0);

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
		} else {

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
		} else {

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

	function create_texture(source, number) {
		var img = new Image();

		img.onload = function () {
			var tex = gl.createTexture();

			gl.bindTexture(gl.TEXTURE_2D, tex);

			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

			gl.generateMipmap(gl.TEXTURE_2D);

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

			switch (number) {
				case 0:
					texture0 = tex;
					break;
				case 1:
					texture1 = tex;
					break;
				default:
					break;
			}

			gl.bindTexture(gl.TEXTURE_2D, null);
		};

		img.src = source;
	}

};
