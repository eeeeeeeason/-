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

- webRTC全称为Web Real-Time Communications，即web实时通讯

- 音视频聊天实现前提，跟直播不一样哦~api类型繁多，有的也过时了，见到有不同的就翻翻MDN，换个方案吧，谷歌需要https或者localhost才能开启媒体权限，火狐则不需要，但做兼容很费工夫。localhost下就自己开两个网页测吧，后面会讲easyrtc
  - 理解websocket连接/websocket算是node.js最繁华的领域了，socket.io简单粗暴https://github.com/socketio/socket.io.git
  - 理解webrtc的工作流程 https://juejin.im/post/5b3f50ca6fb9a04fd65931e1#heading-3
    - stun服务器作用，获取双方ip协助建立连接
    - turn服务器作用，转发音视频
    - 信令服务器作用,利用socket.io实现，主要就是转发音视频聊天双方的软硬件信息ip,设备信息，协助直连或者视频转发

- 简化文章内容介绍，webrtc流程,以下在内网中可以运行
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
    - 2-1.房主createOffer回调中能取到房主的信息desc,音视频结构软硬件信息，储存本地，并且发送到信令服务器，协助转发
    ```js
      let peer = new RTCPeerConnection(servers)
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
    - 2-2.房主createOffer时会触发自身连接的onicecandidate事件,获取candidate，用户地址等
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
    - 2-3.对方在socket中收到offer时，将其设置为远端描述，offer对应的为answer,创建时会触发该用户的onicecandidate事件，能获得到其用户地址信息,此时将描述发给房主
    ```js
      socket.on('offer', function(e) {
        getUserMedia(function (stream) {
        let vid1 = document.getElementById('vid1')
        vid1.srcObject = stream
        vid1.onloadedmetadata = function(e) {
          vid1.play();
        };
        pc.addStream(stream)
        var json = JSON.parse(e) 
        pc.setRemoteDescription(new RTCSessionDescription(json.data.sdp));
        pc.createAnswer(sendAnswer, function (error) {
          console.log('创建answer失败')
        })
        }, function (error) {
          console.log('摄像头获取失败', '接听视频失败');
        })
      })
      function sendAnswer(desc) {
        pc.setLocalDescription(desc);
        socket.emit('answer', JSON.stringify({
          type: '_answer',
          data: {
            sdp: desc
          }
        }))
      }
    ```
    - 2-4.房主在接收answer的socket事件中将其设置为远端描述
    ```js
      socket.on('answer', async function(e) {
        let data = e.message
        await peer.setRemoteDescription(data)
      })
    ```

- 外网实现点对点音视频聊天 ICE(结合stun,turn进行穿透获取音视频双方地址)

  - STUN解析
    - 但现实中我们的视频通话,不可能局限在内网，可能会在防火墙，NAT之后，点对点连接之前，我们需要检测是否能进行，该技术称为NAT穿透，通常基于UDP协议，如RFC3489。在新的RFC5389中支持了TCP穿透
  - TURN解析
    - TURN使用中继穿透NAT:STUN的扩展，跟STUN一样都是通过修改应用层中的私网地址达到NAT穿透的效果，异同点是TURN是通过两方通讯的“中间人”方式实现穿透。就有点像服务器转发音视频流的意思，在STUN失败时会走TURN
  - NAT作用是啥
    - 为了缓解全球ip不足，NAT可以将内网的私有地址转为外网的共有地址，从而可以进行internet访问
    - 防止外部主机攻击内部主机
  - 当然前端开发是不熟悉这些的，阅读多篇RTC博客得知谷歌开源了stun,coturn相关的服务，只需要将依赖安装，账号密码加密设置即可使用参考文献https://www.cnblogs.com/idignew/p/7440048.html
  - 配置完毕coturn后测试地址，返回有relay属性为服务器地址证明成功https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
  - 
![](https://user-gold-cdn.xitu.io/2018/8/16/1654308b6337c351?w=1055&h=675&f=png&s=79402)

- easyRTC

  - 经过多次测试，自己的RTCdemo兼容性差，目前测试阶段就不手写了。采用了easyRTC，除了safari和古董ie不行，其他方面还是ok的。https://github.com/priologic/easyrtc.git

  - 
![](https://user-gold-cdn.xitu.io/2018/8/16/1654308d9329a386?w=510&h=248&f=png&s=41193)

  - 注意采用beta分支，为最新的项目

    

    
