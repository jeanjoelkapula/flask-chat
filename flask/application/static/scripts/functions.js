//global variables
var isPickerActive = false;
var selectedChannel = "";
var joined_channels = []
var channels_timestamps = [];
var last_message_date;
var xhttp = new XMLHttpRequest();
var storage = window.localStorage;
var socket = "";

// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];


//toggles side panel
function toggle_panel() {
  var menu = document.getElementById("menu");
  var arrow = document.getElementById("arrow-image");
  
  if (window.getComputedStyle(menu).display == 'none') {
    arrow.src = "../static/images/arrow-left.png";
    $('#menu').toggle('slow');
  }
  else {
    $('#menu').toggle('slow');
    arrow.src = "../static/images/arrow-right.png"
  }
}

//toggles emoji picker
function toggle_emoji_picker(){
  if (isPickerActive == false) {
    $('.emojionearea-editor').trigger( "focus");
    $("#textarea").data("emojioneArea").showPicker();
    isPickerActive = true;
  }
  else {
    $("#textarea").data("emojioneArea").hidePicker();
    isPickerActive = false;
  }
}

// Center modal vertically in window
function centerModal() {
    $(this).css('display', 'flex');
    var $dialog = $(this).find(".modal-dialog");
    var offset = ($(window).height() - $dialog.height()) / 2;
    $dialog.css("margin-top", offset);
}

//toggle modal
$('.modal').on('show.bs.modal', centerModal);
$(window).on("resize", function () {
    $('.modal:visible').each(centerModal);
});

$( document ).ready(function() {
  $('#toggle-button').each(function(i, obj) {
      //obj.style.display = 'none';
  });

});


//read user input files
function readURL(input) {
  if (input.files && input.files[0]) {
      var reader = new FileReader();
      var data = new FormData();
      var panel_icon = document.getElementById('side-panel-user-icon');
      data.append('image', input.files[0]);
      var result = '';
      //set image preview
      reader.onload = function(e) {
          $('#imagePreview').css('background-image', 'url('+e.target.result +')');
          $('#imagePreview').hide();
          $('#imagePreview').fadeIn(650);
          panel_icon.src = e.target.result;
          socket.emit('profile_update_success', {'user': storage.getItem('username'), 'result': e.target.result});
      }

      xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          reader.readAsDataURL(input.files[0]);
        }
      }
      xhttp.open('POST', '/upload_image', true);
      xhttp.send(data);
  }
}

//messages and settings view toggles
$(document).ready(function (){
  $('.side-panel-header').click(function (){
    load_settings_view();
    if (window.innerWidth <= 414) {
      toggle_panel();
    }
  });
  
  $('.back-button').click(function () {
    load_messages_view();
    if (window.innerWidth <= 414) {
      toggle_panel();
    }
  });

});


function load_messages_view() {
  var main_panel = document.getElementById('main-panel');
  var last_channel = storage.getItem('last-channel');
  main_panel.innerHTML = '';
  main_panel.innerHTML = `
    <div class="mesgs">
    <div class="chat-header">
      <div class="image-section">
        <i class="fas fa-users"></i>
      </div>
      <div class="name-section">
        <p id = "chat-header-name">${last_channel}</p>
      </div>
    </div>
    <div id = "arrow-right" class="arrow-right">
        <div id="arrow-right-child">
        <a id = "arrow-link" data-toggle="collapse" href="#menu" role="button" aria-expanded="true" aria-controls="menu"><img src="../static/images/arrow-right.png" onclick="toggle_panel()" id ="arrow-image"></a>
        </div>
        </div>
    <div class="messages-scroll" id="style-15">
      <div class="force-overflow">
        <div class="message-history" id = "message-history">

        </div>
      </div>
    </div>

    <div class="type-message">
      <div class="write-message">
        <textarea id = "textarea" name="name" cols="80" placeholder="Type a message"></textarea>
        <div class="emojionearea-button">
          <i class="fas fa-grin-alt" onclick = "toggle_emoji_picker()"></i>
        </div>
      </div>
      <div class="button-send-section">
        <button class="message-send-button" id = "message-send-button" onclick="send_message()" type="button"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  </div>
  `;
  load_messages();

  //initialize emoji picker
$(document).ready(function () {
  $("#textarea").emojioneArea({
    search: false
  });
});

}

