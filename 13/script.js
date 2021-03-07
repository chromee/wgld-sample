onload = function(){
    var m = new matIV();
    var Matrix = m.identity(m.create());
    m.translate(Matrix, [1.0, 0.0, 0.0], Matrix);
    
    var mMatrix = m.identity(m.create());   // モデル変換行列
    var vMatrix = m.identity(m.create());   // ビュー変換行列
    var pMatrix = m.identity(m.create());   // プロジェクション変換行列
    var mvpMatrix = m.identity(m.create()); // 最終座標変換行列

    console.log(Matrix)
};