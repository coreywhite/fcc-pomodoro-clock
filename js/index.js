//Create CountDown object
var CountDown = function (time, displayCallback, doneCallback) {
  this.totalTime = time;
  this.timeRemaining = time;
  this.displayCallback = displayCallback;
  this.doneCallback = doneCallback;
  this.running = false;
  this.interval = null;
};

//Update both the countdown's remaining time and its total.
CountDown.prototype.SetTime = function (time) {
  this.totalTime = time;
  this.timeRemaining = time;
};

//Return percentage of total time remaining.
CountDown.prototype.PercentRemaining = function () {
  return 100 * this.timeRemaining / this.totalTime;
};

//Return current state of the countdown.
CountDown.prototype.IsRunning = function () {
  return this.running;
};

// Update the remaining time. Call display update. Check for done.
CountDown.prototype.updateClock = function () {
  if (this.running) {
    this.timeRemaining = Date.parse(this.targetTime) - Date.now();
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.running = false;
      this.doneCallback();
    }
  } else {
    clearInterval(this.interval);
  }
  this.UpdateDisplay();
};

//Start countdown
CountDown.prototype.Start = function () {
  if (!this.running) {
    this.running = true;
    this.targetTime = new Date(Date.now() + this.timeRemaining);
    var self = this;
    this.interval = setInterval(function () { self.updateClock(); }, 1000);
    //Update once immediately without waiting for interval to pass
    this.updateClock();
  }
};

//Pause countdown (retain time remaining)
CountDown.prototype.Pause = function () {
  if (this.running) {
    this.running = false;
    this.UpdateDisplay();
  }
};

//Swap countdown between running and paused depending on current state
CountDown.prototype.Toggle = function () {
  if (this.running) {
    this.Pause();
  } else {
    this.Start();
  }
};

//Reset the countdown and update the clock and display.
CountDown.prototype.Reset = function (time) {
  this.running = false;
  this.SetTime(time);
  this.updateClock();
};

//Send minutes, seconds, and percent remaining to the display callback.
CountDown.prototype.UpdateDisplay = function () {
  var minutes = Math.floor(this.timeRemaining / (1000 * 60));
  var seconds = Math.floor(this.timeRemaining / 1000) % 60;
  var pct = this.PercentRemaining();
  this.displayCallback(minutes, seconds, pct);
};

//Run code when page is ready
$(document).ready(function () {

  //Track whether we are in the "Work" or "Break" stage of a Pomodoro sequence.
  var pomState = "Work";

  //Grab work and break time settngs from the DOM.
  var getWorkTime = function () {
    return parseInt($("#work-minutes").text(), 10) * 60 * 1000;
  }
  var getBreakTime = function () {
    return parseInt($("#break-minutes").text(), 10) * 60 * 1000;
  }

  //Helper function to increment an integer in the DOM, but constrain it to be
  //at least "min". Return whether or not the incremeent was possible.
  var incrementInt = function (jObj, increment, min) {
    var curNum = parseInt(jObj.text(), 10);
    curNum += increment;
    if (curNum >= min) {
      jObj.text(curNum);
      return true;
    }
    return false;
  }

  //Function to display a countdown's current state in HTML.
  var countdownDisplay = function (minutes, seconds, percent) {
    $("#clock-minutes").text(("00" + minutes).slice(-2));
    $("#clock-seconds").text(("00" + seconds).slice(-2));
    $("#clock-indicator").width(percent.toFixed(2) + "%");
  };

  //Trigger the "Done" audio element to play a sound
  var playDoneSound = function () {
    $("#donesound").prop("volume", 1);
    $("#donesound").trigger("play");
  };

  //Function to call when the countdown finishes and switch to the next
  //Pomodoro stage.
  var countdownFinished = function () {
    playDoneSound();
    if (pomState === "Work") {
      pomState = "Break";
      $("#clock-message").text("Break time! Enjoy it!")
      $("#clock-message").addClass("alert alert-info");
    } else {
      pomState = "Work";
      $("#clock-message").text("Work hard! Not long until a break.");
      $("#clock-message").addClass("alert alert-info");
    }
    resetCountdown();
    startCountdown();
  };

  //Create countdown and update the initial display
  var countdown = new CountDown(getWorkTime(), countdownDisplay, countdownFinished);
  countdown.UpdateDisplay();

  //Create function to reset the current countdown object and the play/pause button.
  var resetCountdown = function () {
    if (pomState === "Work") {
      countdown.Reset(getWorkTime());
    } else {
      countdown.Reset(getBreakTime());
    }
    $("#start-pause-button").children("span").removeClass("glyphicon-pause");
    $("#start-pause-button").children("span").addClass("glyphicon-play");
  }

  //Create function to force-start the countdown and update the play/pause button.
  var startCountdown = function () {
    countdown.Start();
    $("#start-pause-button").children("span").removeClass("glyphicon-play");
    $("#start-pause-button").children("span").addClass("glyphicon-pause");
  }

  // Toggle state of the Play/Pause button and toggle the countdown state.
  $("#start-pause-button").on("click", function (event) {
    $(this).children("span").toggleClass("glyphicon-pause glyphicon-play");
    countdown.Toggle();
  });

  //Reset countdown
  $("#reset-button").on("click", function (event) {
    resetCountdown();
  });

  //For the time settings, only reset the countdown if the currently-running
  //clock is affected (e.g., increasing work time while the work clock is running).
  //Also only reset if the increment is actually valid (can't go below 1 minute).
  $("#work-minus").on("click", function (event) {
    if (incrementInt($("#work-minutes"), -1, 1) && pomState === "Work") {
      resetCountdown();
    }
  });
  $("#work-plus").on("click", function (event) {
    if (incrementInt($("#work-minutes"), 1, 1) && pomState === "Work") {
      resetCountdown();
    }
  });
  $("#break-minus").on("click", function (event) {
    if (incrementInt($("#break-minutes"), -1, 1) && pomState === "Break") {
      resetCountdown();
    }
  });
  $("#break-plus").on("click", function (event) {
    if (incrementInt($("#break-minutes"), 1, 1) && pomState === "Break") {
      resetCountdown();
    }
  });
});