function load_settings_view () {
  var main_panel = document.getElementById('main-panel');
  var username = storage.getItem('username');
  var menu = document.getElementById("menu");
  var panel_image = document.getElementById('side-panel-user-icon');
  var theme = storage.getItem('theme');
  var src = ``;

  main_panel.innerHTML= '';
  if (panel_image == null) {
    if (theme.toLocaleLowerCase() == 'light') {
      src = '../static/images/user-icon-light.png'
    }
    else {
      src = '../static/images/user-icon.png';
    }
  }
  else {
    src = panel_image.src;
  }
  main_panel.innerHTML = `
  <div id="settings">
  <div id = "arrow-right" class="arrow-right">
    <div id="arrow-right-child">
      <a id = "arrow-link" data-toggle="collapse" href="#menu" role="button" aria-expanded="true" aria-controls="menu"><img src="../static/images/arrow-right.png" onclick="toggle_panel()" id ="arrow-image"></a>
    </div>
  </div>
  <div class="profile-section">
    
  </div>
  <div class="profile-edit-section">
    
  </div>
  <div class="profile">
    <div class="back-button-section">
      <img src="../static/images/back-button.png" alt="" class = "back-button" onclick="load_messages_view()">
    </div>
    <div class="avatar-upload">
      <div class="avatar-edit">
        <input type='file' id="imageUpload" accept=".png, .jpg, .jpeg" />
        <label for="imageUpload"></label>
      </div>
      <div class="avatar-preview">
        <div id="imagePreview" style="background-image: url(${src});">
        </div>
      </div>
    </div>
    <div class="username-section">
      <h1>${username}</h1>
    </div>
    <div class="theme-section">
      <div class="">
        <h5>Color theme</h5>
      </div>
      <div class="container-login100-form-btn">
          <button class="switch-button" onclick= "change_theme()" type= "button">
            ${theme.toUpperCase()}
          </button>
      </div>
    </div>
  </div>
</div>
  `;

  //set side panel user user icon
  var image_preview = document.getElementById('imagePreview');
  if (panel_image == null) {
    image_preview.style.backgroundSize = 'unset';
  }
  else {
    image_preview.style.backgroundSize = 'cover';
  }

  $("#imageUpload").change(function() {
    readURL(this);
  });

  var arrow = document.getElementById("arrow-image");
  if (window.getComputedStyle(menu).display == 'none') {
    arrow.src = "../static/images/arrow-right.png";
  }
  else {
    arrow.src = "../static/images/arrow-left.png"
  }

  // $('#arrow-right').hover(function() {
  //   var child = document.getElementById('arrow-right-child');
  //   child.style.visibility = 'visible';

  // });

  // $('#arrow-link').hover(function() {
  //   var child = document.getElementById('arrow-right-child');
  //   child.style.visibility = 'visible';
  // });

  // $('#arrow-right-child').hover(function() {
  //   var child = document.getElementById('arrow-right-child');
  //   child.style.visibility = 'visible';
  // });
  // $('#arrow-right').mouseout(function () {
  //   var child = document.getElementById('arrow-right-child');
  //   child.style.visibility = 'hidden';
  // });

  // $('#arrow-link').mouseout(function () {
  //   var child = document.getElementById('arrow-right-child');
  //   child.style.visibility = 'hidden';
  // });
}

function change_theme() {

  var button = $('.switch-button')[0];
  var theme = storage.getItem('theme');
  var data = new FormData();

  if (theme.toLocaleLowerCase() == 'dark') {
    button.style.background = 'rgb(202, 30, 208)';
    data.append('theme', 'light');
  }
  else {
    data.append('theme', 'dark');
    button.style.background = 'rgb(19, 22, 48)';
    
  }

  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
    
      url = JSON.parse(this.responseText).url;
      var t = JSON.parse(this.responseText).theme;
      storage.setItem('theme', t);
      window.location.href = url;
    }

    if (this.readyState == 4 && this.status == 500) {
      alert('An error has occured while updating the theme');
    }
  }
  xhttp.open('POST', '/theme', true);
  xhttp.send(data);
  button.style.transition = 'all 0.3s ease-in 0s';  
}

//change direction of toggle arrow button
$(document).ready(function () {
  var menu = document.getElementById("menu");
  var arrow = document.getElementById("arrow-image");

  if (menu != null) {
    if (window.getComputedStyle(menu).display == 'none') {
      arrow.src = "../static/images/arrow-right.png";
    }
    else {
      arrow.src = "../static/images/arrow-left.png";
    }
}
});


