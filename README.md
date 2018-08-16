# socketIM
- 近一周内完成nodejs基于websocket进行网络通话
  - 步骤分为3步
    - 1.基于websocket进行两端通讯理解
      - 目前已完成音频的单次通讯，将音频文件转为blob在socket.io协助下完成点到服务器，再由服务器广播的功能，但是如何持续通话，保持通话质量还有很多要考虑的点
    - 2.寻找webrtc相关文档
      - https://juejin.im/post/5b3f50ca6fb9a04fd65931e1#heading-3
      - https://www.aliyun.com/jiaocheng/1184422.html?spm=5176.100033.2.6.79YlPV
    - 3.猜测基于webrtc的API准备理解
    - 4.查找是否有相关开源仓库
      - easyrtc ,正在翻看相关文档
      - webRTC.io ,似乎没有成熟demo
      - SimpleWebRTC ,作者已经一年没有维护。准备废弃的案例
 - 目前完成
    - 独立完成了webrtc的内网搭建
    - 找到google开源的corturn转发服务，配置服务需要两个ip暂时没搞懂

#简单剖析webrtc，并结合easyrtc与coturn(stun,turn)服务实现音视频聊天
- 音视频聊天实现前提，跟直播不一样哦~
  - 理解websocket连接/websocket算是node.js最繁华的领域了，socket.io简单粗暴https://github.com/socketio/socket.io.git
  - 理解webrtc的工作流程 https://juejin.im/post/5b3f50ca6fb9a04fd65931e1#heading-3
    - stun服务器作用，获取双方ip协助建立连接
    - turn服务器作用，转发音视频
    - 信令服务器作用,利用socket.io实现，主要就是转发音视频聊天双方的软硬件信息ip,设备信息，协助直连或者视频转发
- 简化文章内容介绍，webrtc流程
  - 0.let peer = new RTCPeerConnection(servers)
  - 1.获取用户音视频媒体，完成这步，即可看到自己的摄像头影像
  ```js
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  }).then((stream) => {
    let video = document.querySelector('#video')
    video.srcObject = stream  // mediaDevices.getUserMedia获取到的音视频流捆绑在video标签上
    video.onloadedmetadata = () => video.play() // 读取数据时进行播放
  })
  ```
  - 2.进行peertopeer点对点连接，
    - 1.房主createOffer回调中能取到房主的信息desc,音视频结构软硬件信息，储存本地，并且发送到信令服务器，协助转发
    ```js
      pc.createOffer(sendOffer, function (error) {
        console.log('发送 offer 失败')
      })
      function sendOffer (desc) {
        console.log('sendOffer')
        pc.setLocalDescription(desc);
        socket.emit('offer', JSON.stringify({
        data: {sdp: desc}
          })
        )
      }
    ```
    - 2.createOffer时会触发自身连接的onicecandidate事件,获取candidate，用户地址等
    ```js
      pc.onicecandidate = function(event) {
        if (event.candidate !== null) {
            socket.emit("_ice_candidate",JSON.stringify({
              type: '_candidate',
              data: {
                candidate: event.candidate
              }
            })
          )
        }
      };
    ```
    - 3.
  ```js
  peer.addIceCandidate(candidate)
  ```

  
