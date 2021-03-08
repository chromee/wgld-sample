onload = function () {
    var c = document.getElementById('canvas');
    c.width = 500;
    c.height = 300;

    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var v_shader = create_shader('vs');
    var f_shader = create_shader('fs');

    var prg = create_program(v_shader, f_shader);

    var attLocation = new Array(2);
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'normal');
    attLocation[2] = gl.getAttribLocation(prg, 'color');

    var attStride = new Array(2);
    attStride[0] = 3;
    attStride[1] = 3;
    attStride[2] = 4;

    var torusData = torus(32, 32, 1.0, 2.0);
    var position = torusData[0];
    var normal = torusData[1];
    var color = torusData[2];
    var index = torusData[3];

    var pos_vbo = create_vbo(position);
    var nor_vbo = create_vbo(normal);
    var col_vbo = create_vbo(color);

    set_attribute([pos_vbo, nor_vbo, col_vbo], attLocation, attStride);

    var ibo = create_ibo(index);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

    var uniLocation = new Array();
    uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1] = gl.getUniformLocation(prg, 'invMatrix');
    uniLocation[2] = gl.getUniformLocation(prg, 'lightDirection');
    uniLocation[3] = gl.getUniformLocation(prg, 'ambientColor');

    // minMatrix.js を用いた行列関連処理
    // matIVオブジェクトを生成
    var m = new matIV();

    // 各種行列の生成と初期化
    var mMatrix = m.identity(m.create());
    var vMatrix = m.identity(m.create());
    var pMatrix = m.identity(m.create());
    var tmpMatrix = m.identity(m.create());
    var mvpMatrix = m.identity(m.create());
    var invMatrix = m.identity(m.create());

    // ビュー×プロジェクション座標変換行列
    m.lookAt([0.0, 0.0, 20.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);

    var lightDirection = [0.5, 0.5, -0.5];
    var ambientColor = [0.1, 0.1, 0.1, 1.0];

    // カウンタの宣言
    var count = 0;

    // 恒常ループ
    (function () {
        // canvasを初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // カウンタをインクリメントする
        count++;

        // カウンタを元にラジアンを算出
        var rad = (count % 360) * Math.PI / 180;

        // モデル座標変換行列の生成(Y軸による回転)
        m.identity(mMatrix);
        m.rotate(mMatrix, rad, [0, 1, 1], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);

        m.inverse(mMatrix, invMatrix);

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(uniLocation[1], false, invMatrix);
        gl.uniform3fv(uniLocation[2], lightDirection);
        gl.uniform4fv(uniLocation[3], ambientColor);

        // インデックスを用いた描画命令
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

        // コンテキストの再描画
        gl.flush();

        // ループのために再帰呼び出し
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
            // バッファをバインドする
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);

            // attributeLocationを有効にする
            gl.enableVertexAttribArray(attL[i]);

            // attributeLocationを通知し登録する
            gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
        }
    }

    function create_ibo(data) {
        // バッファオブジェクトの生成
        var ibo = gl.createBuffer();

        // バッファをバインドする
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

        // バッファにデータをセット
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);

        // バッファのバインドを無効化
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        // 生成したIBOを返して終了
        return ibo;
    }

    function torus(row, column, irad, orad) {
        var pos = new Array(), nor = new Array(),
            col = new Array(), idx = new Array();
        for (var i = 0; i <= row; i++) {
            var r = Math.PI * 2 / row * i;
            var rr = Math.cos(r);
            var ry = Math.sin(r);
            for (var ii = 0; ii <= column; ii++) {
                var tr = Math.PI * 2 / column * ii;
                var tx = (rr * irad + orad) * Math.cos(tr);
                var ty = ry * irad;
                var tz = (rr * irad + orad) * Math.sin(tr);
                var rx = rr * Math.cos(tr);
                var rz = rr * Math.sin(tr);
                pos.push(tx, ty, tz);
                nor.push(rx, ry, rz);
                var tc = hsva(360 / column * ii, 1, 1, 1);
                col.push(tc[0], tc[1], tc[2], tc[3]);
            }
        }
        for (i = 0; i < row; i++) {
            for (ii = 0; ii < column; ii++) {
                r = (column + 1) * i + ii;
                idx.push(r, r + column + 1, r + 1);
                idx.push(r + column + 1, r + column + 2, r + 1);
            }
        }
        return [pos, nor, col, idx];
    }

    function hsva(h, s, v, a) {
        if (s > 1 || v > 1 || a > 1) { return; }
        var th = h % 360;
        var i = Math.floor(th / 60);
        var f = th / 60 - i;
        var m = v * (1 - s);
        var n = v * (1 - s * f);
        var k = v * (1 - s * (1 - f));
        var color = new Array();
        if (!s > 0 && !s < 0) {
            color.push(v, v, v, a);
        } else {
            var r = new Array(v, n, m, m, k, v);
            var g = new Array(k, v, v, n, m, m);
            var b = new Array(m, m, k, v, v, n);
            color.push(r[i], g[i], b[i], a);
        }
        return color;
    }
};