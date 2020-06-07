// 自身のカメラのデフォルト設定
    var CONSTRAINTS = {
      audio: true,
      video: {
        facingMode: { exact: "environment" } // 初期値はリアカメラ
      }  
    };

    //カメラリソース
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
      navigator.mediaDevices.getUserMedia(CONSTRAINTS)
        .then( stream => {
        // 成功時にvideo要素にカメラ映像をセットし、再生
        const videoElm = document.getElementById('my-video')
        videoElm.muted = true;
        videoElm.srcObject = stream;
        videoElm.play();
        // 着信時に相手にカメラ映像を返せるように、グローバル変数に保存しておく
        localStream = stream;
      }).catch( error => {
        // 失敗時にはエラーログを出力
        console.error('mediaDevice.getUserMedia() error:', error);
        return;
      });
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
        const videoElm = document.getElementById('their-video')
        videoElm.srcObject = stream;
        videoElm.play();
      });
    }

    //着信処理
    peer.on('call', mediaConnection => {
      mediaConnection.answer(localStream);
      setEventListener(mediaConnection);
    });