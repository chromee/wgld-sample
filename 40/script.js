
onload = function () {
	var c = document.getElementById('canvas');
	c.width = 512;
	c.height = 512;

	var gl = c.getContext('webgl') || c.getContext('experimental-webgl');

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

	var cubeData = cube(2.0, [1.0, 1.0, 1.0, 1.0]);
	var cPosition = create_vbo(cubeData.p);
	var cNormal = create_vbo(cubeData.n);
	var cColor = create_vbo(cubeData.c);
	var cTextureCoord = create_vbo(cubeData.t);
	var cVBOList = [cPosition, cNormal, cColor, cTextureCoord];
	var cIndex = create_ibo(cubeData.i);

	var earthData = sphere(64, 64, 1.0, [1.0, 1.0, 1.0, 1.0]);
	var ePosition = create_vbo(earthData.p);
	var eNormal = create_vbo(earthData.n);
	var eColor = create_vbo(earthData.c);
	var eTextureCoord = create_vbo(earthData.t);
	var eVBOList = [ePosition, eNormal, eColor, eTextureCoord];
	var eIndex = create_ibo(earthData.i);

	var uniLocation = new Array();
	uniLocation[0] = gl.getUniformLocation(prg, 'mMatrix');
	uniLocation[1] = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[2] = gl.getUniformLocation(prg, 'invMatrix');
	uniLocation[3] = gl.getUniformLocation(prg, 'lightDirection');
	uniLocation[4] = gl.getUniformLocation(prg, 'useLight');
	uniLocation[5] = gl.getUniformLocation(prg, 'texture');

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
	gl.activeTexture(gl.TEXTURE0);

	var fBufferWidth = 512;
	var fBufferHeight = 512;
	var fBuffer = create_framebuffer(fBufferWidth, fBufferHeight);

	var count = 0;

	(function () {
		count++;

		var rad = (count % 360) * Math.PI / 180;
		var rad2 = (count % 720) * Math.PI / 360;

		gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		set_attribute(eVBOList, attLocation, attStride);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eIndex);

		var lightDirection = [-1.0, 2.0, 1.0];

		m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
		m.perspective(45, fBufferWidth / fBufferHeight, 0.1, 100, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);

		gl.bindTexture(gl.TEXTURE_2D, texture1);
		m.identity(mMatrix);
		m.scale(mMatrix, [50.0, 50.0, 50.0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		gl.uniform3fv(uniLocation[3], lightDirection);
		gl.uniform1i(uniLocation[4], false);
		gl.uniform1i(uniLocation[5], 0);
		gl.drawElements(gl.TRIANGLES, earthData.i.length, gl.UNSIGNED_SHORT, 0);

		gl.bindTexture(gl.TEXTURE_2D, texture0);
		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		gl.uniform1i(uniLocation[4], true);
		gl.drawElements(gl.TRIANGLES, earthData.i.length, gl.UNSIGNED_SHORT, 0);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.clearColor(0.0, 0.7, 0.7, 1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		set_attribute(cVBOList, attLocation, attStride);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cIndex);

		gl.bindTexture(gl.TEXTURE_2D, fBuffer.t);

		lightDirection = [-1.0, 0.0, 0.0];

		m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
		m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);

		m.identity(mMatrix);
		m.rotate(mMatrix, rad2, [1, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		gl.drawElements(gl.TRIANGLES, cubeData.i.length, gl.UNSIGNED_SHORT, 0);

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

	function create_framebuffer(width, height) {
		var frameBuffer = gl.createFramebuffer();

		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

		var depthRenderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);

		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

		var fTexture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, fTexture);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		return { f: frameBuffer, d: depthRenderBuffer, t: fTexture };
	}

};