$(document).ready(function () {
  // $('#arrow-right').hover(function() {
  //   var child = document.getElementById('arrow-right-child');
  //   child.style.visibility = 'visible';

  // });

  // $('#arrow-link').hover(function() {
  //   var child = document.getElementById('arrow-right-child');
  //   child.style.visibility = 'visible';
  // });

  // $('#arrow-right-child').hover(function() {
  //   var child = document.getElementById('arrow-right-child');
  //   child.style.visibility = 'visible';
  // });
  // $('#arrow-right').mouseout(function () {
  //   var child = document.getElementById('arrow-right-child');
  //   child.style.visibility = 'hidden';
  // });

  // $('#arrow-link').mouseout(function () {
  //   var child = document.getElementById('arrow-right-child');
  //   child.style.visibility = 'hidden';
  // });
});

//load list of joined channels
$(document).ready(function (){
  if (storage.getItem('joined-channels') != null) {
    joined_channels = storage.getItem('joined-channels').split(',');
  }
  
});

//Socket connection
document.addEventListener('DOMContentLoaded', () => {
  socket = io.connect(location.protocol + '//' + location.hostname + ':' + location.port);

  //get list of channels
  var channel_list_elements = document.getElementsByClassName('channel-list-item');
  var channels_array = [];
  var channel_form_data = new FormData();

  for(var i = 0; i < channel_list_elements.length; ++i) {
    var name = channel_list_elements[i].dataset.channel + '';
    var channel = {};
    console.log('after dom loaded ' + storage.getItem(name + 'stamp'));
    channels_array.push({[name]:storage.getItem(name + 'stamp')});
  }

  channel_form_data.append('channels', JSON.stringify(channels_array));

  //request unread count for each channel
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {

      for(var i = 0; i < channel_list_elements.length; ++i) {
        var name = channel_list_elements[i].dataset.channel;
        var count = JSON.parse(this.responseText)[name];
        var badge = document.getElementById('badge-' + name);
        if (count != 0) {
          badge.innerHTML = count;
        }
      }
    }

    if (this.readyState == 4 && this.status == 500) {
        console.log('unread count was unsuccesful');
    }
  }
  xhttp.open('POST', '/unread_counts', true);
  xhttp.send(channel_form_data);

  socket.on('connect', ()=> {
    var modal2 = document.getElementById('join-modal');
    var span = document.getElementById('channel-name-span');

    socket.emit('user_connection', {'joined-channels': storage.getItem('joined-channels')});
    console.log(storage.getItem('joined-channels'));
    document.querySelectorAll('.channel-list-item').forEach(item => {
       item.onclick = () => {
           const channel = item.dataset.channel;
           var found = false;
           joined_channels.forEach(item => {
             if (channel == item) {
               found = true;             
             }
           });
           if (found == false) {
              span.innerHTML = channel;
              modal2.style.display = 'flex';
           }
           else {
            var theme = storage.getItem('theme');
    
            if (theme == 'dark' || theme == 'Dark') {
              document.getElementsByName(storage.getItem('last-channel'))[0].style.background = 'rgb(7, 10, 29)';
              storage.setItem('last-channel', channel);
              document.getElementsByName(storage.getItem('last-channel'))[0].style.background = 'rgb(38, 10, 57)';
            }
            else {
              document.getElementsByName(storage.getItem('last-channel'))[0].style.background = 'white';
              document.getElementsByName(storage.getItem('last-channel'))[0].style.color = 'rgb(7, 10, 29)';
              storage.setItem('last-channel', channel);
              document.getElementsByName(storage.getItem('last-channel'))[0].style.background = 'rgb(7, 10, 29)';
              document.getElementsByName(storage.getItem('last-channel'))[0].style.color = 'white';
            }
             load_messages_view();
             var badge = document.getElementById('badge-' + item.dataset.channel);
             badge.innerHTML = '';
           }          
       };
     });
  });

  socket.on('announce_message', data => {
    console.log('message received');
    data = JSON.parse(data);
    
    if (data.channel == storage.getItem('last-channel')) {
      var message_history = document.getElementById('message-history');

      if (last_message_date < new Date(new Date().toShortFormat())) {
        var div = document.createElement('div');
        last_message_date = new Date().toShortFormat();
        div.innerHTML = `
          <div class="date-join-bubble-container" id= "date-join-bubble-container">
            <div class="date-join-bubble">
              <p>${last_message_date}</p>
            </div>
          </div>
        `;
         message_history.appendChild(div);
      }

      //add message bubble
      var div = document.createElement('div');
     
      if (data.author == storage.getItem('username')) {

        div.innerHTML = `
        <div class="msg">
        
        <div class="bubble">
              <div class="txt">
                  <span class="name">${data.author}</span>
                  <span class="timestamp"> ${data.time}</span>
                  <span class="message">
                    ${data.text}
                  </span>
                </div>
              <div class="bubble-arrow" id ="b"></div>
            </div>
            <div class = "in-chat-user-icon ${data.author} image-alt"></div>
          </div>
      `;

        $(div).find('.bubble').addClass('alt');
        $(div).find('.bubble-arrow').addClass('alt');
      }
      else {
    
        div.innerHTML = `
          <div class="msg">
          <div class = "in-chat-user-icon ${data.author}"></div>
          <div class="bubble">
                <div class="txt">
                    <span class="name">${data.author}</span>
                    <span class="timestamp"> ${data.time}</span>
                    <span class="message">
                      ${data.text}
                    </span>
                  </div>
                <div class="bubble-arrow" id ="b"></div>
              </div>
            </div>
        `;
      }
      message_history.appendChild(div);
      storage.setItem(data.channel + 'stamp', toDateTime(new Date()));
      var elements = document.getElementsByClassName(data.author); 
      if (data.hasProfile == 'true') {        
        elements[elements.length -1].innerHTML = `<img src="../static/profile_images/${data.author}${data.extension}" id="side-panel-user-icon"> `;
      }
      else { 
        elements[elements.length -1].innerHTML = `<i class="fas fa-user"></i>`;
      }
      document.getElementsByClassName('emojionearea-editor')[0].textContent='';
      document.getElementById('textarea').value = '';
      $('.messages-scroll').scrollTop($('#message-history').height());
      //$('.messages-scroll').animate({ scrollTop: $('#message-history').height()}, 1000);
    }
    else {
      var badge = document.getElementById('badge-' + data.channel);
      if (badge.innerHTML != '') {
        badge.innerHTML = (parseInt(badge.innerHTML, 10) + 1);
        console.log('em');
      }
      else {
        badge.innerHTML = '1';
        console.log('v');
      }
      console.log('not last channel');
    }
  });

  socket.on('channel_created', data => {
    var modal = document.getElementById("myModal");
    var modal2 = document.getElementById('join-modal');
    var span = document.getElementById('channel-name-span');
    var channel_name = document.getElementById('channel-input').value.trim();
    var error_message = document.getElementById('channel-error-paragraph');
    var channel_error_section = document.getElementById('channel-creation-error');
    var channel_error_paragrah = document.getElementById('channel-error-paragraph');

    if (data['success'] == true) {
      var channel_list = document.getElementsByClassName('channel-list')[0];
      var div = document.createElement('div');
      div.innerHTML = `
        <li class="channel-list-item" name = "${data.channel}" data-channel = "${data.channel}">${data['channel']}<span class="badge badge-light" id = "badge-${data.channel}"></span></li>
      `;

      channel_list.appendChild(div);
      storage.setItem(data.channel + 'stamp', toDateTime(new Date())); 
      div.onclick = () => {
           var channel = data['channel']; 
           var found = false; 
           var theme = storage.getItem('theme');
           joined_channels.forEach(item => {
             if (channel == item) {
               found = true;             
             }
           });
           if (found == false) {
             span.innerHTML = data.channel;
             modal2.style.display = 'flex';
           }
           else {
            const channel = document.getElementsByName(`${data.channel}`)[0].dataset.channel;
        
            if (theme.toLocaleLowerCase() == 'dark') {
              document.getElementsByName(storage.getItem('last-channel'))[0].style.background = 'rgb(7, 10, 29)';
              storage.setItem('last-channel', channel);
              document.getElementsByName(storage.getItem('last-channel'))[0].style.background = 'rgb(38, 10, 57)';
            }
            else {
              document.getElementsByName(storage.getItem('last-channel'))[0].style.background = 'white';
              document.getElementsByName(storage.getItem('last-channel'))[0].style.color = 'rgb(7, 10, 29)';
              storage.setItem('last-channel', channel);
              document.getElementsByName(storage.getItem('last-channel'))[0].style.background = 'rgb(7, 10, 29)';
            }

            load_messages_view();
           }
           
       };
      modal.style.display = "none";
      channel_name.value = '';
    }
    else {
      channel_error_section.style.display = 'block';
      channel_error_paragrah.innerHTML = data['message'];
    }
  });

  socket.on('join_success', data => {
    joined_channels.push(data['channel']);
    storage.setItem(data.channel + 'stamp', toDateTime(new Date(data.date)));
    storage.setItem('joined-channels', joined_channels);  
    const channel = document.getElementsByName(`${data.channel}`)[0].dataset.channel;
    var theme = storage.getItem('theme');
    if (theme.toLocaleLowerCase() == 'dark') {
      document.getElementsByName(storage.getItem('last-channel'))[0].style.background = 'rgb(7, 10, 29)';
    }
    else {
      document.getElementsByName(storage.getItem('last-channel'))[0].style.background = 'white';
      document.getElementsByName(storage.getItem('last-channel'))[0].style.color = 'rgb(7,10,29)';
    }
    storage.setItem('last-channel', channel);
    load_messages();
  });

  socket.on('user_joined', data => {
    var div = document.createElement('div');
    var text = data['username'] + ' has joined';

    if (data.channel == storage.getItem('last-channel')) {
      var message_history = document.getElementById('message-history');
      if (last_message_date < new Date(new Date().toShortFormat())) {
        var div = document.createElement('div');
        last_message_date = new Date().toShortFormat();
        div.innerHTML = `
          <div class="date-join-bubble-container" id= "date-join-bubble-container">
            <div class="date-join-bubble">
              <p>${last_message_date}</p>
            </div>
          </div>
        `;
         message_history.appendChild(div);
      }

      var div = document.createElement('div');
        div.innerHTML = `
          <div class="msg">
            <div class="bubble">
              <div class="txt">
                  <span class="name">${data.author}</span>
                  <span class="timestamp"> ${data.time}</span>
                  <span class="message">
                    ${data.text}
                  </span>
                </div>
              <div class="bubble-arrow" id ="b"></div>
            </div>
          </div>
        `;

      if (data.author == storage.getItem('username')) {
        $(div).find('.bubble').addClass('alt');
        $(div).find('.bubble-arrow').addClass('alt');
      }

      message_history.appendChild(div);
      document.getElementsByClassName('emojionearea-editor')[0].textContent='';
      document.getElementById('textarea').value = '';
      $('.messages-scroll').scrollTop($('#message-history').height());

      //$('.messages-scroll').animate({ scrollTop: $('#message-history').height()}, 1000);

    }
  });

  socket.on('announce_profile_update', data => {
    var imgs = $('.' + data['user']).find('img');
    for (var i = 0; i < $('.' + data['user']).find('img').length; ++i) {
      imgs[i].src = data['result'];
    }
  });

  //swipe detection for mobile
// credit: http://www.javascriptkit.com/javatutors/touchevents2.shtml
function swipedetect(el, callback){
  
  var touchsurface = el,
  swipedir,
  startX,
  startY,
  distX,
  distY,
  threshold = 60, //required min distance traveled to be considered swipe
  restraint = 150, // maximum distance allowed at the same time in perpendicular direction
  allowedTime = 800, // maximum time allowed to travel that distance
  elapsedTime,
  startTime,
  handleswipe = callback || function(swipedir){}

  touchsurface.addEventListener('touchstart', function(e){
      var touchobj = e.changedTouches[0]
      swipedir = 'none'
      dist = 0
      startX = touchobj.pageX
      startY = touchobj.pageY
      startTime = new Date().getTime() // record time when finger first makes contact with surface
      e.preventDefault()
  }, false)

  touchsurface.addEventListener('touchmove', function(e){
      e.preventDefault() // prevent scrolling when inside DIV
  }, false)

  touchsurface.addEventListener('touchend', function(e){
      var touchobj = e.changedTouches[0]
      distX = touchobj.pageX - startX // get horizontal dist traveled by finger while in contact with surface
      distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface
      elapsedTime = new Date().getTime() - startTime // get time elapsed
      if (elapsedTime <= allowedTime){ // first condition for awipe met
          if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){ // 2nd condition for horizontal swipe met
              swipedir = (distX < 0)? 'left' : 'right' // if dist traveled is negative, it indicates left swipe
          }
          else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint){ // 2nd condition for vertical swipe met
              swipedir = (distY < 0)? 'up' : 'down' // if dist traveled is negative, it indicates up swipe
          }
      }
      handleswipe(swipedir)
      e.preventDefault()
  }, false)
}

