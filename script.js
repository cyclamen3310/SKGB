// 自身のカメラのデフォルト設定
const CONSTRAINTS = {
  audio: true,
  video: {
    facingMode: { exact: "environment" } // 初期値はリアカメラ
  }  
};

//自身のカメラリソース
let localStream = null;

//自身のPeer生成
const peer = (window.peer = new Peer({
  key: "09b3421c-51f8-4448-98b5-0508191f097e",
  debug: 3
}));

//自PeerId取得
peer.on("open", () => {
  document.getElementById('my-id').textContent = peer.id;
});

window.onload = () => {
  let userFront = false;
  
  //自カメラ同期
  syncCamera(userFront);

  //カメラ切替ボタンクリック時のイベント設定
  document.querySelector("#btn-toggle").addEventListener("click", () =>{
    userFront = !userFront;
    syncCamera(userFront);
  });
};

//自身のカメラ
const myVideo = document.getElementById('my-video');
myVideo.style.display = 'none';
//自身の映像用キャンバス
const myCanvas = document.getElementById('myCanvas');
//描画用コンテキスト
const myContext = myCanvas.getContext('2d');
/*
  自身のカメラ同期
*/
function syncCamera(is_front){
  //使用するカメラを決定
  CONSTRAINTS.video.facingMode = is_front ? "user":{ exact: "environment" };

  //今までのカメラを停止
  if(localStream != null)
  {
    localStream.getVideoTracks().forEach((camera) => {camera.stop();})
  };

  // 自身のカメラ映像取得
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
  navigator.mediaDevices.getUserMedia(CONSTRAINTS)
    .then( stream => {
    // 成功時にvideo要素にカメラ映像をセットし、再生
    myVideo.muted = true;
    setVideo(myVideo, stream);
    // 着信時に相手にカメラ映像を返せるように、グローバル変数に保存しておく
    localStream = stream;
    //キャンバスに自身の映像を描画
    drawMyCanvas();
  }).catch( error => {
    // 失敗時にはエラーログを出力
    console.error('mediaDevice.getUserMedia() error:', error);
    return;
  });
}

//video要素の設定をする
function setVideo(_video, _stream){
  //動画を設定
  _video.srcObject = _stream;
  _video.play();
  
  //videoを画面サイズに合わせる
  if(_video.videoHeight != 0 && _video.videoWidth != 0)
  {
    _video.width = window.parent.screen.width;
    _video.height = (_video.videoHeight / _video.videoWidth) * window.parent.screen.width;
  }
}

//自身のカメラの映像をキャンバスに描画
function drawMyCanvas(){
  //キャンバスにカメラ映像を描画
  drawCanvas(myVideo, myCanvas, myContext);
  //クロマキー処理
  chromaKey();
  //ループ
  requestAnimationFrame(drawMyCanvas);
}

//videoの映像をcanvasに描画する
function drawCanvas(_video, _canvas, _context){
  //キャンバスを画面サイズに合わせる
  if(_video.videoHeight != 0 && _video.videoWidth != 0)
  {
    _canvas.width = window.parent.screen.width;
    _canvas.height = (_video.videoHeight / _video.videoWidth) * window.parent.screen.width;
  }
  //描画
  _context.drawImage(_video, 0, 0, _canvas.width, _canvas.height);
}

// 消す色と閾値
let chromaKeyColor = {r: 0, g: 255, b: 0};
let colorDistance = 100;

// クロマキー処理
const chromaKey = function () {
let imageData = myContext.getImageData(0, 0, myCanvas.width, myCanvas.height),
    data = imageData.data;

// dataはUint8ClampedArray
// 長さはcanvasの width * height * 4(r,g,b,a)
// 先頭から、一番左上のピクセルのr,g,b,aの値が順に入っており、
// 右隣のピクセルのr,g,b,aの値が続く
// n から n+4 までが1つのピクセルの情報となる

for (var i = 0, l = data.length; i < l; i += 4) {
    let target = {
            r: data[i],
            g: data[i + 1],
            b: data[i + 2]
        };

    // chromaKeyColorと現在のピクセルの三次元空間上の距離を閾値と比較する
    // 閾値より小さい（色が近い）場合、そのピクセルを消す
    if (getColorDistance(chromaKeyColor, target) < colorDistance) {
        // alpha値を0にすることで見えなくする
        data[i + 3] = 0;
    }
}

// 書き換えたdataをimageDataにもどし、描画する
imageData.data = data;
myContext.putImageData(imageData, 0, 0);
};

//近似色の計算
// r,g,bというkeyを持ったobjectが第一引数と第二引数に渡される想定
const getColorDistance = function (rgb1, rgb2) {
  // 三次元空間の距離が返る
  return Math.sqrt(
      Math.pow((rgb1.r - rgb2.r), 2) +
      Math.pow((rgb1.g - rgb2.g), 2) +
      Math.pow((rgb1.b - rgb2.b), 2)
  );
};

//色選択コントロール
const color = document.getElementById('color');
//色変更で透過色変更
color.addEventListener('change', function () {
    // フォームの値は16進カラーコードなのでrgb値に変換する
    chromaKeyColor = color2rgb(this.value);
});

//カラーコードをrgbに変換
const color2rgb = function (color) {
  color = color.replace(/^#/, '');
  return {
      r: parseInt(color.substr(0, 2), 16),
      g: parseInt(color.substr(2, 2), 16),
      b: parseInt(color.substr(4, 2), 16)
  };
};

//閾値入力コントロール
const distance = document.getElementById('distance');
distance.style.textAlign = 'right';
//閾値変更時
distance.addEventListener('change', function () {
    colorDistance = this.value;
});

//相手のカメラ
const theirVideo = document.getElementById('their-video');
theirVideo.style.display = 'none';
//相手の映像用キャンバス
const theirCanvas = document.getElementById('theirCanvas');
//描画用コンテキスト
const theirContext = theirCanvas.getContext('2d');

//相手のカメラの映像をキャンバスに描画
function drawTheirCanvas(){
  //キャンバスにカメラ映像を描画
  drawCanvas(theirVideo, theirCanvas, theirContext);
  //ループ
  requestAnimationFrame(drawTheirCanvas);
}

// 発信処理
document.getElementById('make-call').onclick = () => {
  const theirID = document.getElementById('their-id').value;
  const mediaConnection = peer.call(theirID, localStream);
  setEventListener(mediaConnection);
};

// イベントリスナを設置する関数
const setEventListener = mediaConnection => {
  mediaConnection.on('stream', stream => {
    // video要素にカメラ映像をセットして再生
    setVideo(theirVideo, stream);
    //キャンバスに相手の映像を描画
    drawTheirCanvas();
  });
}

//着信処理
peer.on('call', mediaConnection => {
  mediaConnection.answer(localStream);
  setEventListener(mediaConnection);
});