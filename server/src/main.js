          var recorder;  
          var timer
            var audio = document.querySelector('audio');  
              
            function startRecording(callback) { 
              if(recorder){
                recorder.start();
                return;
              }
               
              HZRecorder.get(function (rec) {  
                recorder = rec;  
                recorder.start();  
                if (!callback) return
                callback()
              },{error:showError});  
            }  
              
              
            function obtainRecord(){  
              if(!recorder){
                showError("请先录音");
                return;
              }
              var record = recorder.getBlob();  
              if(record.duration!==0){
                //  downloadRecord(record.blob);
                var audio = document.querySelector('audio');  
                audio.src = URL.createObjectURL(record.blob);
                console.log(record.blob)
              }else{
                showError("请先录音")
              }
            };  

            function downloadRecord(record){
              var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a')
                save_link.href = URL.createObjectURL(record);
                var now=new Date;
                save_link.download = now.Format("yyyyMMddhhmmss");
                fake_click(save_link);
            }

       
            function fake_click(obj) {
            var ev = document.createEvent('MouseEvents');
            ev.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            obj.dispatchEvent(ev);
            }

            function getStr(){
              var now=new Date;
              var str= now.toDateString();
            }

            function stopRecord(){  
                recorder&&recorder.stop();  
            };  
            var msg={};
            //发送音频片段
            var msgId=1;
            function send(io,callback){
              
              setInterval(function(){
                
                var time = new Date().toLocaleTimeString()
                console.log('发送音频时间'+time)
                console.log(recorder)
                if(!recorder) {
                  showError("请先录音");
                  return;
                }
                console.log(recorder)
                var data=recorder.getBlob();
                console.log(data)
  
                 //TODO:
                 console.log(io)
                 console.log(data.blob)
                 io.emit('wav', data.blob);
                 console.log(data.blob)
                 if(data.duration==0){
                  showError("请先录音");
                  return;
                 }
                 recorder.clear();
                 console.log('clear是否成功进行')
                 msg[msgId]=data;
                  // if (!callback) return
                  // callback()
                  // console.log(data);
                  var dur=data.duration/10;
                   var str="<div class='warper'><div id="+msgId+" class='voiceItem'>"+dur+"s</div></div>"
                  $(".messages").append(str);
                  msgId++;
              },1000)
            }
            
            $(document).on("click",".voiceItem",function(){
                var id=$(this)[0].id;
                var data=msg[id];
                playRecord(data.blob);
            })

            var ct;
            function showError(msg){
                $(".error").html(msg);
                clearTimeout(ct);
                ct=setTimeout(function() {
                    $(".error").html("")
                }, 3000);
            }


            function playRecord(blob){  
                if(!recorder){
                    showError("请先录音");
                    return;
                }
                 recorder.play(audio,blob);  
            };  
              
            /* 视频 */  
            function scamera() {  
                var videoElement = document.getElementById('video1');  
                var canvasObj = document.getElementById('canvas1');  
                var context1 = canvasObj.getContext('2d');  
                context1.fillStyle = "#ffffff";  
                context1.fillRect(0, 0, 320, 240);  
                context1.drawImage(videoElement, 0, 0, 320, 240);  
            };  
              
            function playVideo(){  
                var videoElement1 = document.getElementById('video1');  
                var videoElement2 = document.getElementById('video2');  
                videoElement2.setAttribute("src", videoElement1);  
            };  
            