//USAGE:

  var el = document.getElementById('main-panel');
  
  // swipedetect(el, function(swipedir){
  //   // swipedir contains either "none", "left", "right", "top", or "down"
    
  //   if (swipedir == 'right' || swipedir == 'left') {
  //     toggle_panel();
  //   }
  // });
});

//requests addition of new user
function add_user() {

  var username = document.getElementById('space-name').value.trim();
  var login_error_section = document.getElementById('login-error-section');
  var login_error_paragrah = document.getElementById('login-error-paragraph');
  var data = new FormData();
  data.append('username', username);

  if(username != '') {
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
          login_error_paragrah.style.display = 'none';
          storage.setItem('username', username);
          storage.setItem('last-channel', JSON.parse(this.responseText).last_channel);
          joined_channels.push(JSON.parse(this.responseText).last_channel);
          storage.setItem(JSON.parse(this.responseText).last_channel + 'stamp', toDateTime(new Date()));
          console.log("after add user" + storage.getItem(JSON.parse(this.responseText).last_channel + 'stamp'));
          storage.setItem('joined-channels', joined_channels);
          storage.setItem('theme', JSON.parse(this.responseText).theme);
          window.location.href = JSON.parse(this.responseText).path;
      }

      if (this.readyState == 4 && this.status == 500) {
          login_error_section.style.display = 'block';
          login_error_paragrah.innerHTML = JSON.parse(this.responseText).message;
      }
    }
    xhttp.open('POST', '/add_user', true);
    xhttp.send(data);
  }
  else {
    alert('Please choose a username before continuing');
  }
}

//requests messages for selected channel
function load_messages() {
  //variables
  var message_history = document.getElementById('message-history');
  var chat_header_name = document.getElementById('chat-header-name');
  var last_channel = storage.getItem('last-channel');
  var theme = storage.getItem('theme');
  var data = new FormData();
  data.append('last-channel', last_channel);

  if (theme.toLocaleLowerCase == 'light') {
    var user_icon = document.getElementsByClassName('user-image')[0];
    user_icon.style.color = ('rgb(7,10,29');
  }

  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      
      message_history.innerHTML = '';
  
      var messages = JSON.parse(this.responseText.toString()).messages;
      var panel_icon = document.getElementById('side-panel-user-icon');
      chat_header_name.innerHTML = last_channel;
      var last_date = new Date();
      
      var hasProfile = JSON.parse(this.responseText).has_profile;
      var extension = JSON.parse(this.responseText).profile_type;

      //add date bubble 
      if (messages.length != 0) {
        var div = document.createElement('div');
        last_date = new Date(messages[0].date);
        div.innerHTML = `
          <div class="date-join-bubble-container" id= "date-join-bubble-container">
            <div class="date-join-bubble">
              <p>${last_date.toShortFormat()}</p>
            </div>
          </div>
        `;

         message_history.appendChild(div);

      }

      messages.forEach(function (message, index) {
        last_message_date = new Date(message.date);
        var message_date = new Date (message.date);

        //add date bubble
        if (message_date.toShortFormat() > last_date.toShortFormat()) {
          var div = document.createElement('div');
          last_date = new Date(messages[index].date);
          div.innerHTML = `
            <div class="date-join-bubble-container" id= "date-join-bubble-container">
              <div class="date-join-bubble">
                <p>${last_date.toShortFormat()}</p>
              </div>
            </div>
          `;
          message_history.appendChild(div);
        }

         //add message bubble
         var div = document.createElement('div');
     
        if (message.author == storage.getItem('username')) {
          div.innerHTML = `
          <div class="msg">
          
          <div class="bubble">
                <div class="txt">
                    <span class="name">${message.author}</span>
                    <span class="timestamp"> ${message.time}</span>
                    <span class="message">
                      ${message.text}
                    </span>
                  </div>
                <div class="bubble-arrow" id ="b"></div>
              </div>
              <div class = "in-chat-user-icon ${message.author} image-alt"></div>
            </div>
        `;

          $(div).find('.bubble').addClass('alt');
          $(div).find('.bubble-arrow').addClass('alt');
        }
        else {
          div.innerHTML = `
            <div class="msg">
            <div class = "in-chat-user-icon ${message.author}"></div>
            <div class="bubble">
                  <div class="txt">
                      <span class="name">${message.author}</span>
                      <span class="timestamp"> ${message.time}</span>
                      <span class="message">
                        ${message.text}
                      </span>
                    </div>
                  <div class="bubble-arrow" id ="b"></div>
                </div>
              </div>
          `;
        }
        
        message_history.appendChild(div);
        var elements = document.getElementsByClassName(message.author);
        if (message.hasProfile == 'true') {  
          elements[elements.length -1].innerHTML = `<img src="../static/profile_images/${message.author}${message.extension}" id="side-panel-user-icon"> `;
        }
        else { 
          elements[elements.length -1].innerHTML = `<i class="fas fa-user"></i>`;
        }
        
        $('.messages-scroll').scrollTop($('#message-history').height());
        
      });

      //last read message data
      var date = new Date(messages[messages.length-1].date);
      storage.setItem(last_channel + 'stamp', toDateTime(date));


      //set background of channel     
      if (theme == 'dark' || theme == 'Dark') {   
        document.getElementsByName(last_channel)[0].style.background = 'rgb(38, 10, 57)';
      }
      else {  
        document.getElementsByName(last_channel)[0].style.background = 'rgb(7,10,29)';
        document.getElementsByName(last_channel)[0].style.color = 'white';
      }
    }

    if (this.readyState == 4 && this.status == 500) {
        console.log('messages request went wrong');
    }
  }
  xhttp.open('POST', '/load_messages', true);
  xhttp.send(data);
}



// Attaching a new function  toShortFormat()  to any instance of Date() class
Date.prototype.toShortFormat = function() {
  var month_names =["Jan","Feb","Mar",
                    "Apr","May","Jun",
                    "Jul","Aug","Sep",
                    "Oct","Nov","Dec"];

    var day = this.getDate();
    var month_index = this.getMonth();
    var year = this.getFullYear();

    return "" + day + " " + month_names[month_index] + " " + year;
}

function toDateTime(date) {
  var month_names =["Jan","Feb","Mar",
                    "Apr","May","Jun",
                    "Jul","Aug","Sep",
                    "Oct","Nov","Dec"];

    var day = date.getDate();
    var month_index = date.getMonth();
    var year = date.getFullYear();
    var hours = date.getHours()
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();

    return "" + day + " " + month_names[month_index] + " " + year + " " + hours + ":" + minutes + ":" + seconds;
}

//send message to server
function send_message() {
  var message = document.getElementById('textarea').value.trim();
  if (message != '') {
    var date = new Date();
    var time = new Date().toLocaleTimeString('en-US', { hour12: false,
                                             hour: "numeric",
                                             minute: "numeric"});
    var channel = storage.getItem('last-channel');
    var username = storage.getItem('username');
    console.log(date);
    socket.emit('send_message', {'username':username, 'message':message, 'date':toDateTime(date), 'time':time, 'channel':channel});
  }
  else {
    alert('Please type a message to send');
  }
}

function create_channel() { 
  var channel_name = document.getElementById('channel-input').value.trim();
  var error_message = document.getElementById('channel-error-paragraph');
  var channel_error_section = document.getElementById('channel-creation-error');
  var channel_error_paragrah = document.getElementById('channel-error-paragraph');
  var username = storage.getItem('username');
  var date = new Date();
  var time = new Date().toLocaleTimeString('en-US', { hour12: false,
                                             hour: "numeric",
                                             minute: "numeric"});

  if (channel_name != '') {
    channel_error_section.style.display = 'block';
    socket.emit('create_channel', {'channel_name':channel_name});
    socket.emit('join', {'username':username,'channel':channel_name, 'date':toDateTime(date), 'time':time});
  }
  else {
    channel_error_section.style.display = 'block';
    channel_error_paragrah.innerHTML = 'Please enter a channel name';
  }
}

$(document).ready(function () {
  $('.join-button').click(function () {
    var channel_name = document.getElementById('channel-name-span').innerHTML;
    var username = storage.getItem('username');
    var date = new Date();
    var time = new Date().toLocaleTimeString('en-US', { hour12: false,
                                             hour: "numeric",
                                             minute: "numeric"});

    if ($(this)[0].innerText.trim() == 'Yes') {
      socket.emit('join', {'username':username,'channel':channel_name, 'date':toDateTime(date), 'time':time});
    }
    var modal2 = document.getElementById('join-modal');
    modal2.style.display = 'none';
  });
});

